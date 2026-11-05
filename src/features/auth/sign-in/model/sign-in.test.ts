import { allSettled, fork } from 'effector';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/entities/viewer', () => ({ signInWithPassword: vi.fn() }));
const m = await import('./sign-in');

describe('форма входа', () => {
  it('не отправляет пустую форму', async () => {
    const handler = vi.fn();
    const scope = fork({ handlers: [[m.signInFx, handler]] });
    await allSettled(m.submitted, { scope });
    expect(handler).not.toHaveBeenCalled();
  });

  it('отправляет почту без пробелов', async () => {
    const handler = vi.fn(async () => {});
    const scope = fork({ handlers: [[m.signInFx, handler]] });
    await allSettled(m.emailChanged, { scope, params: '  a@b.ru ' });
    await allSettled(m.passwordChanged, { scope, params: 'secret' });
    await allSettled(m.submitted, { scope });
    expect(handler).toHaveBeenCalledWith({ email: 'a@b.ru', password: 'secret' });
    expect(scope.getState(m.$password)).toBe('');
  });

  it('показывает понятную ошибку при неверном пароле', async () => {
    const scope = fork({
      handlers: [
        [
          m.signInFx,
          async () => {
            throw new Error('Invalid login credentials');
          },
        ],
      ],
    });
    await allSettled(m.emailChanged, { scope, params: 'a@b.ru' });
    await allSettled(m.passwordChanged, { scope, params: 'x' });
    await allSettled(m.submitted, { scope });
    expect(scope.getState(m.$error)).toBe('Неверная почта или пароль');

    await allSettled(m.passwordChanged, { scope, params: 'y' });
    expect(scope.getState(m.$error)).toBeNull();
  });
});
