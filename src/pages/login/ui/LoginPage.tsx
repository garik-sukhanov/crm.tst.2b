import { SignInForm } from '@/features/auth/sign-in';
import { ThemeSwitch } from '@/features/theme-switch';

export const LoginPage = () => (
  <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
    <header className="flex h-14 items-center justify-end px-4">
      <ThemeSwitch />
    </header>
    <main className="flex flex-1 items-start justify-center px-4 pt-[8vh] pb-16">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-4">
          <svg viewBox="0 0 32 32" className="size-10" aria-hidden>
            <rect width="32" height="32" rx="7" className="fill-foreground" />
            <path
              d="M7 24h18M10 24V13l6-5 6 5v11M14 24v-6h4v6"
              fill="none"
              className="stroke-signal"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium">Вход</h1>
            <p className="text-sm text-muted-foreground">
              Задачи по объектам. Учётную запись выдаёт руководитель.
            </p>
          </div>
        </div>
        <SignInForm />
      </div>
    </main>
  </div>
);
