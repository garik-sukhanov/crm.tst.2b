import { supabase, type TaskStatus, unwrap } from '@/shared/api';

export type StatusChangeRecord = {
  taskId: string;
  from: TaskStatus | null;
  to: TaskStatus;
  at: string;
};

/** Все смены статусов, которые видит пользователь (RLS: исполнитель — только по своим задачам). */
export const fetchStatusHistory = async (): Promise<StatusChangeRecord[]> =>
  unwrap(
    await supabase
      .from('task_status_history')
      .select('task_id, from_status, to_status, changed_at')
      .order('changed_at'),
  ).map((row) => ({
    taskId: row.task_id,
    from: row.from_status,
    to: row.to_status,
    at: row.changed_at,
  }));
