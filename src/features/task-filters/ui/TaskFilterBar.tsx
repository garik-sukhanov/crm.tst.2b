import { SearchIcon, XIcon } from 'lucide-react';
import { type FilterOption, isFiltered, type TaskFilters, type TaskSort } from '@/entities/task';
import { pluralCount } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

const ALL = '__all__';

const SORT_LABEL: Record<TaskSort, string> = {
  updated: 'Сначала изменённые',
  created: 'Сначала новые',
  number: 'По номеру',
};

type Props = {
  filters: TaskFilters;
  onChange: (next: Partial<TaskFilters>) => void;
  onReset: () => void;
  assignees: FilterOption[];
  objects: FilterOption[];
  shown: number;
  total: number;
};

const OptionSelect = ({
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  value: string | null;
  options: FilterOption[];
  onChange: (value: string | null) => void;
}) => (
  <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? null : v)}>
    <SelectTrigger aria-label={label} className="h-10 w-full min-w-0 md:w-52">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value={ALL} className="min-h-10">
        {allLabel}
      </SelectItem>
      {options.map((option) => (
        <SelectItem key={option.id} value={option.id} className="min-h-10">
          <span className="truncate">{option.label}</span>
          <span className="ml-auto pl-2 text-xs text-muted-foreground tabular-nums">
            {option.count}
          </span>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

/** Поиск, исполнитель, объект, сортировка. Списки показываются, только если есть из чего выбирать. */
export const TaskFilterBar = ({
  filters,
  onChange,
  onReset,
  assignees,
  objects,
  shown,
  total,
}: Props) => {
  const filtered = isFiltered(filters);
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
        <div className="relative col-span-2 md:w-72">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
          <Input
            type="search"
            aria-label="Поиск по задачам"
            placeholder="Название или номер"
            className="h-10 pl-9 text-base md:text-sm"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </div>
        {assignees.length > 1 && (
          <OptionSelect
            label="Исполнитель"
            allLabel="Все исполнители"
            value={filters.assigneeId}
            options={assignees}
            onChange={(assigneeId) => onChange({ assigneeId })}
          />
        )}
        {objects.length > 1 && (
          <OptionSelect
            label="Объект"
            allLabel="Все объекты"
            value={filters.objectId}
            options={objects}
            onChange={(objectId) => onChange({ objectId })}
          />
        )}
        <Select value={filters.sort} onValueChange={(sort) => onChange({ sort: sort as TaskSort })}>
          <SelectTrigger aria-label="Сортировка" className="col-span-2 h-10 w-full min-w-0 md:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABEL) as TaskSort[]).map((sort) => (
              <SelectItem key={sort} value={sort} className="min-h-10">
                {SORT_LABEL[sort]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtered && (
          <Button variant="ghost" className="h-10 justify-self-start" onClick={onReset}>
            <XIcon className="size-4" strokeWidth={1.75} />
            Сбросить
          </Button>
        )}
      </div>
      {filtered && (
        <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
          Показано {shown} из {pluralCount(total, ['задачи', 'задач', 'задач'])}
        </p>
      )}
    </div>
  );
};
