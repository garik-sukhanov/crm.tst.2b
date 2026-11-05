import { ensureOk, supabase, type TaskStatus, unwrap } from '@/shared/api';

type Ref = { id: string; fullName: string };

export type FeedItem =
  | {
      kind: 'status';
      id: string;
      at: string;
      actor: Ref;
      from: TaskStatus | null;
      to: TaskStatus;
      comment: string | null;
    }
  | { kind: 'comment'; id: string; at: string; actor: Ref; body: string };

type Person = { id: string; full_name: string } | null;
const ref = (p: Person): Ref =>
  p ? { id: p.id, fullName: p.full_name } : { id: '', fullName: 'Неизвестно' };

/** Лента задачи: смены статусов и сообщения, по времени. */
export const fetchTaskFeed = async (taskId: string): Promise<FeedItem[]> => {
  const [history, comments] = await Promise.all([
    supabase
      .from('task_status_history')
      .select(
        'id, from_status, to_status, comment, changed_at, actor:profiles!task_status_history_changed_by_fkey(id, full_name)',
      )
      .eq('task_id', taskId)
      .returns<
        {
          id: number;
          from_status: TaskStatus | null;
          to_status: TaskStatus;
          comment: string | null;
          changed_at: string;
          actor: Person;
        }[]
      >(),
    supabase
      .from('task_comments')
      .select('id, body, created_at, actor:profiles!task_comments_author_id_fkey(id, full_name)')
      .eq('task_id', taskId)
      .returns<{ id: number; body: string; created_at: string; actor: Person }[]>(),
  ]);

  return mergeFeed(
    unwrap(history).map((h) => ({
      kind: 'status' as const,
      id: `s${h.id}`,
      at: h.changed_at,
      actor: ref(h.actor),
      from: h.from_status,
      to: h.to_status,
      comment: h.comment,
    })),
    unwrap(comments).map((c) => ({
      kind: 'comment' as const,
      id: `c${c.id}`,
      at: c.created_at,
      actor: ref(c.actor),
      body: c.body,
    })),
  );
};

export const mergeFeed = (...lists: FeedItem[][]): FeedItem[] =>
  lists.flat().sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));

export const addComment = async ({ taskId, body }: { taskId: string; body: string }) => {
  ensureOk(await supabase.from('task_comments').insert({ task_id: taskId, body: body.trim() }));
};
