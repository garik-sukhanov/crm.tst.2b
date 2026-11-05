import type { Session } from '@supabase/supabase-js';
import { type AppRole, supabase, unwrap } from '@/shared/api';

export type Viewer = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
};

export const fetchViewer = async (session: Session): Promise<Viewer> => {
  const profile = unwrap(
    await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', session.user.id)
      .single(),
  );
  return {
    id: profile.id,
    email: session.user.email ?? '',
    fullName: profile.full_name,
    role: profile.role,
  };
};

/** Подписка на изменения сессии. Вызов колбэка откладываем: внутри обработчика
 * supabase-js нельзя сразу обращаться к самому клиенту (возможна взаимоблокировка). */
export const subscribeToSession = (listener: (session: Session | null) => void) =>
  supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => listener(session), 0);
  }).data.subscription;

export const signInWithPassword = async (params: { email: string; password: string }) => {
  const { error } = await supabase.auth.signInWithPassword(params);
  if (error) throw error;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
