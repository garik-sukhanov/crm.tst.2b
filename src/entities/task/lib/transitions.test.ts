import { describe, expect, it } from 'vitest';
import { TASK_STATUSES, TASK_TRANSITIONS, type TaskStatus } from '../config/status';
import { canManage, findTransition, getAvailableTransitions, getDropTargets } from './transitions';

const manager = { id: 'm1', role: 'manager' as const };
const executor = { id: 'e1', role: 'executor' as const };
const otherExecutor = { id: 'e2', role: 'executor' as const };

const task = (status: TaskStatus) => ({ status, assigneeId: executor.id });
const targets = (actor: typeof manager | typeof executor, status: TaskStatus) =>
  getAvailableTransitions(actor, task(status)).map((t) => t.to);

describe('переходы статусов (ТЗ 2.3)', () => {
  it.each([
    ['new', ['in_progress']],
    ['in_progress', ['review']],
    ['review', []],
    ['rework', ['in_progress']],
    ['done', []],
  ] as const)('исполнитель из «%s» → %j', (status, expected) => {
    expect(targets(executor, status)).toEqual(expected);
  });

  it.each([
    ['new', []],
    ['in_progress', []],
    ['review', ['done', 'rework']],
    ['rework', []],
    ['done', []],
  ] as const)('постановщик из «%s» → %j', (status, expected) => {
    expect(targets(manager, status)).toEqual(expected);
  });

  it('чужой исполнитель не получает ни одного действия', () => {
    for (const status of TASK_STATUSES) {
      expect(getAvailableTransitions(otherExecutor, task(status))).toEqual([]);
    }
  });

  it('возврат на доработку требует комментарий, остальное — нет', () => {
    const withComment = TASK_TRANSITIONS.filter((t) => t.requiresComment).map((t) => t.to);
    expect(withComment).toEqual(['rework']);
  });

  it('из «Принята» выхода нет ни у кого', () => {
    expect(TASK_TRANSITIONS.some((t) => t.from === 'done')).toBe(false);
  });

  it('findTransition находит разрешённый и отклоняет запрещённый переход', () => {
    expect(findTransition(executor, task('new'), 'in_progress')?.action).toBe('Взять в работу');
    expect(findTransition(executor, task('new'), 'done')).toBeNull();
    expect(findTransition(manager, task('review'), 'rework')?.requiresComment).toBe(true);
  });

  it('getDropTargets возвращает колонки для подсветки', () => {
    expect([...getDropTargets(manager, task('review'))].sort()).toEqual(['done', 'rework']);
    expect(getDropTargets(manager, task('new')).size).toBe(0);
  });
});

describe('canManage', () => {
  it('только постановщик', () => {
    expect(canManage('manager')).toBe(true);
    expect(canManage('executor')).toBe(false);
  });
});
