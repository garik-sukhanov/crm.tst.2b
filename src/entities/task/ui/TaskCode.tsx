import { cn } from '@/shared/lib/utils';

type Props = { number: number; className?: string };

/** Фирменная «бирка» с кодом задачи: Т-014. */
export const TaskCode = ({ number, className }: Props) => (
  <span
    className={cn(
      'inline-flex h-5 items-center rounded-sm border border-signal/60 px-1.5 font-mono text-[11px] font-medium leading-none tracking-normal text-foreground tabular-nums',
      className,
    )}
  >
    Т-{String(number).padStart(3, '0')}
  </span>
);
