import { describe, expect, it } from 'vitest';
import type { StatusChangeRecord, Task } from '@/entities/task';
import { computeStatistics } from './compute';

const task = (id: string, status: Task['status'], over: Partial<Task> = {}): Task => ({
  id,
  number: 1,
  title: id,
  description: '',
  status,
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
  objectId: 'o1',
  object: { id: 'o1', name: 'Объект 1' },
  assigneeId: 'e1',
  assignee: { id: 'e1', fullName: 'Иван' },
  author: { id: 'm', fullName: 'М' },
  ...over,
});

const ch = (
  taskId: string,
  from: Task['status'] | null,
  to: Task['status'],
  at: string,
): StatusChangeRecord => ({
  taskId,
  from,
  to,
  at,
});

const now = new Date('2026-11-05T12:00:00Z');

describe('computeStatistics', () => {
  const tasks = [
    task('a', 'done'),
    task('b', 'review', { objectId: 'o2', object: { id: 'o2', name: 'Объект 2' } }),
    task('c', 'new', { assigneeId: 'e2', assignee: { id: 'e2', fullName: 'Пётр' } }),
  ];
  const history = [
    ch('a', null, 'new', '2026-11-01T00:00:00Z'),
    ch('a', 'new', 'in_progress', '2026-11-01T10:00:00Z'),
    ch('a', 'in_progress', 'review', '2026-11-02T00:00:00Z'),
    ch('a', 'review', 'rework', '2026-11-02T04:00:00Z'),
    ch('a', 'rework', 'in_progress', '2026-11-02T05:00:00Z'),
    ch('a', 'in_progress', 'review', '2026-11-03T00:00:00Z'),
    ch('a', 'review', 'done', '2026-11-03T02:00:00Z'),
    ch('b', null, 'new', '2026-11-01T00:00:00Z'),
    ch('b', 'new', 'in_progress', '2026-11-04T00:00:00Z'),
    ch('b', 'in_progress', 'review', '2026-11-05T00:00:00Z'),
    ch('x', 'review', 'done', '2026-11-05T00:00:00Z'), // чужая/удалённая задача — не считается
  ];
  const stats = computeStatistics(tasks, history, now);

  it('счётчики', () => {
    expect(stats).toMatchObject({ total: 3, open: 2, waitingReview: 1, done: 1 });
  });

  it('доля возвратов — среди дошедших до проверки', () => {
    expect(stats.reworkRate).toBe(0.5);
  });

  it('среднее время до принятия и на проверке', () => {
    expect(stats.avgLeadHours).toBe(50);
    expect(stats.avgReviewHours).toBe(3); // (4 + 2) / 2, незавершённая проверка не считается
  });

  it('разбивка по объектам и исполнителям', () => {
    expect(stats.byObject.map((r) => [r.label, r.total])).toEqual([
      ['Объект 1', 2],
      ['Объект 2', 1],
    ]);
    expect(stats.byAssignee.find((r) => r.id === 'e1')?.counts).toMatchObject({
      done: 1,
      review: 1,
    });
  });

  it('активность по дням', () => {
    expect(stats.days).toHaveLength(14);
    expect(stats.days.at(-1)?.date).toBe('2026-11-05');
    expect(stats.days.find((d) => d.date === '2026-11-03')?.accepted).toBe(1);
    expect(stats.days.find((d) => d.date === '2026-11-02')?.returned).toBe(1);
    expect(stats.days.find((d) => d.date === '2026-11-05')?.accepted).toBe(0);
  });

  it('пустые данные не ломают расчёт', () => {
    const empty = computeStatistics([], [], now);
    expect(empty).toMatchObject({ total: 0, reworkRate: null, avgLeadHours: null });
  });
});
