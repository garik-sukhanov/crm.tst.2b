const read = (key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_PUBLISHABLE_KEY'): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Не задана переменная окружения ${key}. Скопируйте .env.example в .env.local.`);
  }
  return value;
};

export const env = {
  supabaseUrl: read('VITE_SUPABASE_URL'),
  supabasePublishableKey: read('VITE_SUPABASE_PUBLISHABLE_KEY'),
} as const;
