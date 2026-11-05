import { useUnit } from 'effector-react';
import type { ConstructionObject } from '@/entities/object';
import { pluralCount } from '@/shared/lib/format';
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
import { deleteObjectFx } from '../model/object-editor';

type Props = {
  object: ConstructionObject;
  taskCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export const DeleteObjectDialog = ({ object, taskCount, open, onOpenChange, onDeleted }: Props) => {
  const [remove, pending] = useUnit([deleteObjectFx, deleteObjectFx.pending]);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить «{object.name}»?</AlertDialogTitle>
          <AlertDialogDescription>
            {taskCount > 0
              ? `Вместе с объектом удалятся ${pluralCount(taskCount, ['задача', 'задачи', 'задач'])} и их история. Отменить это нельзя.`
              : 'Отменить это нельзя.'}
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
                await remove(object.id);
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
