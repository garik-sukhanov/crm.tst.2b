import { useGate, useUnit } from 'effector-react';
import { ChevronLeftIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { canManage, getAvailableTransitions, TaskCode, TaskStatusBadge } from '@/entities/task';
import { useViewer } from '@/entities/viewer';
import { TaskActions } from '@/features/change-task-status';
import { DeleteTaskDialog, TaskFormDialog } from '@/features/task-editor';
import { routes } from '@/shared/config';
import { formatDateTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { EmptyState } from '@/shared/ui/state';
import { TaskFeed } from '@/widgets/task-feed';
import { $task, feedQuery, TaskGate, taskQuery } from '../model/task';

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="text-sm">{children}</dd>
  </div>
);

export const TaskPage = () => {
  const { taskId = '' } = useParams();
  useGate(TaskGate, { taskId });
  const viewer = useViewer();
  const navigate = useNavigate();
  const [task, taskError, feed, feedPending] = useUnit([
    $task,
    taskQuery.$error,
    feedQuery.$data,
    feedQuery.$pending,
  ]);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const manager = canManage(viewer.role);

  if (taskError) {
    return (
      <EmptyState
        title="Задача не найдена"
        description="Возможно, её удалили или назначили другому исполнителю."
        action={
          <Button variant="outline" asChild>
            <Link to={routes.root}>На главную</Link>
          </Button>
        }
      />
    );
  }

  if (!task) {
    return (
      <div className="flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const hasActions = getAvailableTransitions(viewer, task).length > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-10">
      <article className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Link
            to={routes.object(task.objectId)}
            className="-ml-1 inline-flex h-8 w-fit items-center gap-1 rounded-md pr-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeftIcon className="size-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{task.object.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <TaskCode number={task.number} />
            <TaskStatusBadge status={task.status} />
          </div>
          <h1 className="text-2xl leading-tight font-medium text-balance md:text-[28px]">
            {task.title}
          </h1>
        </div>

        {hasActions && (
          <div className="rounded-xl border bg-card p-3">
            <TaskActions
              task={task}
              size="lg"
              className="[&>button]:flex-1 sm:[&>button]:flex-none"
            />
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border bg-card p-4 sm:grid-cols-3">
          <Field label="Исполнитель">{task.assignee.fullName}</Field>
          <Field label="Автор">{task.author.fullName}</Field>
          <Field label="Объект">
            <Link to={routes.object(task.objectId)} className="underline-offset-4 hover:underline">
              {task.object.name}
            </Link>
          </Field>
          <Field label="Создана">
            <time dateTime={task.createdAt}>{formatDateTime(task.createdAt)}</time>
          </Field>
          <Field label="Изменена">
            <time dateTime={task.updatedAt}>{formatDateTime(task.updatedAt)}</time>
          </Field>
        </dl>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium">Описание</h2>
          {task.description ? (
            <p className="text-sm leading-6 whitespace-pre-wrap">{task.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Без описания</p>
          )}
        </section>

        {manager && (
          <div className="flex gap-2">
            <Button variant="outline" className="h-11 sm:h-9" onClick={() => setEditing(true)}>
              <PencilIcon className="size-4" strokeWidth={1.75} />
              Изменить
            </Button>
            <Button
              variant="ghost"
              className="h-11 text-destructive hover:text-destructive sm:h-9"
              onClick={() => setDeleting(true)}
            >
              <Trash2Icon className="size-4" strokeWidth={1.75} />
              Удалить
            </Button>
          </div>
        )}
      </article>

      <aside className="min-w-0 lg:border-l lg:pl-10">
        <TaskFeed taskId={task.id} items={feed} loading={feedPending} />
      </aside>

      {manager && (
        <>
          <TaskFormDialog
            open={editing}
            onOpenChange={setEditing}
            objectId={task.objectId}
            objectName={task.object.name}
            task={task}
          />
          <DeleteTaskDialog
            task={task}
            open={deleting}
            onOpenChange={setDeleting}
            onDeleted={() => navigate(routes.object(task.objectId), { replace: true })}
          />
        </>
      )}
    </div>
  );
};
