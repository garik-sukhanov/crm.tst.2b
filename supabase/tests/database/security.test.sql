-- Тесты правил доступа (ТЗ, раздел 3). Запуск: pnpm test:db
-- Работают поверх сида: manager / kovalev / orlov, задачи bbbbbbbb-…-01..08.
begin;
create extension if not exists pgtap with schema extensions;

select plan(34);

-- Помощники: войти как пользователь / как аноним ---------------------------------
create function pg_temp.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
end $$;

create function pg_temp.login_anon() returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end $$;

create function pg_temp.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

-- Идентификаторы из сида
\set manager '\'11111111-1111-4111-8111-111111111111\''
\set kovalev '\'22222222-2222-4222-8222-222222222222\''
\set orlov   '\'33333333-3333-4333-8333-333333333333\''

-- =============================================================================
-- Видимость
-- =============================================================================

select pg_temp.login(:manager);
select is((select count(*)::int from public.tasks), 8, 'постановщик видит все задачи');
select is((select count(*)::int from public.objects), 3, 'постановщик видит все объекты');

select pg_temp.login(:kovalev);
select is((select count(*)::int from public.tasks), 4, 'исполнитель видит только свои задачи');
select is(
  (select count(*)::int from public.tasks where assignee_id <> :kovalev), 0,
  'среди видимых исполнителю задач нет чужих');
select set_eq(
  'select id from public.objects',
  $$ values ('aaaaaaaa-0000-4000-8000-000000000001'::uuid), ('aaaaaaaa-0000-4000-8000-000000000002'::uuid) $$,
  'исполнитель видит только объекты, где у него есть задачи');
select is(
  (select count(*)::int from public.task_status_history
    where task_id = 'bbbbbbbb-0000-4000-8000-000000000003'), 0,
  'исполнитель не видит историю чужой задачи');
select is(
  (select count(*)::int from public.task_comments
    where task_id = 'bbbbbbbb-0000-4000-8000-000000000003'), 0,
  'исполнитель не видит комментарии чужой задачи');
select ok(
  (select count(*) from public.task_status_history
    where task_id = 'bbbbbbbb-0000-4000-8000-000000000001') > 0,
  'исполнитель видит историю своей задачи');

select pg_temp.login_anon();
select throws_ok('select * from public.tasks', '42501', null, 'аноним не читает задачи');
select throws_ok('select * from public.objects', '42501', null, 'аноним не читает объекты');
select throws_ok(
  $$ select public.change_task_status('bbbbbbbb-0000-4000-8000-000000000004', 'in_progress') $$,
  '42501', null, 'аноним не вызывает смену статуса');

-- =============================================================================
-- Изменение данных исполнителем
-- =============================================================================

select pg_temp.login(:kovalev);
select is_empty(
  $$ update public.tasks set title = 'взлом' where id = 'bbbbbbbb-0000-4000-8000-000000000005' returning id $$,
  'исполнитель не может изменить даже свою задачу');
select is_empty(
  $$ update public.tasks set title = 'взлом' where id = 'bbbbbbbb-0000-4000-8000-000000000003' returning id $$,
  'исполнитель не может изменить чужую задачу');
select is_empty(
  $$ delete from public.tasks where id = 'bbbbbbbb-0000-4000-8000-000000000005' returning id $$,
  'исполнитель не может удалить задачу');
select is_empty(
  $$ delete from public.objects returning id $$,
  'исполнитель не может удалить объект');
select throws_ok(
  $$ insert into public.tasks (object_id, title, assignee_id)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'своя задача', '22222222-2222-4222-8222-222222222222') $$,
  '42501', null, 'исполнитель не может создать задачу');
select throws_ok(
  $$ insert into public.objects (name, address) values ('x', 'y') $$,
  '42501', null, 'исполнитель не может создать объект');
select throws_ok(
  $$ update public.tasks set status = 'done' where id = 'bbbbbbbb-0000-4000-8000-000000000005' $$,
  '42501', null, 'статус нельзя поменять прямым UPDATE');

-- =============================================================================
-- Переходы статусов
-- =============================================================================

select pg_temp.login(:kovalev);
select lives_ok(
  $$ select public.change_task_status('bbbbbbbb-0000-4000-8000-000000000006', 'in_progress') $$,
  'исполнитель: Новая → В работе');
select is(
  (select to_status::text from public.task_status_history
    where task_id = 'bbbbbbbb-0000-4000-8000-000000000006' order by id desc limit 1),
  'in_progress', 'смена статуса записана в историю');
select is(
  (select changed_by from public.task_status_history
    where task_id = 'bbbbbbbb-0000-4000-8000-000000000006' order by id desc limit 1),
  :kovalev::uuid, 'в истории записан тот, кто менял статус');
select throws_ok(
  $$ select public.change_task_status('bbbbbbbb-0000-4000-8000-000000000006', 'done') $$,
  'CRM01', null, 'исполнитель: В работе → Принята запрещено');
select throws_ok(
  $$ select public.change_task_status('bbbbbbbb-0000-4000-8000-000000000004', 'in_progress') $$,
  'CRM04', null, 'исполнитель не может двигать чужую задачу');
select throws_ok(
  $$ select public.change_task_status('bbbbbbbb-0000-4000-8000-000000000002', 'done') $$,
  'CRM02', null, 'исполнитель не может принять задачу');

select pg_temp.login(:manager);
select throws_ok(
  $$ select public.change_task_status('bbbbbbbb-0000-4000-8000-000000000006', 'review') $$,
  'CRM02', null, 'постановщик не отправляет на проверку за исполнителя');
select throws_ok(
  $$ select public.change_task_status('bbbbbbbb-0000-4000-8000-000000000002', 'rework') $$,
  'CRM03', null, 'на доработку без комментария нельзя');
select throws_ok(
  $$ select public.change_task_status('bbbbbbbb-0000-4000-8000-000000000002', 'rework', '   ') $$,
  'CRM03', null, 'комментарий из пробелов не считается');
select lives_ok(
  $$ select public.change_task_status('bbbbbbbb-0000-4000-8000-000000000002', 'rework', 'Переделать') $$,
  'постановщик: На проверке → На доработке с комментарием');
select throws_ok(
  $$ select public.change_task_status('bbbbbbbb-0000-4000-8000-000000000001', 'new') $$,
  'CRM01', null, 'из «Принята» никуда нельзя');

-- =============================================================================
-- История и комментарии
-- =============================================================================

select pg_temp.login(:manager);
select throws_ok(
  $$ insert into public.task_status_history (task_id, to_status, changed_by)
     values ('bbbbbbbb-0000-4000-8000-000000000004', 'done', '11111111-1111-4111-8111-111111111111') $$,
  '42501', null, 'историю нельзя дописать через API');
select throws_ok(
  $$ update public.task_status_history set comment = 'подделка' $$,
  '42501', null, 'историю нельзя изменить через API');
select throws_ok(
  $$ delete from public.task_status_history $$,
  '42501', null, 'историю нельзя удалить через API');

select pg_temp.login(:kovalev);
select throws_ok(
  $$ insert into public.task_comments (task_id, body)
     values ('bbbbbbbb-0000-4000-8000-000000000003', 'в чужую задачу') $$,
  '42501', null, 'исполнитель не пишет в чужую задачу');

-- Постановщик назначает исполнителем только исполнителя
select pg_temp.login(:manager);
select throws_ok(
  $$ insert into public.tasks (object_id, title, assignee_id)
     values ('aaaaaaaa-0000-4000-8000-000000000001', 'x', '11111111-1111-4111-8111-111111111111') $$,
  'CRM05', null, 'исполнителем нельзя назначить постановщика');

select pg_temp.logout();
select * from finish();
rollback;
