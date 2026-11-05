import type { StatusChangeRecord, Task, TaskStatus } from '@/entities/task';

export type StatusCounts = Record<TaskStatus, number>;
export type BreakdownRow = { id: string; label: string; counts: StatusCounts; total: number };
export type DayBucket = { date: string; accepted: number; returned: number };

export type Statistics = {
  total: number;
  open: number;
  waitingReview: number;
  done: number;
  /** Доля задач, которые хоть раз возвращали, среди дошедших до проверки (0..1) или null. */
  reworkRate: number | null;
  /** Среднее время от создания до принятия, часы. */
  avgLeadHours: number | null;
  /** Среднее время, которое задача ждёт решения на проверке, часы. */
  avgReviewHours: number | null;
  byObject: BreakdownRow[];
  byAssignee: BreakdownRow[];
  days: DayBucket[];
};

const HOUR = 3_600_000;

const emptyCounts = (): StatusCounts => ({ new: 0, in_progress: 0, review: 0, rework: 0, done: 0 });

const average = (values: number[]): number | null =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

const breakdown = (tasks: Task[], key: (task: Task) => { id: string; label: string }) => {
  const rows = new Map<string, BreakdownRow>();
  for (const task of tasks) {
    const { id, label } = key(task);
    const row = rows.get(id) ?? { id, label, counts: emptyCounts(), total: 0 };
    row.counts[task.status] += 1;
    row.total += 1;
    rows.set(id, row);
  }
  return [...rows.values()].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
};

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

export const computeStatistics = (
  tasks: Task[],
  history: StatusChangeRecord[],
  now: Date = new Date(),
  days = 14,
): Statistics => {
  const done = tasks.filter((t) => t.status === 'done').length;
  const taskIds = new Set(tasks.map((t) => t.id));
  const relevant = history.filter((h) => taskIds.has(h.taskId));

  const byTask = new Map<string, StatusChangeRecord[]>();
  for (const change of relevant) {
    const list = byTask.get(change.taskId) ?? [];
    list.push(change);
    byTask.set(change.taskId, list);
  }

  // Возвраты: среди задач, хоть раз дошедших до проверки.
  let reviewed = 0;
  let returned = 0;
  const reviewDurations: number[] = [];
  const leadTimes: number[] = [];

  for (const task of tasks) {
    const changes = (byTask.get(task.id) ?? []).toSorted((a, b) => a.at.localeCompare(b.at));
    if (changes.some((c) => c.to === 'review')) reviewed += 1;
    if (changes.some((c) => c.to === 'rework')) returned += 1;

    changes.forEach((change, index) => {
      if (change.to !== 'review') return;
      const decision = changes.slice(index + 1).find((c) => c.from === 'review');
      if (decision) {
        reviewDurations.push((Date.parse(decision.at) - Date.parse(change.at)) / HOUR);
      }
    });

    const accepted = changes.findLast((c) => c.to === 'done');
    if (accepted) leadTimes.push((Date.parse(accepted.at) - Date.parse(task.createdAt)) / HOUR);
  }

  // Последние N дней: сколько приняли и сколько вернули.
  const buckets = new Map<string, DayBucket>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - i);
    const key = dayKey(date);
    buckets.set(key, { date: key, accepted: 0, returned: 0 });
  }
  for (const change of relevant) {
    const bucket = buckets.get(dayKey(new Date(change.at)));
    if (!bucket) continue;
    if (change.to === 'done') bucket.accepted += 1;
    if (change.to === 'rework') bucket.returned += 1;
  }

  return {
    total: tasks.length,
    open: tasks.length - done,
    waitingReview: tasks.filter((t) => t.status === 'review').length,
    done,
    reworkRate: reviewed ? returned / reviewed : null,
    avgLeadHours: average(leadTimes),
    avgReviewHours: average(reviewDurations),
    byObject: breakdown(tasks, (t) => ({ id: t.objectId, label: t.object.name })),
    byAssignee: breakdown(tasks, (t) => ({ id: t.assigneeId, label: t.assignee.fullName })),
    days: [...buckets.values()],
  };
};
