import { type Row, supabase, type TaskStatus, unwrap } from '@/shared/api';

export type ConstructionObject = {
  id: string;
  name: string;
  address: string;
  createdAt: string;
};

export type StatusCounts = Record<TaskStatus, number>;

export type ObjectSummary = ConstructionObject & {
  counts: StatusCounts;
  total: number;
};

export type ObjectInput = { name: string; address: string };

const emptyCounts = (): StatusCounts => ({
  new: 0,
  in_progress: 0,
  review: 0,
  rework: 0,
  done: 0,
});

const toObject = (row: Pick<Row<'objects'>, 'id' | 'name' | 'address' | 'created_at'>) => ({
  id: row.id,
  name: row.name,
  address: row.address,
  createdAt: row.created_at,
});

/** Объекты со счётчиками задач. Исполнитель через RLS получит только свои объекты и свои задачи. */
export const fetchObjects = async (): Promise<ObjectSummary[]> => {
  const rows = unwrap(
    await supabase
      .from('objects')
      .select('id, name, address, created_at, tasks(status)')
      .order('created_at', { ascending: false }),
  );
  return rows.map((row) => {
    const counts = emptyCounts();
    for (const task of row.tasks) counts[task.status] += 1;
    return { ...toObject(row), counts, total: row.tasks.length };
  });
};

export const fetchObject = async (id: string): Promise<ConstructionObject> =>
  toObject(
    unwrap(
      await supabase.from('objects').select('id, name, address, created_at').eq('id', id).single(),
    ),
  );

export const createObject = async (input: ObjectInput): Promise<ConstructionObject> =>
  toObject(
    unwrap(
      await supabase
        .from('objects')
        .insert({ name: input.name.trim(), address: input.address.trim() })
        .select('id, name, address, created_at')
        .single(),
    ),
  );

export const updateObject = async ({
  id,
  ...input
}: ObjectInput & { id: string }): Promise<ConstructionObject> =>
  toObject(
    unwrap(
      await supabase
        .from('objects')
        .update({ name: input.name.trim(), address: input.address.trim() })
        .eq('id', id)
        .select('id, name, address, created_at')
        .single(),
    ),
  );

export const deleteObject = async (id: string): Promise<void> => {
  const rows = unwrap(await supabase.from('objects').delete().eq('id', id).select('id'));
  if (rows.length === 0) throw Object.assign(new Error('not deleted'), { code: '42501' });
};
