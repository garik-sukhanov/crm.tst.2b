import { useGate, useUnit } from 'effector-react';
import { useMemo } from 'react';
import { applyTaskFilters, getFilterOptions } from '@/entities/task';
import { useViewer } from '@/entities/viewer';
import { TaskFilterBar, useTaskFilters } from '@/features/task-filters';
import { pluralCount } from '@/shared/lib/format';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/state';
import { TaskBoard } from '@/widgets/task-board';
import { $tasks, TasksGate, tasksQuery } from '../model/tasks';

export const TasksPage = () => {
  useGate(TasksGate);
  const viewer = useViewer();
  const manager = viewer.role === 'manager';
  const [tasks, loaded, error, retry] = useUnit([
    $tasks,
    tasksQuery.$succeeded,
    tasksQuery.$error,
    tasksQuery.start,
  ]);
  const [filters, setFilters, resetFilters] = useTaskFilters();
  const options = useMemo(() => getFilterOptions(tasks), [tasks]);
  const visible = useMemo(() => applyTaskFilters(tasks, filters), [tasks, filters]);

  const open = tasks.filter((t) => t.status !== 'done').length;
  const review = tasks.filter((t) => t.status === 'review').length;
  const rework = tasks.filter((t) => t.status === 'rework').length;
  const summary = loaded
    ? [
        open > 0
          ? `${pluralCount(open, ['задача', 'задачи', 'задач'])} в работе и ожидании`
          : 'Все задачи закрыты',
        manager
          ? review > 0 && `${review} ждут проверки`
          : rework > 0 && `${rework} вернули на доработку`,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'По всем объектам';

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader title={manager ? 'Все задачи' : 'Мои задачи'} description={summary} />
      {error && !loaded ? (
        <ErrorState message={(error as Error).message} onRetry={() => retry()} />
      ) : !loaded ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="Задач нет"
          description={
            manager
              ? 'Создайте задачу на доске объекта.'
              : 'Когда постановщик назначит вам задачу, она появится здесь.'
          }
        />
      ) : (
        <>
          <TaskFilterBar
            filters={filters}
            onChange={setFilters}
            onReset={resetFilters}
            assignees={options.assignees}
            objects={options.objects}
            shown={visible.length}
            total={tasks.length}
          />
          <TaskBoard
            tasks={visible}
            preferred={manager ? ['review', 'rework'] : ['rework', 'new', 'in_progress']}
            showObject
            showAssignee={manager}
          />
        </>
      )}
    </div>
  );
};
