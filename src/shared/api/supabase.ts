import { createClient } from '@supabase/supabase-js';
import { env } from '@/shared/config';

/**
 * Единственный клиент Supabase. Работает только с публичным (publishable) ключом:
 * все права проверяются в базе через RLS.
 */
export const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
