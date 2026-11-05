import { supabase, type TaskStatus, unwrap } from '@/shared/api';

type Ref = { id: string; fullName: string };

export type Task = {
  id: string;
  number: number;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  objectId: string;
  object: { id: string; name: string };
  assigneeId: string;
  assignee: Ref;
  author: Ref;
};

export type TaskInput = {
  title: string;
  description: string;
  assigneeId: string;
};

const TASK_SELECT = `
  id, number, title, description, status, created_at, updated_at, object_id, assignee_id,
  object:objects!tasks_object_id_fkey(id, name),
  assignee:profiles!tasks_assignee_id_fkey(id, full_name),
  author:profiles!tasks_author_id_fkey(id, full_name)
` as const;

type TaskRow = {
  id: string;
  number: number;
  title: string;
  description: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  object_id: string;
  assignee_id: string;
  object: { id: string; name: string } | null;
  assignee: { id: string; full_name: string } | null;
  author: { id: string; full_name: string } | null;
};

const ref = (p: { id: string; full_name: string } | null): Ref =>
  p ? { id: p.id, fullName: p.full_name } : { id: '', fullName: 'Неизвестно' };

export const toTask = (row: TaskRow): Task => ({
  id: row.id,
  number: row.number,
  title: row.title,
  description: row.description,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  objectId: row.object_id,
  object: row.object ?? { id: row.object_id, name: '' },
  assigneeId: row.assignee_id,
  assignee: ref(row.assignee),
  author: ref(row.author),
});

const select = () => supabase.from('tasks').select(TASK_SELECT);

export const fetchTasksByObject = async (objectId: string): Promise<Task[]> =>
  unwrap(await select().eq('object_id', objectId).order('number').returns<TaskRow[]>()).map(toTask);

export const fetchTasksAssignedTo = async (userId: string): Promise<Task[]> =>
  unwrap(
    await select()
      .eq('assignee_id', userId)
      .order('updated_at', { ascending: false })
      .returns<TaskRow[]>(),
  ).map(toTask);

export const fetchAllTasks = async (): Promise<Task[]> =>
  unwrap(await select().order('number').returns<TaskRow[]>()).map(toTask);

export const fetchTask = async (id: string): Promise<Task> => {
  const rows = unwrap(await select().eq('id', id).limit(1).returns<TaskRow[]>());
  const row = rows[0];
  if (!row) throw Object.assign(new Error('not found'), { code: 'CRM04' });
  return toTask(row);
};

export const createTask = async (input: TaskInput & { objectId: string }): Promise<Task> => {
  const created = unwrap(
    await supabase
      .from('tasks')
      .insert({
        object_id: input.objectId,
        title: input.title.trim(),
        description: input.description.trim(),
        assignee_id: input.assigneeId,
      })
      .select('id')
      .single(),
  );
  return fetchTask(created.id);
};

export const updateTask = async ({ id, ...input }: TaskInput & { id: string }): Promise<Task> => {
  unwrap(
    await supabase
      .from('tasks')
      .update({
        title: input.title.trim(),
        description: input.description.trim(),
        assignee_id: input.assigneeId,
      })
      .eq('id', id)
      .select('id')
      .single(),
  );
  return fetchTask(id);
};

export const deleteTask = async (id: string): Promise<void> => {
  const rows = unwrap(await supabase.from('tasks').delete().eq('id', id).select('id'));
  if (rows.length === 0) throw Object.assign(new Error('not deleted'), { code: '42501' });
};

export type StatusChange = { taskId: string; to: TaskStatus; comment?: string };

/** Смена статуса — только через функцию базы. Возвращает новый статус и время. */
export const changeTaskStatus = async ({ taskId, to, comment }: StatusChange) => {
  const row = unwrap(
    await supabase.rpc('change_task_status', {
      p_task_id: taskId,
      p_to_status: to,
      ...(comment?.trim() ? { p_comment: comment.trim() } : {}),
    }),
  );
  return { id: row.id, status: row.status, updatedAt: row.updated_at };
};
