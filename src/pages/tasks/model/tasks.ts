import { createQuery } from '@farfetched/core';
import { createEffect, createStore, sample } from 'effector';
import { createGate } from 'effector-react';
import { applyStatus, fetchAllTasks, type Task } from '@/entities/task';
import { moveFailed, moveStarted, moveSucceeded } from '@/features/change-task-status';
import { taskDeleted, taskSaved } from '@/features/task-editor';
import { type ApiError, toApiError } from '@/shared/api';

export const TasksGate = createGate('TasksPage');

/** Все задачи, которые видит пользователь. Исполнителю база (RLS) отдаёт только его задачи. */
export const tasksQuery = createQuery({
  effect: createEffect<void, Task[], ApiError>(async () => {
    try {
      return await fetchAllTasks();
    } catch (error) {
      throw toApiError(error);
    }
  }),
});

export const $tasks = createStore<Task[]>([])
  .on(tasksQuery.finished.success, (_, { result }) => result)
  .on(moveStarted, (tasks, move) => applyStatus(tasks, move.taskId, move.to))
  .on(moveFailed, (tasks, failed) => applyStatus(tasks, failed.taskId, failed.from))
  .on(moveSucceeded, (tasks, done) => applyStatus(tasks, done.id, done.status, done.updatedAt));

sample({ clock: [TasksGate.open, taskSaved, taskDeleted], target: tasksQuery.start });
