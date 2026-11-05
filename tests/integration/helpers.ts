import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/shared/api/database.types.ts';

// Локальный стек Supabase (pnpm db:start). Значения по умолчанию — стандартные демо-ключи CLI.
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const key =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

export const PASSWORD = 'Stroy-demo-2026';

export const USERS = {
  manager: { id: '11111111-1111-4111-8111-111111111111', email: 'manager@stroy.example' },
  kovalev: { id: '22222222-2222-4222-8222-222222222222', email: 'kovalev@stroy.example' },
  orlov: { id: '33333333-3333-4333-8333-333333333333', email: 'orlov@stroy.example' },
} as const;

export const OBJECTS = {
  severny: 'aaaaaaaa-0000-4000-8000-000000000001',
  sklad: 'aaaaaaaa-0000-4000-8000-000000000002',
  mitino: 'aaaaaaaa-0000-4000-8000-000000000003',
} as const;

export type Client = SupabaseClient<Database>;

export const anonClient = (): Client =>
  createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

export const signIn = async (user: keyof typeof USERS): Promise<Client> => {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({
    email: USERS[user].email,
    password: PASSWORD,
  });
  if (error) throw new Error(`Не удалось войти как ${user}: ${error.message}`);
  return client;
};
