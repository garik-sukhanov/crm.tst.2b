-- =============================================================================
-- Тестовые данные: 1 постановщик, 2 исполнителя, 3 объекта, задачи в разных статусах.
-- Пароль у всех тестовых пользователей одинаковый: Stroy-demo-2026
--
--   manager@stroy.example  — Ирина Соколова, постановщик
--   kovalev@stroy.example  — Алексей Ковалёв, исполнитель
--   orlov@stroy.example    — Дмитрий Орлов, исполнитель
--
-- Статусы задач проводятся через change_task_status от имени нужного пользователя —
-- так история получается настоящей, а не вставленной в обход правил.
-- =============================================================================

-- Пользователи ----------------------------------------------------------------

create function pg_temp.create_user(p_id uuid, p_email text, p_name text, p_role text)
returns void
language plpgsql
as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('Stroy-demo-2026', extensions.gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', p_role),
    jsonb_build_object('full_name', p_name),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), p_id, p_id::text,
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now()
  );
end;
$$;

select pg_temp.create_user('11111111-1111-4111-8111-111111111111', 'manager@stroy.example', 'Ирина Соколова', 'manager');
select pg_temp.create_user('22222222-2222-4222-8222-222222222222', 'kovalev@stroy.example', 'Алексей Ковалёв', 'executor');
select pg_temp.create_user('33333333-3333-4333-8333-333333333333', 'orlov@stroy.example', 'Дмитрий Орлов', 'executor');

-- Помощники ---------------------------------------------------------------------

-- Выполнить действие от имени пользователя (auth.uid() читает request.jwt.claims).
create function pg_temp.act_as(p_uid uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
$$;

create function pg_temp.move(p_task uuid, p_uid uuid, p_to public.task_status, p_comment text default null)
returns void
language plpgsql
as $$
begin
  perform pg_temp.act_as(p_uid);
  perform public.change_task_status(p_task, p_to, p_comment);
end;
$$;

-- Объекты -----------------------------------------------------------------------

insert into public.objects (id, name, address, created_by, created_at) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ЖК «Северный», корпус 2', 'Казань, ул. Лесная, 14', '11111111-1111-4111-8111-111111111111', now() - interval '20 days'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Склад логистического центра', 'Подольск, Промышленная ул., 3, стр. 1', '11111111-1111-4111-8111-111111111111', now() - interval '14 days'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'Частный дом в Митино', 'Москва, Пятницкое ш., 48', '11111111-1111-4111-8111-111111111111', now() - interval '6 days');

-- Задачи ------------------------------------------------------------------------

select pg_temp.act_as('11111111-1111-4111-8111-111111111111');

insert into public.tasks (id, object_id, title, description, assignee_id, author_id, created_at) values
  -- ЖК «Северный» — оба исполнителя
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001',
   'Армирование плиты перекрытия 5 этажа', 'Арматура А500С Ø12, шаг 200. Перед бетонированием — фотоотчёт и акт скрытых работ.',
   '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', now() - interval '12 days'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001',
   'Монтаж опалубки лестничного марша', 'Секция 2, отметки +12.000…+15.000.',
   '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', now() - interval '9 days'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001',
   'Гидроизоляция приямков', 'Обмазочная гидроизоляция в два слоя, нахлёст на стены 300 мм.',
   '33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', now() - interval '8 days'),
  ('bbbbbbbb-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000001',
   'Кладка перегородок 3 этажа', 'Газобетон D500, толщина 100 мм. Армирование каждого третьего ряда.',
   '33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', now() - interval '2 days'),
  -- Склад — только Ковалёв
  ('bbbbbbbb-0000-4000-8000-000000000005', 'aaaaaaaa-0000-4000-8000-000000000002',
   'Устройство промышленного пола', 'Топпинг кварцевый, 5 кг/м². Захватка 1, оси А–Г.',
   '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', now() - interval '10 days'),
  ('bbbbbbbb-0000-4000-8000-000000000006', 'aaaaaaaa-0000-4000-8000-000000000002',
   'Монтаж секционных ворот', 'Ворота 4×4 м, 3 шт. Проверить закладные.',
   '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', now() - interval '3 days'),
  -- Дом в Митино — только Орлов
  ('bbbbbbbb-0000-4000-8000-000000000007', 'aaaaaaaa-0000-4000-8000-000000000003',
   'Разводка электрики на втором этаже', 'По проекту ЭМ-2. Кабель ВВГнг-LS, штробы глубиной не более 25 мм.',
   '33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', now() - interval '5 days'),
  ('bbbbbbbb-0000-4000-8000-000000000008', 'aaaaaaaa-0000-4000-8000-000000000003',
   'Утепление кровли', 'Минвата 200 мм, пароизоляция с проклейкой швов.',
   '33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', now() - interval '1 day');

-- Переходы статусов (с настоящей историей) --------------------------------------

-- 1: Принята, через доработку
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'in_progress');
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'review');
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'rework',
  'Шаг арматуры у колонны К-4 больше 200 мм. Переделать и прислать фото.');
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'in_progress');
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'review');
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'done');

-- 2: На проверке
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'in_progress');
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'review');

-- 3: На доработке
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 'in_progress');
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 'review');
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'rework',
  'Не обработаны углы приямка П-2, видны пропуски второго слоя.');

-- 4: Новая — без переходов

-- 5: В работе
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222', 'in_progress');

-- 6: Новая — без переходов

-- 7: Принята
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000007', '33333333-3333-4333-8333-333333333333', 'in_progress');
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000007', '33333333-3333-4333-8333-333333333333', 'review');
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'done');

-- 8: В работе
select pg_temp.move('bbbbbbbb-0000-4000-8000-000000000008', '33333333-3333-4333-8333-333333333333', 'in_progress');

-- Комментарии -------------------------------------------------------------------

insert into public.task_comments (task_id, author_id, body, created_at) values
  ('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Арматура завезена, начинаем завтра с утра.', now() - interval '11 days'),
  ('bbbbbbbb-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Хорошо. Акт скрытых работ не забудьте.', now() - interval '11 days' + interval '20 minutes'),
  ('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Переделали у К-4, фото в папке объекта.', now() - interval '6 days'),
  ('bbbbbbbb-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 'Мастика заканчивается, нужен ещё один бочонок.', now() - interval '4 days'),
  ('bbbbbbbb-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Перед заливкой проверьте отметки нивелиром.', now() - interval '2 days');

-- Растягиваем историю во времени, чтобы она выглядела правдоподобно.
-- Триггер неизменяемости — для пользователей API; сид выполняет владелец базы.
alter table public.task_status_history disable trigger task_status_history_immutable;

with ordered as (
  select h.id, t.created_at as task_created,
         row_number() over (partition by h.task_id order by h.id) as step,
         count(*) over (partition by h.task_id) as total
  from public.task_status_history h
  join public.tasks t on t.id = h.task_id
)
update public.task_status_history h
set changed_at = o.task_created
  + (least(now() - o.task_created, interval '30 days') * (o.step - 1) / greatest(o.total, 1))
from ordered o
where o.id = h.id;

alter table public.task_status_history enable trigger task_status_history_immutable;

-- Последнее изменение задачи — по последней записи истории.
alter table public.tasks disable trigger tasks_touch_updated_at;

update public.tasks t
set updated_at = h.last_change
from (select task_id, max(changed_at) as last_change from public.task_status_history group by task_id) h
where h.task_id = t.id;

alter table public.tasks enable trigger tasks_touch_updated_at;
