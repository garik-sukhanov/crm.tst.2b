import { useUnit } from 'effector-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  groupByStatus,
  TASK_STATUS_META,
  TASK_STATUSES,
  type Task,
  TaskCard,
  type TaskStatus,
} from '@/entities/task';
import { $pendingTaskIds, TaskActions } from '@/features/change-task-status';
import { cn } from '@/shared/lib/utils';

type Props = {
  tasks: Task[];
  showObject?: boolean;
  showAssignee?: boolean;
  /** С какого статуса открыть, если в нём есть задачи. */
  preferred?: TaskStatus[];
};

/** Телефон: вместо колонок — табы статусов со счётчиками, статус меняется кнопками. */
export const StatusTabs = ({
  tasks,
  showObject = false,
  showAssignee = true,
  preferred = [],
}: Props) => {
  const pendingIds = useUnit($pendingTaskIds);
  const groups = useMemo(() => groupByStatus(tasks), [tasks]);
  const initial =
    [...preferred, ...TASK_STATUSES].find((status) => groups[status].length > 0) ?? 'new';
  const [selected, setSelected] = useState<TaskStatus>(initial);
  const visible = groups[selected];
  const activeRef = useRef<HTMLButtonElement>(null);

  // Выбранный статус всегда в зоне видимости ленты табов.
  // biome-ignore lint/correctness/useExhaustiveDependencies: прокручиваем при смене выбранного таба
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [selected]);

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="Статусы"
        className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
      >
        {TASK_STATUSES.map((status) => {
          const meta = TASK_STATUS_META[status];
          const active = status === selected;
          return (
            <button
              key={status}
              ref={active ? activeRef : undefined}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelected(status)}
              className={cn(
                'flex h-10 shrink-0 snap-start items-center gap-2 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card text-muted-foreground',
              )}
            >
              <span aria-hidden className={cn('size-2 rounded-full', meta.colorClass)} />
              {meta.label}
              <span className={cn('tabular-nums', active ? 'opacity-70' : 'opacity-80')}>
                {groups[status].length}
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="flex flex-col gap-2">
        {visible.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            showObject={showObject}
            showAssignee={showAssignee}
            pending={pendingIds.has(task.id)}
            actions={<TaskActions task={task} size="lg" className="[&>button]:flex-1" />}
          />
        ))}
        {visible.length === 0 && (
          <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            В статусе «{TASK_STATUS_META[selected].label}» задач нет
          </p>
        )}
      </div>
    </div>
  );
};
