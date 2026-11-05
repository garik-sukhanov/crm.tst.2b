import { createMutation } from '@farfetched/core';
import { createEffect, createEvent, createStore, sample } from 'effector';
import { addComment } from '@/entities/task';
import { type ApiError, toApiError } from '@/shared/api';
import { notifyErrorFx } from '@/shared/lib/notify';

export const draftChanged = createEvent<string>();
export const submitted = createEvent<{ taskId: string }>();

export const addCommentFx = createEffect<{ taskId: string; body: string }, void, ApiError>(
  async (params) => {
    try {
      await addComment(params);
    } catch (error) {
      throw toApiError(error);
    }
  },
);

export const addCommentMutation = createMutation({ effect: addCommentFx });
export const commentAdded = addCommentMutation.finished.success.map(({ params }) => params);

export const $draft = createStore('')
  .on(draftChanged, (_, value) => value)
  .reset(commentAdded);

sample({
  clock: submitted,
  source: $draft,
  filter: (draft) => draft.trim().length > 0,
  fn: (draft, { taskId }) => ({ taskId, body: draft.trim() }),
  target: addCommentMutation.start,
});

sample({
  clock: addCommentMutation.finished.failure,
  fn: ({ error }) => (error as ApiError).message,
  target: notifyErrorFx,
});
