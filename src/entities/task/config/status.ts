export type TaskStatus = 'new' | 'in_progress' | 'review' | 'rework' | 'done';

/** Порядок колонок на доске. */
export const TASK_STATUSES: readonly TaskStatus[] = [
  'new',
  'in_progress',
  'review',
  'rework',
  'done',
];

export const TASK_STATUS_META: Record<TaskStatus, { label: string; colorClass: string }> = {
  new: { label: 'Новая', colorClass: 'bg-status-new' },
  in_progress: { label: 'В работе', colorClass: 'bg-status-in-progress' },
  review: { label: 'На проверке', colorClass: 'bg-status-review' },
  rework: { label: 'На доработке', colorClass: 'bg-status-rework' },
  done: { label: 'Принята', colorClass: 'bg-status-done' },
};
