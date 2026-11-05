import { createQuery } from '@farfetched/core';
import { createEffect, createStore, sample } from 'effector';
import { createGate } from 'effector-react';
import { type ConstructionObject, fetchObject } from '@/entities/object';
import { applyStatus, fetchTasksByObject, type Task } from '@/entities/task';
import { moveFailed, moveStarted, moveSucceeded } from '@/features/change-task-status';
import { objectSaved } from '@/features/object-editor';
import { taskDeleted, taskSaved } from '@/features/task-editor';
import { type ApiError, toApiError } from '@/shared/api';

export const BoardGate = createGate<{ objectId: string }>('ObjectBoardPage');

const guard = async <T>(run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    throw toApiError(error);
  }
};

export const objectQuery = createQuery({
  effect: createEffect<string, ConstructionObject, ApiError>((id) => guard(() => fetchObject(id))),
});

export const tasksQuery = createQuery({
  effect: createEffect<string, Task[], ApiError>((id) => guard(() => fetchTasksByObject(id))),
});

/** Задачи доски с оптимистичными перестановками. */
export const $tasks = createStore<Task[]>([])
  .on(tasksQuery.finished.success, (_, { result }) => result)
  .on(moveStarted, (tasks, move) => applyStatus(tasks, move.taskId, move.to))
  .on(moveFailed, (tasks, failed) => applyStatus(tasks, failed.taskId, failed.from))
  .on(moveSucceeded, (tasks, done) => applyStatus(tasks, done.id, done.status, done.updatedAt))
  .reset(BoardGate.close);

const $objectId = BoardGate.state.map((state) => state.objectId ?? null);

sample({
  clock: BoardGate.open,
  fn: ({ objectId }) => objectId,
  target: [objectQuery.start, tasksQuery.start],
});

// Сменили параметр маршрута, не размонтируя страницу.
sample({
  clock: $objectId.updates,
  source: BoardGate.status,
  filter: (open, id) => open && !!id,
  fn: (_, id) => id as string,
  target: [objectQuery.start, tasksQuery.start],
});

sample({
  clock: [taskSaved, taskDeleted],
  source: $objectId,
  filter: (id): id is string => !!id,
  target: tasksQuery.start,
});

sample({
  clock: objectSaved,
  source: $objectId,
  filter: (id, saved): id is string => !!id && saved.id === id,
  target: objectQuery.start,
});

sample({ clock: BoardGate.close, target: [objectQuery.reset, tasksQuery.reset] });
