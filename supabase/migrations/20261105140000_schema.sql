-- =============================================================================
-- Схема: роли, объекты (стройки), задачи, история статусов, комментарии.
-- Права доступа — в следующей миграции (security).
-- =============================================================================

-- Типы ------------------------------------------------------------------------

create type public.app_role as enum ('manager', 'executor');

create type public.task_status as enum ('new', 'in_progress', 'review', 'rework', 'done');

comment on type public.app_role is 'manager — постановщик, executor — исполнитель';

-- Профили ---------------------------------------------------------------------
-- Одна строка на пользователя auth.users. Роль задаёт администратор при создании
-- пользователя (app_metadata.role) — сам пользователь поменять её не может.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  role public.app_role not null default 'executor',
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Пользователи системы и их роли';

-- Объекты (стройки) -----------------------------------------------------------

create table public.objects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  address text not null check (char_length(btrim(address)) between 1 and 500),
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.objects is 'Объекты — стройки';

-- Задачи ----------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  -- Короткий номер для людей: Т-014
  number bigint generated always as identity unique,
  object_id uuid not null references public.objects (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 5000),
  assignee_id uuid not null references public.profiles (id),
  status public.task_status not null default 'new',
  author_id uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_object_id_idx on public.tasks (object_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);

comment on table public.tasks is 'Задачи по объектам';

-- Допустимые переходы статусов ------------------------------------------------
-- Единственный источник правды о переходах. Интерфейс читает эту же таблицу,
-- чтобы показывать только доступные действия.

create table public.task_status_transitions (
  from_status public.task_status not null,
  to_status public.task_status not null,
  actor_role public.app_role not null,
  requires_comment boolean not null default false,
  primary key (from_status, to_status)
);

comment on table public.task_status_transitions is
  'Разрешённые переходы статусов (ТЗ 2.3). Всё, чего здесь нет, запрещено.';

insert into public.task_status_transitions (from_status, to_status, actor_role, requires_comment)
values
  ('new',         'in_progress', 'executor', false),
  ('in_progress', 'review',      'executor', false),
  ('review',      'done',        'manager',  false),
  ('review',      'rework',      'manager',  true),
  ('rework',      'in_progress', 'executor', false);

-- История статусов ------------------------------------------------------------

create table public.task_status_history (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.tasks (id) on delete cascade,
  from_status public.task_status, -- null — задача только что создана
  to_status public.task_status not null,
  comment text check (comment is null or char_length(comment) <= 2000),
  changed_by uuid not null references public.profiles (id),
  changed_at timestamptz not null default now()
);

create index task_status_history_task_id_idx on public.task_status_history (task_id, changed_at);

comment on table public.task_status_history is
  'Журнал смен статусов. Пишется только функциями базы, через API не изменяется.';

-- Комментарии (чат задачи) ----------------------------------------------------

create table public.task_comments (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index task_comments_task_id_idx on public.task_comments (task_id, created_at);

comment on table public.task_comments is 'Переписка по задаче. Сообщения не редактируются и не удаляются.';

-- updated_at ------------------------------------------------------------------

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger objects_touch_updated_at
  before update on public.objects
  for each row execute function public.touch_updated_at();

create trigger tasks_touch_updated_at
  before update on public.tasks
  for each row execute function public.touch_updated_at();

-- Профиль при создании пользователя -------------------------------------------
-- Роль берётся из app_metadata (её может задать только администратор / service_role),
-- имя — из user_metadata.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
begin
  v_role := case new.raw_app_meta_data ->> 'role'
    when 'manager' then 'manager'::public.app_role
    else 'executor'::public.app_role
  end;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    v_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
