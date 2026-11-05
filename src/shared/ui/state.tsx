import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from './button';

type EmptyProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export const EmptyState = ({ title, description, action, className }: EmptyProps) => (
  <div
    className={cn(
      'flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center',
      className,
    )}
  >
    <p className="text-sm font-medium">{title}</p>
    {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

type ErrorProps = { message: string; onRetry?: () => void };

export const ErrorState = ({ message, onRetry }: ErrorProps) => (
  <EmptyState
    title="Не удалось загрузить"
    description={message}
    action={
      onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Повторить
        </Button>
      )
    }
  />
);
