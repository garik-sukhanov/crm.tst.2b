import type { TaskStatus } from '@/shared/api';
import { cn } from '@/shared/lib/utils';
import type { StatusCounts } from '../api/objects';

const ORDER: TaskStatus[] = ['done', 'review', 'in_progress', 'rework', 'new'];
const COLOR: Record<TaskStatus, string> = {
  new: 'bg-status-new',
  in_progress: 'bg-status-in-progress',
  review: 'bg-status-review',
  rework: 'bg-status-rework',
  done: 'bg-status-done',
};

type Props = { counts: StatusCounts; total: number; className?: string };

/** Полоса прогресса объекта: доли задач по статусам, от принятых к новым. */
export const StatusBar = ({ counts, total, className }: Props) => (
  <div
    className={cn('flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-secondary', className)}
    role="img"
    aria-label={`Принято ${counts.done} из ${total}`}
  >
    {total > 0 &&
      ORDER.filter((status) => counts[status] > 0).map((status) => (
        <span
          key={status}
          className={cn('h-full', COLOR[status])}
          style={{ width: `${(counts[status] / total) * 100}%` }}
        />
      ))}
  </div>
);
