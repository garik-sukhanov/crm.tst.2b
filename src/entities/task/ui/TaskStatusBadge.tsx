import { cn } from '@/shared/lib/utils';
import { TASK_STATUS_META, type TaskStatus } from '../config/status';

type Props = { status: TaskStatus; className?: string };

/** Статус: цветная метка + подпись. Цвет несёт смысл, текст остаётся контрастным. */
export const TaskStatusBadge = ({ status, className }: Props) => {
  const meta = TASK_STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-md bg-secondary px-2 text-xs font-medium text-secondary-foreground',
        className,
      )}
    >
      <span aria-hidden className={cn('size-2 rounded-full', meta.colorClass)} />
      {meta.label}
    </span>
  );
};
