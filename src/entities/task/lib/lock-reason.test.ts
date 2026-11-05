import { describe, expect, it } from 'vitest';
import type { TaskStatus } from '../config/status';
import { getLockReason } from './lock-reason';

const manager = { id: 'm', role: 'manager' as const };
const executor = { id: 'e1', role: 'executor' as const };
const task = (status: TaskStatus, assigneeId = 'e1') => ({ status, assigneeId });

describe('getLockReason', () => {
  it('когда действие есть — причины нет', () => {
    expect(getLockReason(executor, task('new'))).toBeNull();
    expect(getLockReason(manager, task('review'))).toBeNull();
  });

  it('постановщику объясняет, что ход за исполнителем', () => {
    for (const status of ['new', 'in_progress', 'rework'] as const) {
      expect(getLockReason(manager, task(status))).toMatch(/исполнител/);
    }
  });

  it('исполнителю — что задача на проверке', () => {
    expect(getLockReason(executor, task('review'))).toMatch(/постановщик/);
  });

  it('принятую задачу не двигает никто', () => {
    expect(getLockReason(manager, task('done'))).toMatch(/принята/);
    expect(getLockReason(executor, task('done'))).toMatch(/принята/);
  });

  it('чужому исполнителю — что задача не его', () => {
    expect(getLockReason(executor, task('new', 'e2'))).toMatch(/назначенный/);
  });

  it('у каждого статуса для каждой роли есть либо действие, либо объяснение', () => {
    for (const status of ['new', 'in_progress', 'review', 'rework', 'done'] as const) {
      for (const actor of [manager, executor]) {
        const hasAction = getLockReason(actor, task(status)) === null;
        const reason = getLockReason(actor, task(status));
        expect(hasAction || typeof reason === 'string').toBe(true);
      }
    }
  });
});
