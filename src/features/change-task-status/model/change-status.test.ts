import { allSettled, fork } from 'effector';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api';

vi.mock('@/shared/lib/notify', async () => {
  const { createEffect } = await import('effector');
  return { notifyErrorFx: createEffect(() => {}), notifySuccessFx: createEffect(() => {}) };
});

const { TASK_TRANSITIONS } = await import('@/entities/task');
const m = await import('./change-status');
const { notifyErrorFx } = await import('@/shared/lib/notify');

const take = TASK_TRANSITIONS.find((t) => t.from === 'new' && t.to === 'in_progress');
const rework = TASK_TRANSITIONS.find((t) => t.to === 'rework');
if (!take || !rework) throw new Error('нет переходов');

const effectOf = () => {
  const fx = vi.fn(async (move: { taskId: string; to: string }) => ({
    id: move.taskId,
    status: move.to,
    updatedAt: 'now',
  }));
  return fx;
};

describe('смена статуса', () => {
  it('переход без комментария сразу уходит в базу', async () => {
    const fx = effectOf();
    const scope = fork({ handlers: [[m.changeStatusFx, fx]] });
    await allSettled(m.transitionRequested, { scope, params: { taskId: 't1', transition: take } });
    expect(fx).toHaveBeenCalledWith(expect.objectContaining({ taskId: 't1', to: 'in_progress' }));
  });

  it('возврат на доработку сначала просит комментарий', async () => {
    const fx = effectOf();
    const scope = fork({ handlers: [[m.changeStatusFx, fx]] });
    await allSettled(m.transitionRequested, {
      scope,
      params: { taskId: 't2', transition: rework },
    });
    expect(fx).not.toHaveBeenCalled();
    expect(scope.getState(m.$reworkTarget)).toEqual({ taskId: 't2', from: 'review' });
  });

  it('пустой комментарий не отправляется', async () => {
    const fx = effectOf();
    const scope = fork({ handlers: [[m.changeStatusFx, fx]] });
    await allSettled(m.transitionRequested, {
      scope,
      params: { taskId: 't2', transition: rework },
    });
    await allSettled(m.reworkCommentChanged, { scope, params: '   ' });
    await allSettled(m.reworkSubmitted, { scope });
    expect(fx).not.toHaveBeenCalled();
    expect(scope.getState(m.$reworkError)).toBe('Напишите, что нужно исправить');
  });

  it('с комментарием отправляет и закрывает диалог', async () => {
    const fx = effectOf();
    const scope = fork({ handlers: [[m.changeStatusFx, fx]] });
    await allSettled(m.transitionRequested, {
      scope,
      params: { taskId: 't2', transition: rework },
    });
    await allSettled(m.reworkCommentChanged, { scope, params: 'Переделать узел' });
    await allSettled(m.reworkSubmitted, { scope });
    expect(fx).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: 't2', to: 'rework', comment: 'Переделать узел' }),
    );
    expect(scope.getState(m.$reworkTarget)).toBeNull();
    expect(scope.getState(m.$reworkComment)).toBe('');
  });

  it('ошибка базы показывается уведомлением, задача перестаёт быть «в ожидании»', async () => {
    const notify = vi.fn();
    const scope = fork({
      handlers: [
        [
          m.changeStatusFx,
          async () => {
            throw new ApiError('Такой переход статуса запрещён', 'CRM01');
          },
        ],
        [notifyErrorFx, notify],
      ],
    });
    await allSettled(m.transitionRequested, { scope, params: { taskId: 't3', transition: take } });
    expect(notify).toHaveBeenCalledWith('Такой переход статуса запрещён');
    expect(scope.getState(m.$pendingTaskIds).has('t3')).toBe(false);
  });
});
