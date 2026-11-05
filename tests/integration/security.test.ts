/**
 * Интеграционные тесты: обращаемся к Supabase напрямую, в обход интерфейса,
 * как это сделал бы любопытный пользователь с публичным ключом.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TASK_TRANSITIONS } from '../../src/entities/task/config/status.ts';
import type { TaskStatus } from '../../src/shared/api/types.ts';
import { anonClient, type Client, OBJECTS, signIn, USERS } from './helpers.ts';

let manager: Client;
let kovalev: Client;
let orlov: Client;
const createdTaskIds: string[] = [];

beforeAll(async () => {
  [manager, kovalev, orlov] = await Promise.all([
    signIn('manager'),
    signIn('kovalev'),
    signIn('orlov'),
  ]);
});

afterAll(async () => {
  if (createdTaskIds.length) await manager.from('tasks').delete().in('id', createdTaskIds);
});

const createTask = async (assignee: keyof typeof USERS = 'kovalev') => {
  const { data, error } = await manager
    .from('tasks')
    .insert({
      object_id: OBJECTS.severny,
      title: 'Интеграционный тест',
      assignee_id: USERS[assignee].id,
    })
    .select()
    .single();
  if (error) throw error;
  createdTaskIds.push(data.id);
  return data;
};

describe('регистрация и вход', () => {
  it('открытая регистрация выключена', async () => {
    const { data, error } = await anonClient().auth.signUp({
      email: `intruder-${Date.now()}@stroy.example`,
      password: 'Intruder-12345',
    });
    expect(error).not.toBeNull();
    expect(data.user).toBeNull();
  });

  it('неверный пароль не пускает', async () => {
    const { error } = await anonClient().auth.signInWithPassword({
      email: USERS.manager.email,
      password: 'wrong-password',
    });
    expect(error).not.toBeNull();
  });

  it('без входа данные не читаются', async () => {
    const { data, error } = await anonClient().from('tasks').select('id');
    expect(data ?? []).toHaveLength(0);
    expect(error?.code).toBe('42501');
  });
});

describe('видимость', () => {
  it('исполнитель видит только свои задачи', async () => {
    const { data } = await kovalev.from('tasks').select('assignee_id');
    expect(data?.length).toBeGreaterThan(0);
    expect(data?.every((t) => t.assignee_id === USERS.kovalev.id)).toBe(true);
  });

  it('исполнитель не получает чужую задачу даже по прямому id', async () => {
    const { data: orlovTasks } = await orlov.from('tasks').select('id');
    const foreignId = orlovTasks?.[0]?.id;
    expect(foreignId).toBeDefined();
    const { data } = await kovalev
      .from('tasks')
      .select('id')
      .eq('id', foreignId as string);
    expect(data).toEqual([]);
  });

  it('исполнитель видит только объекты со своими задачами', async () => {
    const { data } = await orlov.from('objects').select('id');
    expect(data?.map((o) => o.id).sort()).toEqual([OBJECTS.severny, OBJECTS.mitino].sort());
  });

  it('постановщик видит все объекты', async () => {
    const { data } = await manager.from('objects').select('id');
    expect(data).toHaveLength(3);
  });
});

describe('правила переходов в интерфейсе совпадают с базой', () => {
  it('task_status_transitions == TASK_TRANSITIONS', async () => {
    const { data } = await manager.from('task_status_transitions').select('*');
    const fromDb = (data ?? [])
      .map((r) => `${r.from_status}>${r.to_status}:${r.actor_role}:${r.requires_comment}`)
      .sort();
    const fromUi = TASK_TRANSITIONS.map(
      (t) => `${t.from}>${t.to}:${t.actorRole}:${t.requiresComment}`,
    ).sort();
    expect(fromDb).toEqual(fromUi);
  });
});

describe('полный цикл задачи', () => {
  it('Новая → В работе → На проверке → На доработке → В работе → На проверке → Принята', async () => {
    const task = await createTask('kovalev');
    expect(task.status).toBe('new');
    expect(task.author_id).toBe(USERS.manager.id);

    const move = (client: Client, to: TaskStatus, comment?: string) =>
      client.rpc('change_task_status', {
        p_task_id: task.id,
        p_to_status: to,
        ...(comment ? { p_comment: comment } : {}),
      });

    expect((await move(kovalev, 'in_progress')).error).toBeNull();
    expect((await move(kovalev, 'review')).error).toBeNull();
    expect((await move(manager, 'rework')).error?.code).toBe('CRM03');
    expect((await move(manager, 'rework', 'Переделать узел')).error).toBeNull();
    expect((await move(kovalev, 'in_progress')).error).toBeNull();
    expect((await move(kovalev, 'review')).error).toBeNull();
    expect((await move(kovalev, 'done')).error?.code).toBe('CRM02');
    expect((await move(manager, 'done')).error).toBeNull();

    const { data: history } = await kovalev
      .from('task_status_history')
      .select('from_status, to_status, comment, changed_by')
      .eq('task_id', task.id)
      .order('id');
    expect(history?.map((h) => h.to_status)).toEqual([
      'new',
      'in_progress',
      'review',
      'rework',
      'in_progress',
      'review',
      'done',
    ]);
    expect(history?.[3]).toMatchObject({
      comment: 'Переделать узел',
      changed_by: USERS.manager.id,
    });
  });

  it('другой исполнитель не может двигать задачу', async () => {
    const task = await createTask('kovalev');
    const { error } = await orlov.rpc('change_task_status', {
      p_task_id: task.id,
      p_to_status: 'in_progress',
    });
    expect(error?.code).toBe('CRM04');
  });

  it('статус нельзя поменять прямым UPDATE даже постановщику', async () => {
    const task = await createTask('kovalev');
    const { error } = await manager.from('tasks').update({ status: 'done' }).eq('id', task.id);
    expect(error?.code).toBe('42501');
  });

  it('при создании нельзя подставить статус или автора', async () => {
    const { error: statusError } = await manager.from('tasks').insert({
      object_id: OBJECTS.severny,
      title: 'x',
      assignee_id: USERS.kovalev.id,
      status: 'done',
    });
    expect(statusError?.code).toBe('42501');

    const { error: authorError } = await manager.from('tasks').insert({
      object_id: OBJECTS.severny,
      title: 'x',
      assignee_id: USERS.kovalev.id,
      author_id: USERS.orlov.id,
    });
    expect(authorError?.code).toBe('42501');
  });
});

describe('история и комментарии', () => {
  it('историю нельзя подделать, изменить или удалить', async () => {
    const task = await createTask('kovalev');
    const insert = await manager.from('task_status_history').insert({
      task_id: task.id,
      to_status: 'done',
      changed_by: USERS.manager.id,
    });
    expect(insert.error?.code).toBe('42501');

    const update = await manager
      .from('task_status_history')
      .update({ comment: 'подделка' })
      .eq('task_id', task.id);
    expect(update.error?.code).toBe('42501');

    const remove = await manager.from('task_status_history').delete().eq('task_id', task.id);
    expect(remove.error?.code).toBe('42501');
  });

  it('исполнитель пишет в чат своей задачи, но не может писать от чужого имени', async () => {
    const task = await createTask('kovalev');
    const ok = await kovalev
      .from('task_comments')
      .insert({ task_id: task.id, body: 'Принял' })
      .select()
      .single();
    expect(ok.error).toBeNull();
    expect(ok.data?.author_id).toBe(USERS.kovalev.id);

    const spoof = await kovalev
      .from('task_comments')
      .insert({ task_id: task.id, body: 'x', author_id: USERS.manager.id });
    expect(spoof.error?.code).toBe('42501');

    const edit = await kovalev
      .from('task_comments')
      .update({ body: 'исправил' })
      .eq('id', ok.data?.id ?? 0);
    expect(edit.error?.code).toBe('42501');
  });

  it('чужой исполнитель не пишет в задачу и не читает переписку', async () => {
    const task = await createTask('kovalev');
    const insert = await orlov.from('task_comments').insert({ task_id: task.id, body: 'x' });
    expect(insert.error?.code).toBe('42501');
    const { data } = await orlov.from('task_comments').select('id').eq('task_id', task.id);
    expect(data).toEqual([]);
  });
});

describe('роль нельзя присвоить себе', () => {
  it('исполнитель не может записать себе роль постановщика в profiles', async () => {
    const { data, error } = await kovalev
      .from('profiles')
      .update({ role: 'manager' })
      .eq('id', USERS.kovalev.id)
      .select();
    expect(error?.code).toBe('42501');
    expect(data ?? []).toHaveLength(0);
  });

  it('роль в user_metadata (её пользователь меняет сам) ни на что не влияет', async () => {
    const client = await signIn('kovalev');
    const { error: metaError } = await client.auth.updateUser({ data: { role: 'manager' } });
    expect(metaError).toBeNull();
    await client.auth.refreshSession();

    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', USERS.kovalev.id)
      .single();
    expect(profile?.role).toBe('executor');

    // Права по-прежнему исполнительские: создать объект нельзя, чужого не видно.
    const insert = await client.from('objects').insert({ name: 'x', address: 'y' });
    expect(insert.error?.code).toBe('42501');
    const { data: tasks } = await client.from('tasks').select('assignee_id');
    expect(tasks?.every((t) => t.assignee_id === USERS.kovalev.id)).toBe(true);

    await client.auth.updateUser({ data: { role: null } });
  });

  it('исполнитель не может создать себе профиль или удалить чужой', async () => {
    const insert = await kovalev
      .from('profiles')
      .insert({ id: USERS.kovalev.id, full_name: 'x', role: 'manager' });
    expect(insert.error?.code).toBe('42501');
    const remove = await kovalev.from('profiles').delete().eq('id', USERS.orlov.id);
    expect(remove.error?.code).toBe('42501');
  });

  it('служебные функции базы нельзя вызвать через API', async () => {
    const { error } = await kovalev.rpc('handle_new_user' as never);
    expect(error).not.toBeNull();
  });
});
