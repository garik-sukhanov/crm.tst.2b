import { createQuery } from '@farfetched/core';
import { createEffect, createStore, sample } from 'effector';
import { createGate } from 'effector-react';
import { type FeedItem, fetchTask, fetchTaskFeed, type Task } from '@/entities/task';
import { moveFailed, moveStarted, moveSucceeded } from '@/features/change-task-status';
import { commentAdded } from '@/features/task-comment';
import { taskSaved } from '@/features/task-editor';
import { type ApiError, toApiError } from '@/shared/api';

export const TaskGate = createGate<{ taskId: string }>('TaskPage');

const guard = async <T>(run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    throw toApiError(error);
  }
};

export const taskQuery = createQuery({
  effect: createEffect<string, Task, ApiError>((id) => guard(() => fetchTask(id))),
});

export const feedQuery = createQuery({
  initialData: [] as FeedItem[],
  effect: createEffect<string, FeedItem[], ApiError>((id) => guard(() => fetchTaskFeed(id))),
});

const $taskId = TaskGate.state.map((state) => state.taskId ?? null);

/** Задача с оптимистичной сменой статуса. */
export const $task = createStore<Task | null>(null)
  .on(taskQuery.finished.success, (_, { result }) => result)
  .on(moveStarted, (task, move) => (task?.id === move.taskId ? { ...task, status: move.to } : task))
  .on(moveFailed, (task, failed) =>
    task?.id === failed.taskId ? { ...task, status: failed.from } : task,
  )
  .on(moveSucceeded, (task, done) =>
    task?.id === done.id ? { ...task, status: done.status, updatedAt: done.updatedAt } : task,
  )
  .reset(TaskGate.close);

sample({
  clock: [TaskGate.open, $taskId.updates],
  source: $taskId,
  filter: (id): id is string => !!id,
  target: [taskQuery.start, feedQuery.start],
});

sample({
  clock: [moveSucceeded.map(({ id }) => id), commentAdded.map(({ taskId }) => taskId)],
  source: $taskId,
  filter: (current, changed): current is string => !!current && current === changed,
  target: feedQuery.start,
});

sample({
  clock: taskSaved,
  source: $taskId,
  filter: (current, saved): current is string => current === saved.id,
  target: taskQuery.start,
});

sample({ clock: TaskGate.close, target: [taskQuery.reset, feedQuery.reset] });
