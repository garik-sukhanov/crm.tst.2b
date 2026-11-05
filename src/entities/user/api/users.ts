import { type AppRole, supabase, unwrap } from '@/shared/api';

export type UserRef = { id: string; fullName: string };
export type User = UserRef & { role: AppRole };

export const fetchExecutors = async (): Promise<User[]> => {
  const rows = unwrap(
    await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'executor')
      .order('full_name'),
  );
  return rows.map((r) => ({ id: r.id, fullName: r.full_name, role: r.role }));
};

export const ROLE_LABEL: Record<AppRole, string> = {
  manager: 'Постановщик',
  executor: 'Исполнитель',
};
