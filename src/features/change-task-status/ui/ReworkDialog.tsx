import { useUnit } from 'effector-react';
import type { FormEvent } from 'react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import {
  $reworkComment,
  $reworkError,
  $reworkTarget,
  changeStatusMutation,
  reworkCommentChanged,
  reworkDialogClosed,
  reworkSubmitted,
} from '../model/change-status';

/** Возврат на доработку: комментарий обязателен (ТЗ 2.3). Монтируется один раз в каркасе. */
export const ReworkDialog = () => {
  const [target, comment, error, pending] = useUnit([
    $reworkTarget,
    $reworkComment,
    $reworkError,
    changeStatusMutation.$pending,
  ]);
  const [onChange, onSubmit, onClose] = useUnit([
    reworkCommentChanged,
    reworkSubmitted,
    reworkDialogClosed,
  ]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Вернуть на доработку</DialogTitle>
            <DialogDescription>Исполнитель увидит комментарий в истории задачи.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rework-comment">Что исправить</Label>
            <Textarea
              id="rework-comment"
              autoFocus
              rows={4}
              maxLength={2000}
              className="text-base md:text-sm"
              value={comment}
              onChange={(e) => onChange(e.target.value)}
              aria-invalid={!!error}
            />
            <p role="alert" className="min-h-5 text-sm text-destructive">
              {error}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Отправляем…' : 'Вернуть'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
