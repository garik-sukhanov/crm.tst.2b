import type { Task } from '../api/tasks';
import type { Actor } from './transitions';
import { getAvailableTransitions } from './transitions';

/**
 * Почему пользователь не может сейчас сменить статус задачи.
 * null — какое-то действие доступно.
 */
export const getLockReason = (
  actor: Actor,
  task: Pick<Task, 'status' | 'assigneeId'>,
): string | null => {
  if (getAvailableTransitions(actor, task).length > 0) return null;
  if (task.status === 'done') return 'Задача принята — статус больше не меняется';

  if (actor.role === 'manager') {
    switch (task.status) {
      case 'new':
        return 'Ход за исполнителем: он берёт задачу в работу';
      case 'in_progress':
        return 'Ход за исполнителем: он отправит задачу на проверку';
      case 'rework':
        return 'Ход за исполнителем: он возьмёт задачу в доработку';
      default:
        return null;
    }
  }

  if (task.assigneeId !== actor.id) return 'Двигать задачу может только назначенный исполнитель';
  if (task.status === 'review') return 'Задача на проверке — решение за постановщиком';
  return null;
};
