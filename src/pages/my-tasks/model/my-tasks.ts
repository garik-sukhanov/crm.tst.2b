import { createQuery } from '@farfetched/core';
import { createEffect, createStore, sample } from 'effector';
import { createGate } from 'effector-react';
import { applyStatus, fetchTasksAssignedTo, type Task } from '@/entities/task';
import { moveFailed, moveStarted, moveSucceeded } from '@/features/change-task-status';
import { type ApiError, toApiError } from '@/shared/api';

export const MyTasksGate = createGate<{ userId: string }>('MyTasksPage');

export const myTasksQuery = createQuery({
  effect: createEffect<string, Task[], ApiError>(async (userId) => {
    try {
      return await fetchTasksAssignedTo(userId);
    } catch (error) {
      throw toApiError(error);
    }
  }),
});

export const $myTasks = createStore<Task[]>([])
  .on(myTasksQuery.finished.success, (_, { result }) => result)
  .on(moveStarted, (tasks, move) => applyStatus(tasks, move.taskId, move.to))
  .on(moveFailed, (tasks, failed) => applyStatus(tasks, failed.taskId, failed.from))
  .on(moveSucceeded, (tasks, done) => applyStatus(tasks, done.id, done.status, done.updatedAt));

sample({ clock: MyTasksGate.open, fn: ({ userId }) => userId, target: myTasksQuery.start });
