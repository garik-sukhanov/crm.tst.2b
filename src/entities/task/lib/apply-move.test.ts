import { describe, expect, it } from 'vitest';
import type { Task } from '../api/tasks';
import { applyStatus, groupByStatus } from './apply-move';

const task = (id: string, status: Task['status']): Task => ({
  id,
  number: 1,
  title: id,
  description: '',
  status,
  createdAt: '',
  updatedAt: 'old',
  objectId: 'o',
  object: { id: 'o', name: 'O' },
  assigneeId: 'u',
  assignee: { id: 'u', fullName: 'U' },
  author: { id: 'm', fullName: 'M' },
});

describe('applyStatus', () => {
  it('меняет статус только нужной задачи', () => {
    const result = applyStatus([task('a', 'new'), task('b', 'new')], 'a', 'in_progress', 'now');
    expect(result.map((t) => [t.id, t.status, t.updatedAt])).toEqual([
      ['a', 'in_progress', 'now'],
      ['b', 'new', 'old'],
    ]);
  });
});

describe('groupByStatus', () => {
  it('раскладывает по колонкам', () => {
    const groups = groupByStatus([task('a', 'new'), task('b', 'done'), task('c', 'new')]);
    expect(groups.new.map((t) => t.id)).toEqual(['a', 'c']);
    expect(groups.done).toHaveLength(1);
    expect(groups.review).toHaveLength(0);
  });
});
