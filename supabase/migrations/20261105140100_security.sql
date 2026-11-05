-- =============================================================================
-- Безопасность: права на таблицы, RLS, смена статуса только через функцию,
-- неизменяемая история и комментарии.
--
-- Принцип: по умолчанию запрещено всё, разрешения выдаются точечно — на уровне
-- таблиц и отдельных колонок (GRANT) и на уровне строк (RLS-политики).
-- Ошибки бизнес-правил — собственные коды SQLSTATE, интерфейс их распознаёт:
--   CRM01 — переход статуса запрещён
--   CRM02 — переход выполняет другая роль
--   CRM03 — для перехода нужен комментарий
--   CRM04 — задача не найдена (или недоступна)
--   CRM05 — исполнителем можно назначить только пользователя с ролью «исполнитель»
--   CRM06 — статус меняется только через change_task_status
--   CRM07 — запись неизменяема
-- =============================================================================

-- Служебная схема: функции для политик. Не публикуется через API.
create schema if not exists private;
grant usage on schema private to authenticated;

-- Роль текущего пользователя
create function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function private.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_app_role() = 'manager', false);
$$;

-- Видит ли текущий пользователь задачу: постановщик — любую, исполнитель — свою.
create function private.can_see_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = p_task_id
      and (private.is_manager() or t.assignee_id = auth.uid())
  );
$$;

-- Видит ли текущий пользователь объект: постановщик — любой, исполнитель — тот,
-- где у него есть задачи.
create function private.can_see_object(p_object_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_manager() or exists (
    select 1
    from public.tasks t
    where t.object_id = p_object_id
      and t.assignee_id = auth.uid()
  );
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

-- -----------------------------------------------------------------------------
-- Права на таблицы. Сначала забираем всё, что Supabase выдаёт по умолчанию.
-- -----------------------------------------------------------------------------

revoke all on
  public.profiles,
  public.objects,
  public.tasks,
  public.task_status_transitions,
  public.task_status_history,
  public.task_comments
from anon, authenticated;

-- Профили: только чтение (имена и роли нужны для подписи авторов и выбора исполнителя).
grant select on public.profiles to authenticated;

-- Объекты: читать; создавать, править, удалять — только название и адрес.
grant select, delete on public.objects to authenticated;
grant insert (name, address) on public.objects to authenticated;
grant update (name, address) on public.objects to authenticated;

-- Задачи: колонки status, author_id, number, created_at через API не пишутся вообще.
grant select, delete on public.tasks to authenticated;
grant insert (object_id, title, description, assignee_id) on public.tasks to authenticated;
grant update (object_id, title, description, assignee_id) on public.tasks to authenticated;

-- Справочник переходов: только чтение.
grant select on public.task_status_transitions to authenticated;

-- История: только чтение. Пишет её только база.
grant select on public.task_status_history to authenticated;

-- Комментарии: читать и добавлять (только текст и задачу; автор и время — из базы).
grant select on public.task_comments to authenticated;
grant insert (task_id, body) on public.task_comments to authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.objects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_status_transitions enable row level security;
alter table public.task_status_history enable row level security;
alter table public.task_comments enable row level security;

-- profiles
create policy "profiles: читают все вошедшие"
  on public.profiles for select to authenticated
  using (true);

-- objects
create policy "objects: постановщик — все, исполнитель — где есть его задачи"
  on public.objects for select to authenticated
  using (private.can_see_object(id));

create policy "objects: создаёт постановщик"
  on public.objects for insert to authenticated
  with check (private.is_manager() and created_by = auth.uid());

create policy "objects: правит постановщик"
  on public.objects for update to authenticated
  using (private.is_manager())
  with check (private.is_manager());

create policy "objects: удаляет постановщик"
  on public.objects for delete to authenticated
  using (private.is_manager());

-- tasks
create policy "tasks: постановщик — все, исполнитель — свои"
  on public.tasks for select to authenticated
  using (private.is_manager() or assignee_id = auth.uid());

create policy "tasks: создаёт постановщик"
  on public.tasks for insert to authenticated
  with check (private.is_manager() and author_id = auth.uid());

create policy "tasks: правит постановщик"
  on public.tasks for update to authenticated
  using (private.is_manager())
  with check (private.is_manager());

create policy "tasks: удаляет постановщик"
  on public.tasks for delete to authenticated
  using (private.is_manager());

-- task_status_transitions
create policy "transitions: читают все вошедшие"
  on public.task_status_transitions for select to authenticated
  using (true);

-- task_status_history: политик на запись нет — значит, запись запрещена.
create policy "history: видна тем, кто видит задачу"
  on public.task_status_history for select to authenticated
  using (private.can_see_task(task_id));

-- task_comments
create policy "comments: видны тем, кто видит задачу"
  on public.task_comments for select to authenticated
  using (private.can_see_task(task_id));

create policy "comments: пишет тот, кто видит задачу, от своего имени"
  on public.task_comments for insert to authenticated
  with check (author_id = auth.uid() and private.can_see_task(task_id));

-- -----------------------------------------------------------------------------
-- Триггеры-стражи (страховка поверх GRANT/RLS — работают даже для владельца таблиц)
-- -----------------------------------------------------------------------------

-- Исполнитель задачи — только пользователь с ролью «исполнитель».
create function private.check_task_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles where id = new.assignee_id and role = 'executor'
  ) then
    raise exception 'Исполнителем можно назначить только пользователя с ролью «исполнитель»'
      using errcode = 'CRM05';
  end if;
  return new;
end;
$$;

create trigger tasks_check_assignee
  before insert or update of assignee_id on public.tasks
  for each row execute function private.check_task_assignee();

-- Статус меняется только внутри change_task_status.
create function private.guard_task_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.status <> 'new' then
    raise exception 'Новая задача создаётся в статусе «Новая»' using errcode = 'CRM06';
  end if;
  if tg_op = 'UPDATE'
     and new.status is distinct from old.status
     and coalesce(current_setting('app.status_change', true), '') <> 'on' then
    raise exception 'Статус меняется только через change_task_status' using errcode = 'CRM06';
  end if;
  return new;
end;
$$;

create trigger tasks_guard_status
  before insert or update of status on public.tasks
  for each row execute function private.guard_task_status();

-- Первая запись истории: «—» → «Новая».
create function private.log_task_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.task_status_history (task_id, from_status, to_status, changed_by)
  values (new.id, null, new.status, new.author_id);
  return new;
end;
$$;

create trigger tasks_log_created
  after insert on public.tasks
  for each row execute function private.log_task_created();

-- История и комментарии не редактируются никем.
create function private.forbid_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Запись неизменяема' using errcode = 'CRM07';
end;
$$;

create trigger task_status_history_immutable
  before update on public.task_status_history
  for each row execute function private.forbid_update();

create trigger task_comments_immutable
  before update on public.task_comments
  for each row execute function private.forbid_update();

-- -----------------------------------------------------------------------------
-- Смена статуса — единственный путь
-- -----------------------------------------------------------------------------

create function public.change_task_status(
  p_task_id uuid,
  p_to_status public.task_status,
  p_comment text default null
)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.app_role;
  v_task public.tasks;
  v_rule public.task_status_transitions;
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
begin
  if v_uid is null then
    raise exception 'Нужно войти в систему' using errcode = '28000';
  end if;

  select role into v_role from public.profiles where id = v_uid;
  if v_role is null then
    raise exception 'Профиль пользователя не найден' using errcode = '28000';
  end if;

  -- Блокируем строку, чтобы два одновременных запроса не прошли оба.
  select * into v_task from public.tasks where id = p_task_id for update;

  -- Исполнителю чужая задача «не существует» — не раскрываем даже факт её наличия.
  if not found or (v_role = 'executor' and v_task.assignee_id <> v_uid) then
    raise exception 'Задача не найдена' using errcode = 'CRM04';
  end if;

  select * into v_rule
  from public.task_status_transitions
  where from_status = v_task.status and to_status = p_to_status;

  if not found then
    raise exception 'Переход «%» → «%» запрещён', v_task.status, p_to_status
      using errcode = 'CRM01';
  end if;

  if v_rule.actor_role <> v_role then
    raise exception 'Этот переход выполняет другая роль' using errcode = 'CRM02';
  end if;

  if v_rule.requires_comment and v_comment is null then
    raise exception 'Для этого перехода нужен комментарий' using errcode = 'CRM03';
  end if;

  perform set_config('app.status_change', 'on', true);

  update public.tasks
  set status = p_to_status
  where id = p_task_id
  returning * into v_task;

  perform set_config('app.status_change', 'off', true);

  insert into public.task_status_history (task_id, from_status, to_status, comment, changed_by)
  values (p_task_id, v_rule.from_status, p_to_status, v_comment, v_uid);

  return v_task;
end;
$$;

comment on function public.change_task_status is
  'Смена статуса задачи по правилам task_status_transitions с записью в историю';

revoke all on function public.change_task_status(uuid, public.task_status, text) from public, anon;
grant execute on function public.change_task_status(uuid, public.task_status, text) to authenticated;

-- Служебные функции схемы public не должны вызываться через API.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
