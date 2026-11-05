# Стройки — задачи по объектам

Постановщик заводит объекты (стройки) и задачи, исполнитель берёт их в работу и сдаёт на проверку. У каждой задачи своя история смены статусов и переписка. Все правила доступа проверяет база данных, а не только интерфейс.

- Задание: [docs/TASK.md](docs/TASK.md)
- Как устроено и как защищены данные, без терминов: [docs/EXPLANATION.md](docs/EXPLANATION.md)
- Решения и допущения: [docs/DECISIONS.md](docs/DECISIONS.md)
- План и статус этапов: [docs/PLAN.md](docs/PLAN.md)

## Стек

React 19 + TypeScript, Vite, Effector + Farfetched, shadcn/ui + Tailwind CSS 4, dnd-kit, Feature-Sliced Design.
Supabase: Postgres, Auth, RLS, SQL-миграции. Biome, Steiger, Vitest, pgTAP, GitHub Actions.

## Тестовые пользователи

Пароль у всех: `Stroy-demo-2026`

| Почта                   | Роль                          |
| ----------------------- | ----------------------------- |
| `manager@stroy.example` | Постановщик — Ирина Соколова  |
| `kovalev@stroy.example` | Исполнитель — Алексей Ковалёв |
| `orlov@stroy.example`   | Исполнитель — Дмитрий Орлов   |

В базе 3 объекта и 8 задач во всех статусах, с историей и перепиской ([supabase/seed.sql](supabase/seed.sql)).

## Запуск локально

Нужны Node 22+, pnpm 10 и Docker.

```bash
pnpm install
```

```bash
pnpm db:start
```

```bash
pnpm dev:local
```

Откройте http://localhost:5180. `db:start` поднимает Supabase в Docker и применяет миграции и сид. `dev:local` запускает приложение против локальной базы. Адрес и публичный ключ лежат в `.env.localdb`: это стандартные демо-значения Supabase CLI, их можно сверить с `pnpm supabase status`.

Сбросить базу к исходным данным:

```bash
pnpm db:reset
```

## Облачный Supabase

```bash
pnpm supabase login
```

```bash
pnpm supabase link --project-ref <project-ref>
```

```bash
pnpm supabase db push --include-seed
```

```bash
pnpm supabase config push
```

Последняя команда переносит настройки авторизации из `supabase/config.toml`, в том числе выключенную регистрацию. Перед ней поменяйте `site_url` на адрес приложения. Можно и вручную: Authentication → Sign In / Providers → снять «Allow new users to sign up».

Фронтенду нужны только публичные значения: скопируйте [.env.example](.env.example) в `.env.local` и заполните. Секретный ключ (`service_role` / `sb_secret_…`) во фронтенд и в репозиторий не попадает.

## Деплой на Vercel

Подключите репозиторий и задайте переменные окружения `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`. Остальное — сборка, переходы для SPA, заголовки безопасности — описано в [vercel.json](vercel.json).

## Проверки

| Команда                 | Что проверяет                                                           |
| ----------------------- | ----------------------------------------------------------------------- |
| `pnpm verify`           | Biome, границы слоёв FSD (Steiger), TypeScript, unit-тесты              |
| `pnpm test`             | Unit-тесты: правила переходов, модели Effector, расчёт статистики       |
| `pnpm test:db`          | pgTAP: права прямо в базе — видимость, переходы, неизменяемость истории |
| `pnpm test:integration` | Те же правила через публичный API с настоящим входом по паролю          |

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) запускает всё это на каждый push. Для тестов базы поднимается Supabase в Docker.

## Где что лежит

```
supabase/
  migrations/      схема и правила безопасности
  seed.sql         тестовые данные
  tests/database/  pgTAP
src/
  app/             запуск, маршруты, стили и темы
  pages/           экраны: вход, объекты, доска, задача, мои задачи, статистика
  widgets/         каркас, доска задач, лента задачи
  features/        вход/выход, смена статуса, чат, редакторы объектов и задач, тема
  entities/        пользователь, объект, задача (API, правила переходов, карточки)
  shared/          клиент Supabase, UI-кит, утилиты
tests/integration/ проверки через API
```
