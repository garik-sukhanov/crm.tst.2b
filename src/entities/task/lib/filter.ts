import type { Task } from '../api/tasks';

export type TaskSort = 'number' | 'updated' | 'created';

export type TaskFilters = {
  q: string;
  assigneeId: string | null;
  objectId: string | null;
  sort: TaskSort;
};

export const EMPTY_FILTERS: TaskFilters = {
  q: '',
  assigneeId: null,
  objectId: null,
  sort: 'updated',
};

export type FilterOption = { id: string; label: string; count: number };

const normalize = (value: string) => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim();

/** Совпадение по названию, описанию или номеру («14», «т-014», «Т014»). */
const matchesQuery = (task: Task, query: string) => {
  const q = normalize(query);
  if (!q) return true;
  const digits = q.replace(/^т-?/, '');
  if (/^\d+$/.test(digits) && String(task.number) === String(Number(digits))) return true;
  return normalize(`${task.title} ${task.description}`).includes(q);
};

const SORTERS: Record<TaskSort, (a: Task, b: Task) => number> = {
  number: (a, b) => a.number - b.number,
  updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  created: (a, b) => b.createdAt.localeCompare(a.createdAt),
};

export const applyTaskFilters = (tasks: Task[], filters: TaskFilters): Task[] =>
  tasks
    .filter(
      (task) =>
        (!filters.assigneeId || task.assigneeId === filters.assigneeId) &&
        (!filters.objectId || task.objectId === filters.objectId) &&
        matchesQuery(task, filters.q),
    )
    .toSorted(SORTERS[filters.sort]);

const collect = (
  tasks: Task[],
  key: (t: Task) => { id: string; label: string },
): FilterOption[] => {
  const map = new Map<string, FilterOption>();
  for (const task of tasks) {
    const { id, label } = key(task);
    const option = map.get(id) ?? { id, label, count: 0 };
    option.count += 1;
    map.set(id, option);
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'ru'));
};

/** Варианты для выпадающих списков — только те, что встречаются среди задач. */
export const getFilterOptions = (tasks: Task[]) => ({
  assignees: collect(tasks, (t) => ({ id: t.assigneeId, label: t.assignee.fullName })),
  objects: collect(tasks, (t) => ({ id: t.objectId, label: t.object.name })),
});

export const isFiltered = (filters: TaskFilters) =>
  !!filters.q.trim() || !!filters.assigneeId || !!filters.objectId;
