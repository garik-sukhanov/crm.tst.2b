import type { TaskStatus } from '@/shared/api';
import type { Task } from '../api/tasks';

/** Оптимистично переставить задачу в новый статус (или откатить). */
export const applyStatus = (
  tasks: Task[],
  taskId: string,
  status: TaskStatus,
  updatedAt?: string,
): Task[] =>
  tasks.map((task) =>
    task.id === taskId ? { ...task, status, ...(updatedAt ? { updatedAt } : {}) } : task,
  );

export const groupByStatus = (tasks: Task[]): Record<TaskStatus, Task[]> => {
  const groups: Record<TaskStatus, Task[]> = {
    new: [],
    in_progress: [],
    review: [],
    rework: [],
    done: [],
  };
  for (const task of tasks) groups[task.status].push(task);
  return groups;
};
