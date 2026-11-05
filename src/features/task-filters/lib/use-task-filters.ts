import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { EMPTY_FILTERS, type TaskFilters, type TaskSort } from '@/entities/task';

const SORTS: TaskSort[] = ['updated', 'number', 'created'];

/** Фильтры живут в адресе страницы: переживают перезагрузку, ими можно поделиться ссылкой. */
export const useTaskFilters = (): [
  TaskFilters,
  (next: Partial<TaskFilters>) => void,
  () => void,
] => {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<TaskFilters>(() => {
    const sort = params.get('sort') as TaskSort | null;
    return {
      q: params.get('q') ?? '',
      assigneeId: params.get('assignee'),
      objectId: params.get('object'),
      sort: sort && SORTS.includes(sort) ? sort : EMPTY_FILTERS.sort,
    };
  }, [params]);

  const update = useCallback(
    (next: Partial<TaskFilters>) => {
      setParams(
        (prev) => {
          const result = new URLSearchParams(prev);
          const set = (key: string, value: string | null | undefined) => {
            if (value) result.set(key, value);
            else result.delete(key);
          };
          if ('q' in next) set('q', next.q);
          if ('assigneeId' in next) set('assignee', next.assigneeId);
          if ('objectId' in next) set('object', next.objectId);
          if ('sort' in next) set('sort', next.sort === EMPTY_FILTERS.sort ? null : next.sort);
          return result;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const reset = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true });
  }, [setParams]);

  return [filters, update, reset];
};
