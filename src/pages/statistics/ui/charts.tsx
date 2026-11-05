import { type ReactNode, useState } from 'react';
import { TASK_STATUS_META, type TaskStatus } from '@/entities/task';
import { cn } from '@/shared/lib/utils';
import type { BreakdownRow, DayBucket } from '../lib/compute';

/** Порядок в полосе: от принятых к новым. Красный и зелёный не соседствуют (различимость при дальтонизме). */
const STACK: TaskStatus[] = ['done', 'review', 'in_progress', 'rework', 'new'];

export const StatusLegend = ({ className }: { className?: string }) => (
  <ul className={cn('flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground', className)}>
    {STACK.map((status) => (
      <li key={status} className="flex items-center gap-1.5">
        <span
          aria-hidden
          className={cn('size-2 rounded-full', TASK_STATUS_META[status].colorClass)}
        />
        {TASK_STATUS_META[status].label}
      </li>
    ))}
  </ul>
);

const Tooltip = ({ children }: { children: ReactNode }) => (
  <div
    role="status"
    className="pointer-events-none absolute -top-2 left-1/2 z-10 w-max max-w-56 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
  >
    {children}
  </div>
);

/** Горизонтальные полосы с разбивкой по статусам. Подпись и итог — текстом, цвет — дополнительно. */
export const StackedBars = ({ rows, unit }: { rows: BreakdownRow[]; unit: string }) => {
  const [hover, setHover] = useState<{ row: string; status: TaskStatus } | null>(null);
  const max = Math.max(1, ...rows.map((r) => r.total));

  return (
    <ul className="flex flex-col gap-4">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{row.label}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {row.total} {unit}
            </span>
          </div>
          <div
            className="relative h-3"
            style={{ width: `${Math.max(8, (row.total / max) * 100)}%` }}
          >
            <div className="flex h-full gap-0.5">
              {STACK.filter((s) => row.counts[s] > 0).map((status) => {
                const active = hover?.row === row.id && hover.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    aria-label={`${row.label}: ${TASK_STATUS_META[status].label} — ${row.counts[status]}`}
                    onMouseEnter={() => setHover({ row: row.id, status })}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover({ row: row.id, status })}
                    onBlur={() => setHover(null)}
                    className={cn(
                      'relative h-full rounded-[3px] outline-none transition-opacity duration-150 first:rounded-l-[4px] last:rounded-r-[4px] focus-visible:ring-2 focus-visible:ring-ring',
                      TASK_STATUS_META[status].colorClass,
                      hover && !active && hover.row === row.id && 'opacity-50',
                    )}
                    style={{ flexGrow: row.counts[status], flexBasis: 0 }}
                  >
                    {active && (
                      <Tooltip>
                        <span className="font-medium">{TASK_STATUS_META[status].label}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · {row.counts[status]} из {row.total}
                        </span>
                      </Tooltip>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

const dayLabel = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });

/** Приёмки вверх, возвраты вниз от общей оси: направление различает ряды, не только цвет. */
export const ActivityChart = ({ days }: { days: DayBucket[] }) => {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...days.map((d) => Math.max(d.accepted, d.returned)));
  const HALF = 64;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex items-stretch gap-1" style={{ height: HALF * 2 + 1 }}>
        <div
          aria-hidden
          className="absolute inset-x-0 border-t border-border"
          style={{ top: HALF }}
        />
        {days.map((day) => {
          const date = new Date(`${day.date}T00:00:00Z`);
          const active = hover === day.date;
          return (
            <button
              key={day.date}
              type="button"
              aria-label={`${dayLabel.format(date)}: принято ${day.accepted}, возвращено ${day.returned}`}
              onMouseEnter={() => setHover(day.date)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(day.date)}
              onBlur={() => setHover(null)}
              className={cn(
                'relative flex flex-1 flex-col items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active && 'bg-secondary/70',
              )}
            >
              <span
                className="flex w-full flex-1 items-end justify-center"
                style={{ maxHeight: HALF }}
              >
                {day.accepted > 0 && (
                  <span
                    className="w-full max-w-4 rounded-t-[4px] bg-status-done"
                    style={{ height: `${(day.accepted / max) * (HALF - 4)}px` }}
                  />
                )}
              </span>
              <span className="h-px w-full" />
              <span
                className="flex w-full flex-1 items-start justify-center"
                style={{ maxHeight: HALF }}
              >
                {day.returned > 0 && (
                  <span
                    className="w-full max-w-4 rounded-b-[4px] bg-status-rework"
                    style={{ height: `${(day.returned / max) * (HALF - 4)}px` }}
                  />
                )}
              </span>
              {active && (
                <Tooltip>
                  <span className="font-medium">
                    {weekday.format(date)}, {dayLabel.format(date)}
                  </span>
                  <br />
                  <span className="text-muted-foreground">
                    Принято {day.accepted} · возвращено {day.returned}
                  </span>
                </Tooltip>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{dayLabel.format(new Date(`${days[0]?.date}T00:00:00Z`))}</span>
        <span>сегодня</span>
      </div>
    </div>
  );
};
