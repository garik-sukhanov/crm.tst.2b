import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

type Props = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export const PageHeader = ({ title, description, eyebrow, actions, className }: Props) => (
  <header
    className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}
  >
    <div className="flex min-w-0 flex-col gap-1">
      {eyebrow && <div className="text-sm text-muted-foreground">{eyebrow}</div>}
      <h1 className="text-2xl leading-tight font-medium text-balance md:text-[28px]">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
  </header>
);
