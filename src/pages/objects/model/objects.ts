import { createQuery } from '@farfetched/core';
import { createEffect, sample } from 'effector';
import { createGate } from 'effector-react';
import { fetchObjects, type ObjectSummary } from '@/entities/object';
import { objectDeleted, objectSaved } from '@/features/object-editor';
import { type ApiError, toApiError } from '@/shared/api';

export const ObjectsGate = createGate('ObjectsPage');

export const objectsQuery = createQuery({
  initialData: [] as ObjectSummary[],
  effect: createEffect<void, ObjectSummary[], ApiError>(async () => {
    try {
      return await fetchObjects();
    } catch (error) {
      throw toApiError(error);
    }
  }),
});

sample({ clock: [ObjectsGate.open, objectSaved, objectDeleted], target: objectsQuery.start });
