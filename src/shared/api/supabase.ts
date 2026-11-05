import { createClient } from '@supabase/supabase-js';
import { env } from '@/shared/config';
import type { Database } from './database.types';

/**
 * Единственный клиент Supabase. Работает только с публичным (publishable) ключом:
 * все права проверяются в базе через RLS и функции.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
