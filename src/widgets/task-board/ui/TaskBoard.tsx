import type { Task, TaskStatus } from '@/entities/task';
import { useIsBoardLayout } from '@/shared/lib/media';
import { BoardColumns } from './BoardColumns';
import { StatusTabs } from './StatusTabs';

type Props = {
  tasks: Task[];
  preferred?: TaskStatus[];
  showObject?: boolean;
  showAssignee?: boolean;
};

export const TaskBoard = ({ tasks, preferred, showObject, showAssignee }: Props) =>
  useIsBoardLayout() ? (
    <BoardColumns tasks={tasks} showObject={showObject} showAssignee={showAssignee} />
  ) : (
    <StatusTabs
      tasks={tasks}
      preferred={preferred}
      showObject={showObject}
      showAssignee={showAssignee}
    />
  );
