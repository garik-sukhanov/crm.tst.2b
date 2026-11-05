import { LogOutIcon } from 'lucide-react';
import { useState } from 'react';
import { signOut } from '@/entities/viewer';
import { routes } from '@/shared/config';
import { DropdownMenuItem } from '@/shared/ui/dropdown-menu';

/** Выход с полной перезагрузкой: в памяти не остаётся данных прошлого пользователя. */
export const SignOutMenuItem = () => {
  const [pending, setPending] = useState(false);
  return (
    <DropdownMenuItem
      className="min-h-10"
      disabled={pending}
      onSelect={async (event) => {
        event.preventDefault();
        setPending(true);
        await signOut();
        window.location.assign(routes.login);
      }}
    >
      <LogOutIcon className="size-4" strokeWidth={1.75} />
      Выйти
    </DropdownMenuItem>
  );
};
