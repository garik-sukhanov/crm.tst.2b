import { useUnit } from 'effector-react';
import { getAvailableTransitions, type Task } from '@/entities/task';
import { useViewer } from '@/entities/viewer';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { $pendingTaskIds, transitionRequested } from '../model/change-status';

type Props = {
  task: Pick<Task, 'id' | 'status' | 'assigneeId'>;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
};

/** Кнопки только тех действий, которые доступны текущему пользователю в текущем статусе. */
export const TaskActions = ({ task, size = 'default', className }: Props) => {
  const viewer = useViewer();
  const [pendingIds, request] = useUnit([$pendingTaskIds, transitionRequested]);
  const transitions = getAvailableTransitions(viewer, task);
  if (transitions.length === 0) return null;

  const pending = pendingIds.has(task.id);

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {transitions.map((transition) => (
        <Button
          key={transition.to}
          size={size}
          variant={transition.to === 'rework' ? 'outline' : 'default'}
          disabled={pending}
          className={cn(size === 'lg' && 'h-11', size === 'sm' && 'h-9')}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            request({ taskId: task.id, transition });
          }}
        >
          {transition.action}
        </Button>
      ))}
    </div>
  );
};
