import { createMutation } from '@farfetched/core';
import { createEffect, createEvent, createStore, sample } from 'effector';
import {
  changeTaskStatus,
  TASK_STATUS_META,
  type TaskStatus,
  type TaskTransition,
} from '@/entities/task';
import { type ApiError, toApiError } from '@/shared/api';
import { notifyErrorFx, notifySuccessFx } from '@/shared/lib/notify';

type Move = { taskId: string; from: TaskStatus; to: TaskStatus; comment?: string };
type MoveResult = { id: string; status: TaskStatus; updatedAt: string };

/** Пользователь выбрал действие (кнопкой или перетаскиванием). */
export const transitionRequested = createEvent<{ taskId: string; transition: TaskTransition }>();

export const reworkCommentChanged = createEvent<string>();
export const reworkSubmitted = createEvent();
export const reworkDialogClosed = createEvent();

export const changeStatusFx = createEffect<Move, MoveResult, ApiError>(async (move) => {
  try {
    return await changeTaskStatus(move);
  } catch (error) {
    throw toApiError(error);
  }
});

export const changeStatusMutation = createMutation({ effect: changeStatusFx });

/** Для оптимистичного обновления на доске и в списках. */
export const moveStarted = createEvent<Move>();
export const moveSucceeded = changeStatusMutation.finished.success.map(({ result }) => result);
export const moveFailed = changeStatusMutation.finished.failure.map(({ params, error }) => ({
  taskId: params.taskId,
  from: params.from,
  error: error as ApiError,
}));

/** Задача, которую возвращают на доработку и для которой ждём комментарий. */
export const $reworkTarget = createStore<{ taskId: string; from: TaskStatus } | null>(null);
export const $reworkComment = createStore('');
export const $reworkError = createStore<string | null>(null);

export const $pendingTaskIds = createStore<ReadonlySet<string>>(new Set())
  .on(moveStarted, (ids, { taskId }) => new Set(ids).add(taskId))
  .on(changeStatusMutation.finished.finally, (ids, { params }) => {
    const next = new Set(ids);
    next.delete(params.taskId);
    return next;
  });

// Переход без комментария — сразу в базу.
sample({
  clock: transitionRequested,
  filter: ({ transition }) => !transition.requiresComment,
  fn: ({ taskId, transition }): Move => ({ taskId, from: transition.from, to: transition.to }),
  target: moveStarted,
});

// Переход с обязательным комментарием — сначала спрашиваем комментарий.
sample({
  clock: transitionRequested,
  filter: ({ transition }) => transition.requiresComment,
  fn: ({ taskId, transition }) => ({ taskId, from: transition.from }),
  target: $reworkTarget,
});

$reworkComment
  .on(reworkCommentChanged, (_, value) => value)
  .reset(reworkDialogClosed, moveSucceeded);
$reworkError
  .on(reworkCommentChanged, () => null)
  .on(moveFailed, (_, { error }) => error.message)
  .reset(reworkDialogClosed, transitionRequested);

sample({
  clock: reworkSubmitted,
  source: { target: $reworkTarget, comment: $reworkComment },
  filter: ({ target, comment }) => !!target && comment.trim().length > 0,
  fn: ({ target, comment }): Move => ({
    taskId: target?.taskId ?? '',
    from: target?.from ?? 'review',
    to: 'rework',
    comment: comment.trim(),
  }),
  target: moveStarted,
});

sample({
  clock: reworkSubmitted,
  source: $reworkComment,
  filter: (comment) => comment.trim().length === 0,
  fn: () => 'Напишите, что нужно исправить',
  target: $reworkError,
});

$reworkTarget.reset(reworkDialogClosed, moveSucceeded);

sample({ clock: moveStarted, target: changeStatusMutation.start });

// Ошибку в диалоге доработки показываем в самом диалоге, остальные — уведомлением.
sample({
  clock: moveFailed,
  source: $reworkTarget,
  filter: (target, { taskId }) => target?.taskId !== taskId,
  fn: (_, { error }) => error.message,
  target: notifyErrorFx,
});

sample({
  clock: moveSucceeded,
  fn: ({ status }) => `Статус: ${TASK_STATUS_META[status].label}`,
  target: notifySuccessFx,
});
