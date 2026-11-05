import { createEffect, sample } from 'effector';
import {
  type ConstructionObject,
  createObject,
  deleteObject,
  type ObjectInput,
  updateObject,
} from '@/entities/object';
import { type ApiError, toApiError } from '@/shared/api';
import { notifyErrorFx, notifySuccessFx } from '@/shared/lib/notify';

const guard = async <T>(run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    throw toApiError(error);
  }
};

export const saveObjectFx = createEffect<
  ObjectInput & { id?: string },
  ConstructionObject,
  ApiError
>(({ id, ...input }) => guard(() => (id ? updateObject({ id, ...input }) : createObject(input))));

export const deleteObjectFx = createEffect<string, string, ApiError>((id) =>
  guard(async () => {
    await deleteObject(id);
    return id;
  }),
);

export const objectSaved = saveObjectFx.doneData;
export const objectDeleted = deleteObjectFx.doneData;

sample({
  clock: [saveObjectFx.failData, deleteObjectFx.failData],
  fn: (e) => e.message,
  target: notifyErrorFx,
});
sample({ clock: objectSaved, fn: () => 'Объект сохранён', target: notifySuccessFx });
sample({ clock: objectDeleted, fn: () => 'Объект удалён', target: notifySuccessFx });
