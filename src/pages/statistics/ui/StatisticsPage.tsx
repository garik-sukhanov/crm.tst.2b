import { useGate, useUnit } from 'effector-react';
import type { ReactNode } from 'react';
import { TASK_STATUS_META, TASK_STATUSES } from '@/entities/task';
import { useViewer } from '@/entities/viewer';
import { formatDuration, plural } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/state';
import type { BreakdownRow } from '../lib/compute';
import { StatisticsGate, statisticsQuery } from '../model/statistics';
import { ActivityChart, StackedBars, StatusLegend } from './charts';

const Tile = ({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) => (
  <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="text-[28px] leading-none font-medium tabular-nums">{value}</dd>
    {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
  </div>
);

const Panel = ({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) => (
  <section className={cn('flex flex-col gap-4 rounded-xl border bg-card p-4 md:p-5', className)}>
    <header className="flex flex-col gap-0.5">
      <h2 className="text-base font-medium">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </header>
    {children}
  </section>
);

/** Те же цифры таблицей — для тех, кому удобнее читать, чем смотреть. */
const BreakdownTable = ({ rows, caption }: { rows: BreakdownRow[]; caption: string }) => (
  <details className="text-sm">
    <summary className="cursor-pointer text-muted-foreground select-none hover:text-foreground">
      Показать таблицей
    </summary>
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-left tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="py-1.5 pr-3 font-normal" />
            {TASK_STATUSES.map((s) => (
              <th key={s} className="px-2 py-1.5 text-right font-normal whitespace-nowrap">
                {TASK_STATUS_META[s].label}
              </th>
            ))}
            <th className="py-1.5 pl-2 text-right font-normal">Всего</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              <th className="py-1.5 pr-3 font-normal">{row.label}</th>
              {TASK_STATUSES.map((s) => (
                <td key={s} className="px-2 py-1.5 text-right">
                  {row.counts[s] || '—'}
                </td>
              ))}
              <td className="py-1.5 pl-2 text-right font-medium">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </details>
);

export const StatisticsPage = () => {
  useGate(StatisticsGate);
  const viewer = useViewer();
  const [stats, error, retry] = useUnit([
    statisticsQuery.$data,
    statisticsQuery.$error,
    statisticsQuery.start,
  ]);
  const manager = viewer.role === 'manager';

  const header = (
    <PageHeader
      title="Статистика"
      description={manager ? 'Ход работ по всем объектам' : 'По вашим задачам'}
    />
  );

  if (error && !stats) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <ErrorState message={(error as Error).message} onRetry={() => retry()} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <EmptyState
          title="Пока нечего считать"
          description="Статистика появится, когда будут задачи."
        />
      </div>
    );
  }

  const taskWord = (n: number) => plural(n, ['задача', 'задачи', 'задач']);
  const accepted14 = stats.days.reduce((s, d) => s + d.accepted, 0);
  const returned14 = stats.days.reduce((s, d) => s + d.returned, 0);

  return (
    <div className="flex flex-col gap-6">
      {header}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="В работе и ожидании"
          value={stats.open}
          hint={`из ${stats.total} ${taskWord(stats.total)}, принято ${stats.done}`}
        />
        <Tile
          label={manager ? 'Ждут вашей проверки' : 'На проверке'}
          value={stats.waitingReview}
          hint={
            stats.avgReviewHours !== null
              ? `проверка в среднем ${formatDuration(stats.avgReviewHours)}`
              : undefined
          }
        />
        <Tile
          label="Возвращали на доработку"
          value={stats.reworkRate === null ? '—' : `${Math.round(stats.reworkRate * 100)}%`}
          hint="среди задач, дошедших до проверки"
        />
        <Tile
          label="От создания до приёмки"
          value={stats.avgLeadHours === null ? '—' : formatDuration(stats.avgLeadHours)}
          hint="в среднем по принятым"
        />
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="По объектам" description="Сколько задач в каждом статусе">
          <StatusLegend />
          <StackedBars rows={stats.byObject} unit="шт." />
          <BreakdownTable rows={stats.byObject} caption="Задачи по объектам и статусам" />
        </Panel>

        {manager ? (
          <Panel title="По исполнителям" description="Нагрузка и результат">
            <StatusLegend />
            <StackedBars rows={stats.byAssignee} unit="шт." />
            <BreakdownTable rows={stats.byAssignee} caption="Задачи по исполнителям и статусам" />
          </Panel>
        ) : null}

        <Panel
          title="Приёмки и возвраты за 14 дней"
          description={`Принято ${accepted14}, возвращено ${returned14}`}
          className={manager ? 'lg:col-span-2' : undefined}
        >
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-2 rounded-full bg-status-done" />
              Принято — вверх
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-2 rounded-full bg-status-rework" />
              Возвращено — вниз
            </li>
          </ul>
          <ActivityChart days={stats.days} />
        </Panel>
      </div>
    </div>
  );
};
