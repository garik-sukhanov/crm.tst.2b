import { useUnit } from 'effector-react';
import { type FormEvent, useEffect, useState } from 'react';
import type { Task } from '@/entities/task';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { executorsQuery, saveTaskFx } from '../model/task-editor';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectId: string;
  objectName?: string;
  task?: Task;
};

const Form = ({
  objectId,
  objectName,
  task,
  onDone,
}: Omit<Props, 'open' | 'onOpenChange'> & { onDone: () => void }) => {
  const [save, pending] = useUnit([saveTaskFx, saveTaskFx.pending]);
  const [executors, loadingExecutors, loadExecutors] = useUnit([
    executorsQuery.$data,
    executorsQuery.$pending,
    executorsQuery.start,
  ]);
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '');

  useEffect(() => {
    loadExecutors();
  }, [loadExecutors]);

  const valid = title.trim().length > 0 && assigneeId.length > 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    try {
      await save({ id: task?.id, objectId, title, description, assigneeId });
      onDone();
    } catch {
      // уведомление уже показано
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{task ? 'Изменить задачу' : 'Новая задача'}</DialogTitle>
        {objectName && <DialogDescription>{objectName}</DialogDescription>}
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="task-title">Название</Label>
        <Input
          id="task-title"
          autoFocus
          maxLength={200}
          className="h-11 text-base md:text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="task-description">Описание</Label>
        <Textarea
          id="task-description"
          rows={4}
          maxLength={5000}
          className="text-base md:text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="task-assignee">Исполнитель</Label>
        <Select value={assigneeId} onValueChange={setAssigneeId}>
          <SelectTrigger id="task-assignee" className="h-11 w-full text-base md:text-sm">
            <SelectValue placeholder={loadingExecutors ? 'Загружаем…' : 'Выберите исполнителя'} />
          </SelectTrigger>
          <SelectContent>
            {executors.map((user) => (
              <SelectItem key={user.id} value={user.id} className="min-h-10">
                {user.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {task && task.assigneeId !== assigneeId && (
          <p className="text-xs text-muted-foreground">
            Прежний исполнитель перестанет видеть задачу.
          </p>
        )}
      </div>
      <DialogFooter className="gap-2">
        <Button type="submit" className="h-11 sm:h-9" disabled={!valid || pending}>
          {pending ? 'Сохраняем…' : task ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export const TaskFormDialog = ({ open, onOpenChange, ...rest }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg">
      {open && <Form {...rest} onDone={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>
);
