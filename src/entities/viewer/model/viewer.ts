import type { Session } from '@supabase/supabase-js';
import { createEffect, createEvent, createStore, sample } from 'effector';
import type { ApiError } from '@/shared/api';
import { fetchViewer, signOut, subscribeToSession, type Viewer } from '../api/viewer';

export type SessionStatus = 'pending' | 'authenticated' | 'anonymous';

export const appStarted = createEvent();
export const sessionChanged = createEvent<Session | null>();

const subscribeFx = createEffect(() => {
  subscribeToSession(sessionChanged);
});

export const fetchViewerFx = createEffect<Session, Viewer, ApiError>(fetchViewer);

/** Профиля нет (пользователь удалён из profiles) — выходим, чтобы не застрять. */
const dropBrokenSessionFx = createEffect(signOut);

export const $viewer = createStore<Viewer | null>(null);
export const $sessionStatus = createStore<SessionStatus>('pending');

sample({ clock: appStarted, target: subscribeFx });

// Новая сессия другого пользователя — загружаем его профиль.
sample({
  clock: sessionChanged,
  source: $viewer,
  filter: (viewer, session): session is Session => !!session && viewer?.id !== session.user.id,
  fn: (_, session) => session as Session,
  target: fetchViewerFx,
});

sample({
  clock: sessionChanged,
  filter: (session) => !session,
  fn: () => null,
  target: $viewer,
});

sample({
  clock: sessionChanged,
  filter: (session) => !session,
  fn: (): SessionStatus => 'anonymous',
  target: $sessionStatus,
});

$viewer.on(fetchViewerFx.doneData, (_, viewer) => viewer);
$sessionStatus.on(fetchViewerFx.done, () => 'authenticated');

sample({ clock: fetchViewerFx.fail, target: dropBrokenSessionFx });
$sessionStatus.on(fetchViewerFx.fail, () => 'anonymous');
