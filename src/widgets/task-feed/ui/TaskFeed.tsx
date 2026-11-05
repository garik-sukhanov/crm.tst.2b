import { ArrowRightIcon } from 'lucide-react';
import { type FeedItem, TASK_STATUS_META } from '@/entities/task';
import { UserAvatar } from '@/entities/user';
import { useViewer } from '@/entities/viewer';
import { CommentForm } from '@/features/task-comment';
import { formatDateTime } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';

const StatusItem = ({ item }: { item: Extract<FeedItem, { kind: 'status' }> }) => (
  <li className="relative flex gap-3 pl-1">
    <span
      aria-hidden
      className={cn(
        'mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-background',
        TASK_STATUS_META[item.to].colorClass,
      )}
    />
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-medium">{item.actor.fullName}</span>
        {item.from ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            {TASK_STATUS_META[item.from].label}
            <ArrowRightIcon className="size-3.5" strokeWidth={1.75} aria-label="в" />
            <span className="text-foreground">{TASK_STATUS_META[item.to].label}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">создал(а) задачу</span>
        )}
      </p>
      <time dateTime={item.at} className="text-xs text-muted-foreground tabular-nums">
        {formatDateTime(item.at)}
      </time>
      {item.comment && (
        <p className="rounded-md border-l-2 border-status-rework bg-secondary px-3 py-2 text-sm whitespace-pre-wrap">
          {item.comment}
        </p>
      )}
    </div>
  </li>
);

const CommentItem = ({
  item,
  mine,
}: {
  item: Extract<FeedItem, { kind: 'comment' }>;
  mine: boolean;
}) => (
  <li className="flex gap-3">
    <UserAvatar name={item.actor.fullName} className="-ml-1 ring-4 ring-background" />
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <p className="flex items-baseline gap-2 text-sm">
        <span className="font-medium">{mine ? 'Вы' : item.actor.fullName}</span>
        <time dateTime={item.at} className="text-xs text-muted-foreground tabular-nums">
          {formatDateTime(item.at)}
        </time>
      </p>
      <p className="rounded-lg rounded-tl-sm bg-secondary px-3 py-2 text-sm leading-5 break-words whitespace-pre-wrap">
        {item.body}
      </p>
    </div>
  </li>
);

type Props = {
  taskId: string;
  items: FeedItem[];
  loading: boolean;
};

/** Одна лента: смены статусов (история из ТЗ) и сообщения, по времени. */
export const TaskFeed = ({ taskId, items, loading }: Props) => {
  const viewer = useViewer();
  return (
    <section aria-labelledby="feed-title" className="flex flex-col gap-4">
      <h2 id="feed-title" className="text-base font-medium">
        История и обсуждение
      </h2>
      {loading && items.length === 0 ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      ) : (
        <ol className="relative flex flex-col gap-5 before:absolute before:top-2 before:bottom-2 before:left-[9px] before:w-px before:bg-border">
          {items.map((item) =>
            item.kind === 'status' ? (
              <StatusItem key={item.id} item={item} />
            ) : (
              <CommentItem key={item.id} item={item} mine={item.actor.id === viewer.id} />
            ),
          )}
        </ol>
      )}
      <CommentForm taskId={taskId} />
    </section>
  );
};
