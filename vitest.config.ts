import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'happy-dom',
          setupFiles: ['./src/shared/lib/test/setup.ts'],
          // Клиент Supabase создаётся, но в unit-тестах в сеть не ходит.
          env: {
            VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
            VITE_SUPABASE_PUBLISHABLE_KEY: 'unit-test',
          },
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          // Тесты меняют общую базу — гоняем последовательно.
          fileParallelism: false,
          testTimeout: 20_000,
        },
      },
    ],
  },
});
