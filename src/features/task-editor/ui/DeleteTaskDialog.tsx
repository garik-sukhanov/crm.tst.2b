import { useUnit } from 'effector-react';
import type { Task } from '@/entities/task';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { deleteTaskFx } from '../model/task-editor';

type Props = {
  task: Pick<Task, 'id' | 'title'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export const DeleteTaskDialog = ({ task, open, onOpenChange, onDeleted }: Props) => {
  const [remove, pending] = useUnit([deleteTaskFx, deleteTaskFx.pending]);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
          <AlertDialogDescription>
            «{task.title}» удалится вместе с историей и перепиской. Отменить это нельзя.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={async (event) => {
              event.preventDefault();
              try {
                await remove(task.id);
                onOpenChange(false);
                onDeleted?.();
              } catch {
                // уведомление уже показано
              }
            }}
          >
            {pending ? 'Удаляем…' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
