import { cn } from '@/shared/lib/utils';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

type Props = { name: string; className?: string };

/** Инициалы в круге: в карточках и ленте, где нет фото. */
export const UserAvatar = ({ name, className }: Props) => (
  <span
    aria-hidden
    className={cn(
      'inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-secondary-foreground',
      className,
    )}
  >
    {initials(name)}
  </span>
);
