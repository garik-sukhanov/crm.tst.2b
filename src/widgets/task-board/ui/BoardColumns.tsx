import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useUnit } from 'effector-react';
import { useMemo, useState } from 'react';
import {
  findTransition,
  getDropTargets,
  groupByStatus,
  TASK_STATUS_META,
  TASK_STATUSES,
  type Task,
  TaskCard,
  type TaskStatus,
} from '@/entities/task';
import { useViewer } from '@/entities/viewer';
import { $pendingTaskIds, TaskActions, transitionRequested } from '@/features/change-task-status';
import { cn } from '@/shared/lib/utils';

const DraggableCard = ({
  task,
  draggable,
  showObject,
  showAssignee,
}: {
  task: Task;
  draggable: boolean;
  showObject: boolean;
  showAssignee: boolean;
}) => {
  const pendingIds = useUnit($pendingTaskIds);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: !draggable,
  });
  return (
    <div
      ref={setNodeRef}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      className={cn(
        'touch-manipulation',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-30',
      )}
    >
      <TaskCard
        task={task}
        showObject={showObject}
        showAssignee={showAssignee}
        pending={pendingIds.has(task.id)}
        actions={<TaskActions task={task} size="sm" />}
      />
    </div>
  );
};

type ColumnProps = {
  status: TaskStatus;
  tasks: Task[];
  dragging: boolean;
  canDrop: boolean;
  draggableIds: Set<string>;
  showObject: boolean;
  showAssignee: boolean;
};

const Column = ({
  status,
  tasks,
  dragging,
  canDrop,
  draggableIds,
  showObject,
  showAssignee,
}: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: !canDrop });
  const meta = TASK_STATUS_META[status];
  return (
    <section
      ref={setNodeRef}
      aria-label={meta.label}
      className={cn(
        'flex min-h-48 flex-col gap-2 rounded-xl border border-transparent bg-secondary/60 p-2 transition-[opacity,border-color,background-color] duration-150',
        dragging && !canDrop && 'opacity-40',
        dragging && canDrop && 'border-dashed border-signal/70',
        isOver && canDrop && 'border-solid border-signal bg-signal/10',
      )}
    >
      <header className="flex h-8 items-center gap-2 px-1">
        <span aria-hidden className={cn('size-2 rounded-full', meta.colorClass)} />
        <h2 className="text-sm font-medium">{meta.label}</h2>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{tasks.length}</span>
      </header>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            draggable={draggableIds.has(task.id)}
            showObject={showObject}
            showAssignee={showAssignee}
          />
        ))}
        {tasks.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">Пусто</p>
        )}
      </div>
    </section>
  );
};

/** Доска на планшете и десктопе: колонки статусов, перетаскивание по правилам ролей. */
export const BoardColumns = ({
  tasks,
  showObject = false,
  showAssignee = true,
}: {
  tasks: Task[];
  showObject?: boolean;
  showAssignee?: boolean;
}) => {
  const viewer = useViewer();
  const request = useUnit(transitionRequested);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const groups = useMemo(() => groupByStatus(tasks), [tasks]);
  const activeTask = tasks.find((t) => t.id === activeId) ?? null;
  const dropTargets = activeTask ? getDropTargets(viewer, activeTask) : new Set<TaskStatus>();
  const draggableIds = useMemo(
    () => new Set(tasks.filter((t) => getDropTargets(viewer, t).size > 0).map((t) => t.id)),
    [tasks, viewer],
  );

  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id));
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    const task = tasks.find((t) => t.id === active.id);
    if (!task || !over) return;
    const transition = findTransition(viewer, task, over.id as TaskStatus);
    if (transition) request({ taskId: task.id, transition });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            'Чтобы взять задачу, нажмите пробел. Стрелками выберите колонку, пробелом отпустите, Escape — отмена.',
        },
      }}
    >
      {/* Доска занимает всю оставшуюся высоту экрана: колонки тянутся до низа. */}
      <div className="-mx-4 flex flex-1 flex-col overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
        <div className="grid min-w-max flex-1 auto-cols-[minmax(232px,1fr)] grid-flow-col gap-3 xl:min-w-0">
          {TASK_STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={groups[status]}
              dragging={!!activeTask}
              canDrop={dropTargets.has(status)}
              draggableIds={draggableIds}
              showObject={showObject}
              showAssignee={showAssignee}
            />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {activeTask && (
          <div className="rotate-1 cursor-grabbing shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <TaskCard task={activeTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
