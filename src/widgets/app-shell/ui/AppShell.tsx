import { NavLink, Outlet } from 'react-router';
import { ThemeSwitch } from '@/features/theme-switch';
import { routes } from '@/shared/config';
import { cn } from '@/shared/lib/utils';
import { NAV_ITEMS } from '../config/nav';

const Logo = () => (
  <NavLink
    to={routes.objects}
    className="flex items-center gap-2 rounded-md text-base font-semibold"
  >
    <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
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
    Стройки
  </NavLink>
);

/** Каркас: шапка сверху; на десктопе навигация в шапке, на телефоне — нижняя панель. */
export const AppShell = () => (
  <div className="flex min-h-dvh flex-col">
    <header className="sticky top-0 z-30 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 md:px-6">
        <Logo />
        <nav aria-label="Основная навигация" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground',
                  isActive && 'bg-accent text-foreground',
                )
              }
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemeSwitch />
        </div>
      </div>
    </header>

    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-6 md:pb-10">
      <Outlet />
    </main>

    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors duration-150',
                  isActive &&
                    'text-foreground after:absolute after:top-0 after:h-0.5 after:w-10 after:rounded-full after:bg-signal',
                )
              }
            >
              <Icon className="size-5" strokeWidth={1.75} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  </div>
);
