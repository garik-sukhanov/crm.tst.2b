import type { Session } from '@supabase/supabase-js';
import { allSettled, fork } from 'effector';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/api', () => ({ supabase: {}, unwrap: vi.fn() }));
vi.mock('../api/viewer', () => ({
  fetchViewer: vi.fn(),
  signOut: vi.fn(),
  subscribeToSession: vi.fn(),
}));

const { $sessionStatus, $viewer, fetchViewerFx, sessionChanged } = await import('./viewer');

const session = (id: string) => ({ user: { id, email: `${id}@x` } }) as unknown as Session;
const viewer = { id: 'u1', email: 'u1@x', fullName: 'Иван', role: 'executor' as const };

describe('модель сессии', () => {
  it('нет сессии → аноним', async () => {
    const scope = fork();
    await allSettled(sessionChanged, { scope, params: null });
    expect(scope.getState($sessionStatus)).toBe('anonymous');
    expect(scope.getState($viewer)).toBeNull();
  });

  it('есть сессия → загружает профиль и входит', async () => {
    const scope = fork({ handlers: [[fetchViewerFx, async () => viewer]] });
    await allSettled(sessionChanged, { scope, params: session('u1') });
    expect(scope.getState($sessionStatus)).toBe('authenticated');
    expect(scope.getState($viewer)).toEqual(viewer);
  });

  it('обновление токена того же пользователя не перезагружает профиль', async () => {
    const handler = vi.fn(async () => viewer);
    const scope = fork({ values: [[$viewer, viewer]], handlers: [[fetchViewerFx, handler]] });
    await allSettled(sessionChanged, { scope, params: session('u1') });
    expect(handler).not.toHaveBeenCalled();
  });

  it('профиль не найден → аноним', async () => {
    const scope = fork({
      handlers: [
        [
          fetchViewerFx,
          async () => {
            throw new Error('no profile');
          },
        ],
      ],
    });
    await allSettled(sessionChanged, { scope, params: session('u2') });
    expect(scope.getState($sessionStatus)).toBe('anonymous');
  });

  it('выход → сбрасывает пользователя', async () => {
    const scope = fork({
      values: [
        [$viewer, viewer],
        [$sessionStatus, 'authenticated'],
      ],
    });
    await allSettled(sessionChanged, { scope, params: null });
    expect(scope.getState($viewer)).toBeNull();
    expect(scope.getState($sessionStatus)).toBe('anonymous');
  });
});
