import { ROLE_LABEL, UserAvatar } from '@/entities/user';
import { useViewer } from '@/entities/viewer';
import { SignOutMenuItem } from '@/features/auth/sign-out';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export const UserMenu = () => {
  const viewer = useViewer();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-2" aria-label="Профиль">
          <UserAvatar name={viewer.fullName} />
          <span className="hidden max-w-40 truncate text-sm font-medium lg:inline">
            {viewer.fullName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">{viewer.fullName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {ROLE_LABEL[viewer.role]} · {viewer.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <SignOutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
