import type { AppRole } from '@/shared/api';
import { TASK_TRANSITIONS, type TaskStatus, type TaskTransition } from '../config/status';

export type Actor = { id: string; role: AppRole };
export type TransitionSubject = { status: TaskStatus; assigneeId: string };

/** Переходы, доступные пользователю для задачи в её текущем статусе. */
export const getAvailableTransitions = (actor: Actor, task: TransitionSubject): TaskTransition[] =>
  TASK_TRANSITIONS.filter(
    (rule) =>
      rule.from === task.status &&
      rule.actorRole === actor.role &&
      // Исполнитель двигает только назначенные на него задачи
      (actor.role !== 'executor' || task.assigneeId === actor.id),
  );

export const findTransition = (
  actor: Actor,
  task: TransitionSubject,
  to: TaskStatus,
): TaskTransition | null =>
  getAvailableTransitions(actor, task).find((rule) => rule.to === to) ?? null;

/** Куда можно перетащить карточку (для подсветки колонок на доске). */
export const getDropTargets = (actor: Actor, task: TransitionSubject): Set<TaskStatus> =>
  new Set(getAvailableTransitions(actor, task).map((rule) => rule.to));

/** Создавать, править и удалять объекты и задачи может только постановщик. */
export const canManage = (role: AppRole): boolean => role === 'manager';
