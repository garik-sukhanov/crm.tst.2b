import { TASK_STATUSES, TaskCode, TaskStatusBadge } from '@/entities/task';

export const ObjectsPage = () => (
  <section className="flex flex-col gap-6">
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-medium">Объекты</h1>
      <p className="text-sm text-muted-foreground">
        Список строек появится после подключения базы. Ниже — статусы задач, как они будут выглядеть
        на досках.
      </p>
    </header>
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      {TASK_STATUSES.map((status, index) => (
        <div key={status} className="flex h-10 items-center gap-3">
          <TaskCode number={index + 12} />
          <TaskStatusBadge status={status} />
        </div>
      ))}
    </div>
  </section>
);
