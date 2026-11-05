import type { AppRole, TaskStatus } from '@/shared/api';

export type { TaskStatus };

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

export type TaskTransition = {
  from: TaskStatus;
  to: TaskStatus;
  actorRole: AppRole;
  requiresComment: boolean;
  /** Подпись кнопки действия */
  action: string;
};

/**
 * Разрешённые переходы (ТЗ 2.3). Зеркало таблицы task_status_transitions в базе —
 * интерфейс по ним решает, какие кнопки показывать, а база — что пропустить.
 * Совпадение с базой проверяет интеграционный тест.
 */
export const TASK_TRANSITIONS: readonly TaskTransition[] = [
  {
    from: 'new',
    to: 'in_progress',
    actorRole: 'executor',
    requiresComment: false,
    action: 'Взять в работу',
  },
  {
    from: 'in_progress',
    to: 'review',
    actorRole: 'executor',
    requiresComment: false,
    action: 'На проверку',
  },
  { from: 'review', to: 'done', actorRole: 'manager', requiresComment: false, action: 'Принять' },
  {
    from: 'review',
    to: 'rework',
    actorRole: 'manager',
    requiresComment: true,
    action: 'Вернуть на доработку',
  },
  {
    from: 'rework',
    to: 'in_progress',
    actorRole: 'executor',
    requiresComment: false,
    action: 'Взять в работу',
  },
];
