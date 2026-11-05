import { createEffect } from 'effector';
import { toast } from 'sonner';

export const notifyErrorFx = createEffect((message: string) => {
  toast.error(message);
});

export const notifySuccessFx = createEffect((message: string) => {
  toast.success(message);
});
