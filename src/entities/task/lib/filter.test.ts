import { describe, expect, it } from 'vitest';
import type { Task } from '../api/tasks';
import { applyTaskFilters, EMPTY_FILTERS, getFilterOptions, isFiltered } from './filter';

const task = (n: number, over: Partial<Task> = {}): Task => ({
  id: `t${n}`,
  number: n,
  title: `Задача ${n}`,
  description: '',
  status: 'new',
  createdAt: `2026-11-0${n}T00:00:00Z`,
  updatedAt: `2026-11-0${n}T00:00:00Z`,
  objectId: 'o1',
  object: { id: 'o1', name: 'Склад' },
  assigneeId: 'e1',
  assignee: { id: 'e1', fullName: 'Ковалёв' },
  author: { id: 'm', fullName: 'М' },
  ...over,
});

const tasks = [
  task(1, { title: 'Ёмкость для воды' }),
  task(2, { assigneeId: 'e2', assignee: { id: 'e2', fullName: 'Орлов' } }),
  task(3, { objectId: 'o2', object: { id: 'o2', name: 'Дом' }, description: 'кровля' }),
];
const ids = (list: Task[]) => list.map((t) => t.id);

describe('applyTaskFilters', () => {
  it('без фильтров — все, свежие сверху', () => {
    expect(ids(applyTaskFilters(tasks, EMPTY_FILTERS))).toEqual(['t3', 't2', 't1']);
  });

  it('по исполнителю и объекту', () => {
    expect(ids(applyTaskFilters(tasks, { ...EMPTY_FILTERS, assigneeId: 'e2' }))).toEqual(['t2']);
    expect(ids(applyTaskFilters(tasks, { ...EMPTY_FILTERS, objectId: 'o2' }))).toEqual(['t3']);
  });

  it('поиск по названию и описанию без учёта регистра и «ё»', () => {
    expect(ids(applyTaskFilters(tasks, { ...EMPTY_FILTERS, q: 'емкость' }))).toEqual(['t1']);
    expect(ids(applyTaskFilters(tasks, { ...EMPTY_FILTERS, q: 'КРОВЛЯ' }))).toEqual(['t3']);
  });

  it('поиск по номеру в любом виде', () => {
    for (const q of ['2', 'т-002', 'Т2']) {
      expect(ids(applyTaskFilters(tasks, { ...EMPTY_FILTERS, q }))).toEqual(['t2']);
    }
  });

  it('сортировка по номеру', () => {
    expect(ids(applyTaskFilters(tasks, { ...EMPTY_FILTERS, sort: 'number' }))).toEqual([
      't1',
      't2',
      't3',
    ]);
  });
});

describe('getFilterOptions', () => {
  it('собирает исполнителей и объекты со счётчиками', () => {
    const { assignees, objects } = getFilterOptions(tasks);
    expect(assignees).toEqual([
      { id: 'e1', label: 'Ковалёв', count: 2 },
      { id: 'e2', label: 'Орлов', count: 1 },
    ]);
    expect(objects.map((o) => o.label)).toEqual(['Дом', 'Склад']);
  });
});

describe('isFiltered', () => {
  it('сортировка фильтром не считается', () => {
    expect(isFiltered({ ...EMPTY_FILTERS, sort: 'number' })).toBe(false);
    expect(isFiltered({ ...EMPTY_FILTERS, q: ' x ' })).toBe(true);
  });
});
