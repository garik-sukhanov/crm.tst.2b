# CRM для строек — тестовое задание

- Требования: `docs/TASK.md`. План и статус этапов: `docs/PLAN.md`. Решения: `docs/DECISIONS.md` — дописывать туда каждое самостоятельное решение.
- Работаем по этапам; решения согласуем с пользователем до реализации. Этап завершён → коммит.
- Стек: Vite + React + TS, pnpm, Effector + Farfetched, shadcn/ui + Tailwind v4, FSD, Biome, Supabase.
- UI: mobile-first, темы light / dark / auto. Для дизайн-ревью экранов — скилл `unslop`.
- Безопасность — в базе (RLS, проверки переходов статусов в Postgres). Секретные ключи (service_role) никогда не попадают во фронтенд и в git.
