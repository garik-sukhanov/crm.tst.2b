import { useGate, useUnit } from 'effector-react';
import { useViewer } from '@/entities/viewer';
import { pluralCount } from '@/shared/lib/format';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/state';
import { TaskBoard } from '@/widgets/task-board';
import { $myTasks, MyTasksGate, myTasksQuery } from '../model/my-tasks';

export const MyTasksPage = () => {
  const viewer = useViewer();
  useGate(MyTasksGate, { userId: viewer.id });
  const [tasks, loaded, error, retry] = useUnit([
    $myTasks,
    myTasksQuery.$succeeded,
    myTasksQuery.$error,
    myTasksQuery.start,
  ]);
  const open = tasks.filter((t) => t.status !== 'done').length;
  const rework = tasks.filter((t) => t.status === 'rework').length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Мои задачи"
        description={
          loaded
            ? [
                open > 0
                  ? `${pluralCount(open, ['задача', 'задачи', 'задач'])} в работе и ожидании`
                  : 'Все задачи закрыты',
                rework > 0 && `${rework} вернули на доработку`,
              ]
                .filter(Boolean)
                .join(' · ')
            : 'По всем объектам'
        }
      />
      {error && !loaded ? (
        <ErrorState message={(error as Error).message} onRetry={() => retry(viewer.id)} />
      ) : !loaded ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="Задач нет"
          description="Когда постановщик назначит вам задачу, она появится здесь."
        />
      ) : (
        <TaskBoard
          tasks={tasks}
          preferred={['rework', 'new', 'in_progress']}
          showObject
          showAssignee={false}
        />
      )}
    </div>
  );
};
