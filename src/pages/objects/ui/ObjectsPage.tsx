import { useGate, useUnit } from 'effector-react';
import { MapPinIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { type ObjectSummary, StatusBar } from '@/entities/object';
import { canManage } from '@/entities/task';
import { useViewer } from '@/entities/viewer';
import { ObjectFormDialog } from '@/features/object-editor';
import { routes } from '@/shared/config';
import { pluralCount } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/state';
import { ObjectsGate, objectsQuery } from '../model/objects';

const ObjectCard = ({ object, mine }: { object: ObjectSummary; mine: boolean }) => {
  const attention = object.counts.review + object.counts.rework;
  return (
    <li>
      <Link
        to={routes.object(object.id)}
        className="flex h-full flex-col gap-4 rounded-xl border bg-card p-4 transition-[border-color] duration-150 hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-base leading-snug font-medium">{object.name}</h2>
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
            {object.address}
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <StatusBar counts={object.counts} total={object.total} />
          <p className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
            <span>
              {object.total === 0
                ? 'Задач пока нет'
                : `${pluralCount(object.total, mine ? ['ваша задача', 'ваши задачи', 'ваших задач'] : ['задача', 'задачи', 'задач'])}, принято ${object.counts.done}`}
            </span>
            {attention > 0 && (
              <span className="text-foreground">
                {object.counts.review > 0 && `${object.counts.review} на проверке`}
                {object.counts.review > 0 && object.counts.rework > 0 && ' · '}
                {object.counts.rework > 0 && `${object.counts.rework} на доработке`}
              </span>
            )}
          </p>
        </div>
      </Link>
    </li>
  );
};

export const ObjectsPage = () => {
  useGate(ObjectsGate);
  const viewer = useViewer();
  const [objects, pending, error, retry] = useUnit([
    objectsQuery.$data,
    objectsQuery.$pending,
    objectsQuery.$error,
    objectsQuery.start,
  ]);
  const [creating, setCreating] = useState(false);
  const manager = canManage(viewer.role);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Объекты"
        description={manager ? 'Все стройки и ход работ' : 'Стройки, где у вас есть задачи'}
        actions={
          manager && (
            <Button className="h-11 sm:h-9" onClick={() => setCreating(true)}>
              <PlusIcon className="size-4" strokeWidth={2} />
              Новый объект
            </Button>
          )
        }
      />

      {error && objects.length === 0 ? (
        <ErrorState message={(error as Error).message} onRetry={() => retry()} />
      ) : pending && objects.length === 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1920px]:grid-cols-5">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Skeleton className="h-36 rounded-xl" />
            </li>
          ))}
        </ul>
      ) : objects.length === 0 ? (
        <EmptyState
          title={manager ? 'Объектов пока нет' : 'Вам пока не назначили задач'}
          description={
            manager
              ? 'Создайте первый объект, затем добавьте в него задачи.'
              : 'Объекты появятся здесь, когда постановщик назначит вам задачу.'
          }
          action={manager && <Button onClick={() => setCreating(true)}>Новый объект</Button>}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[1920px]:grid-cols-5">
          {objects.map((object) => (
            <ObjectCard key={object.id} object={object} mine={!manager} />
          ))}
        </ul>
      )}

      {manager && <ObjectFormDialog open={creating} onOpenChange={setCreating} />}
    </div>
  );
};
