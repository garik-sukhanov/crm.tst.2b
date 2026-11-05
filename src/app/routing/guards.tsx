import { useUnit } from 'effector-react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { $sessionStatus, $viewer } from '@/entities/viewer';
import { routes } from '@/shared/config';

const Splash = () => (
  <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
    <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-signal" />
    <span className="sr-only">Загрузка</span>
  </div>
);

/** Пускает только вошедших. Это удобство интерфейса — права всё равно проверяет база. */
export const RequireAuth = () => {
  const status = useUnit($sessionStatus);
  const location = useLocation();
  if (status === 'pending') return <Splash />;
  if (status === 'anonymous') {
    return <Navigate to={routes.login} replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
};

export const RedirectIfAuthenticated = () => {
  const status = useUnit($sessionStatus);
  const location = useLocation();
  if (status === 'pending') return <Splash />;
  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== routes.login ? from : routes.root} replace />;
  }
  return <Outlet />;
};

/** Стартовая страница по роли: исполнителю — его задачи, постановщику — объекты. */
export const HomeRedirect = () => {
  const viewer = useUnit($viewer);
  return <Navigate to={viewer?.role === 'executor' ? routes.tasks : routes.objects} replace />;
};
