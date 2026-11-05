import { useGate, useUnit } from 'effector-react';
import {
  ChevronLeftIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { canManage } from '@/entities/task';
import { useViewer } from '@/entities/viewer';
import { DeleteObjectDialog, ObjectFormDialog } from '@/features/object-editor';
import { TaskFormDialog } from '@/features/task-editor';
import { routes } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/state';
import { TaskBoard } from '@/widgets/task-board';
import { $tasks, BoardGate, objectQuery, tasksQuery } from '../model/board';

export const ObjectBoardPage = () => {
  const { objectId = '' } = useParams();
  useGate(BoardGate, { objectId });
  const viewer = useViewer();
  const navigate = useNavigate();
  const manager = canManage(viewer.role);

  const [object, objectError, tasks, tasksLoaded, tasksError, retry] = useUnit([
    objectQuery.$data,
    objectQuery.$error,
    $tasks,
    tasksQuery.$succeeded,
    tasksQuery.$error,
    tasksQuery.start,
  ]);
  const [creatingTask, setCreatingTask] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const back = (
    <Link
      to={routes.objects}
      className="-ml-1 inline-flex h-8 items-center gap-1 rounded-md pr-2 hover:text-foreground"
    >
      <ChevronLeftIcon className="size-4" strokeWidth={1.75} />
      Объекты
    </Link>
  );

  if (objectError) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-sm text-muted-foreground">{back}</div>
        <EmptyState
          title="Объект не найден"
          description="Возможно, его удалили или у вас нет к нему доступа."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {object ? (
        <PageHeader
          eyebrow={back}
          title={object.name}
          description={
            <span className="inline-flex items-start gap-1.5">
              <MapPinIcon className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
              {object.address}
            </span>
          }
          actions={
            manager && (
              <>
                <Button
                  className="h-11 flex-1 sm:h-9 sm:flex-none"
                  onClick={() => setCreatingTask(true)}
                >
                  <PlusIcon className="size-4" strokeWidth={2} />
                  Задача
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-11 sm:size-9"
                      aria-label="Действия с объектом"
                    >
                      <MoreHorizontalIcon className="size-4" strokeWidth={1.75} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="min-h-10" onSelect={() => setEditing(true)}>
                      <PencilIcon className="size-4" strokeWidth={1.75} />
                      Изменить
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      className="min-h-10"
                      onSelect={() => setDeleting(true)}
                    >
                      <Trash2Icon className="size-4" strokeWidth={1.75} />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">{back}</div>
          <Skeleton className="h-8 w-2/3 max-w-md" />
          <Skeleton className="h-4 w-1/2 max-w-sm" />
        </div>
      )}

      {tasksError && !tasksLoaded ? (
        <ErrorState message={(tasksError as Error).message} onRetry={() => retry(objectId)} />
      ) : !tasksLoaded ? (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="Задач пока нет"
          description={manager ? 'Добавьте задачу и назначьте исполнителя.' : undefined}
          action={manager && <Button onClick={() => setCreatingTask(true)}>Добавить задачу</Button>}
        />
      ) : (
        <TaskBoard
          tasks={tasks}
          preferred={manager ? ['review', 'rework'] : ['rework', 'new', 'in_progress']}
        />
      )}

      {manager && object && (
        <>
          <TaskFormDialog
            open={creatingTask}
            onOpenChange={setCreatingTask}
            objectId={object.id}
            objectName={object.name}
          />
          <ObjectFormDialog open={editing} onOpenChange={setEditing} object={object} />
          <DeleteObjectDialog
            object={object}
            taskCount={tasks.length}
            open={deleting}
            onOpenChange={setDeleting}
            onDeleted={() => navigate(routes.objects, { replace: true })}
          />
        </>
      )}
    </div>
  );
};
