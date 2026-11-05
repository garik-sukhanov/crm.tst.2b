import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { routes } from '@/shared/config';
import { formatRelative } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import type { Task } from '../api/tasks';
import { TaskCode } from './TaskCode';
import { TaskStatusBadge } from './TaskStatusBadge';

type Props = {
  task: Task;
  showStatus?: boolean;
  showObject?: boolean;
  showAssignee?: boolean;
  /** Кнопки действий — передаются снаружи (слой features). */
  actions?: ReactNode;
  pending?: boolean;
  className?: string;
};

export const TaskCard = ({
  task,
  showStatus = false,
  showObject = false,
  showAssignee = true,
  actions,
  pending = false,
  className,
}: Props) => (
  <article
    className={cn(
      'group relative flex flex-col gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[opacity,border-color] duration-150',
      'hover:border-foreground/15',
      pending && 'opacity-60',
      className,
    )}
  >
    <div className="flex items-center gap-2">
      <TaskCode number={task.number} />
      {showStatus && <TaskStatusBadge status={task.status} />}
      <span className="ml-auto text-xs text-muted-foreground tabular-nums">
        {formatRelative(task.updatedAt)}
      </span>
    </div>
    <h3 className="text-sm leading-5 font-medium">
      <Link
        to={routes.task(task.id)}
        className="outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring"
      >
        {task.title}
      </Link>
    </h3>
    {(showAssignee || showObject) && (
      <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
        {showAssignee && <span className="truncate">{task.assignee.fullName}</span>}
        {showAssignee && showObject && <span aria-hidden>·</span>}
        {showObject && <span className="truncate">{task.object.name}</span>}
      </div>
    )}
    {actions && <div className="relative z-10">{actions}</div>}
  </article>
);
