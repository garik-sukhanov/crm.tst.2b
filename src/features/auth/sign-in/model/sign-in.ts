import { createEffect, createEvent, createStore, sample } from 'effector';
import { signInWithPassword } from '@/entities/viewer';

export const emailChanged = createEvent<string>();
export const passwordChanged = createEvent<string>();
export const submitted = createEvent();

export const signInFx = createEffect<{ email: string; password: string }, void, Error>(
  signInWithPassword,
);

export const $email = createStore('').on(emailChanged, (_, v) => v);
export const $password = createStore('')
  .on(passwordChanged, (_, v) => v)
  .reset(signInFx.done);
export const $pending = signInFx.pending;

export const toSignInError = (error: Error): string => {
  const text = error.message.toLowerCase();
  if (text.includes('invalid login credentials')) return 'Неверная почта или пароль';
  if (text.includes('email not confirmed')) return 'Почта не подтверждена';
  if (text.includes('fetch') || text.includes('network')) return 'Нет связи с сервером';
  if (text.includes('rate limit') || text.includes('too many')) {
    return 'Слишком много попыток. Подождите минуту';
  }
  return 'Не удалось войти. Попробуйте ещё раз';
};

export const $error = createStore<string | null>(null)
  .on(signInFx.failData, (_, error) => toSignInError(error))
  .reset(emailChanged, passwordChanged, signInFx);

export const $canSubmit = sample({
  source: { email: $email, password: $password, pending: $pending },
  fn: ({ email, password, pending }) =>
    /\S+@\S+\.\S+/.test(email.trim()) && password.length > 0 && !pending,
});

sample({
  clock: submitted,
  source: { email: $email, password: $password, canSubmit: $canSubmit },
  filter: ({ canSubmit }) => canSubmit,
  fn: ({ email, password }) => ({ email: email.trim(), password }),
  target: signInFx,
});
