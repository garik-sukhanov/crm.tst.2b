import { useUnit } from 'effector-react';
import { type FormEvent, useState } from 'react';
import type { ConstructionObject } from '@/entities/object';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { saveObjectFx } from '../model/object-editor';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  object?: ConstructionObject;
};

const Form = ({ object, onDone }: { object?: ConstructionObject; onDone: () => void }) => {
  const [save, pending] = useUnit([saveObjectFx, saveObjectFx.pending]);
  const [name, setName] = useState(object?.name ?? '');
  const [address, setAddress] = useState(object?.address ?? '');
  const valid = name.trim().length > 0 && address.trim().length > 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    try {
      await save({ id: object?.id, name, address });
      onDone();
    } catch {
      // ошибка уже показана уведомлением
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{object ? 'Изменить объект' : 'Новый объект'}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor="object-name">Название</Label>
        <Input
          id="object-name"
          autoFocus
          maxLength={200}
          placeholder="ЖК «Северный», корпус 2"
          className="h-11 text-base md:text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="object-address">Адрес</Label>
        <Input
          id="object-address"
          maxLength={500}
          placeholder="Город, улица, дом"
          className="h-11 text-base md:text-sm"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <DialogFooter className="gap-2">
        <Button type="submit" className="h-11 sm:h-9" disabled={!valid || pending}>
          {pending ? 'Сохраняем…' : object ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export const ObjectFormDialog = ({ open, onOpenChange, object }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      {open && <Form object={object} onDone={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>
);
