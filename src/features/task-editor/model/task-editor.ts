import { createQuery } from '@farfetched/core';
import { createEffect, sample } from 'effector';
import { createTask, deleteTask, type Task, type TaskInput, updateTask } from '@/entities/task';
import { fetchExecutors, type User } from '@/entities/user';
import { type ApiError, toApiError } from '@/shared/api';
import { notifyErrorFx, notifySuccessFx } from '@/shared/lib/notify';

const guard = async <T>(run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    throw toApiError(error);
  }
};

export const executorsQuery = createQuery({
  initialData: [] as User[],
  effect: createEffect<void, User[], ApiError>(() => guard(fetchExecutors)),
});

export type SaveTaskParams = TaskInput & { id?: string; objectId: string };

export const saveTaskFx = createEffect<SaveTaskParams, Task, ApiError>(
  ({ id, objectId, ...input }) =>
    guard(() => (id ? updateTask({ id, ...input }) : createTask({ objectId, ...input }))),
);

export const deleteTaskFx = createEffect<string, string, ApiError>((id) =>
  guard(async () => {
    await deleteTask(id);
    return id;
  }),
);

export const taskSaved = saveTaskFx.doneData;
export const taskDeleted = deleteTaskFx.doneData;

sample({
  clock: [saveTaskFx.failData, deleteTaskFx.failData],
  fn: (error) => error.message,
  target: notifyErrorFx,
});
sample({
  clock: saveTaskFx.done,
  fn: ({ params }) => (params.id ? 'Задача сохранена' : 'Задача создана'),
  target: notifySuccessFx,
});
sample({ clock: taskDeleted, fn: () => 'Задача удалена', target: notifySuccessFx });
