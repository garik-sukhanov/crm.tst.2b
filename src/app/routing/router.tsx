import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { LoginPage } from '@/pages/login';
import { routes } from '@/shared/config';
import { AppShell } from '@/widgets/app-shell';
import { HomeRedirect, RedirectIfAuthenticated, RequireAuth } from './guards';

// Страницы грузятся по требованию: вход открывается быстро даже на слабом мобильном интернете.
const ObjectsPage = lazy(() => import('@/pages/objects').then((m) => ({ default: m.ObjectsPage })));
const ObjectBoardPage = lazy(() =>
  import('@/pages/object-board').then((m) => ({ default: m.ObjectBoardPage })),
);
const TaskPage = lazy(() => import('@/pages/task').then((m) => ({ default: m.TaskPage })));
const TasksPage = lazy(() => import('@/pages/tasks').then((m) => ({ default: m.TasksPage })));
const StatisticsPage = lazy(() =>
  import('@/pages/statistics').then((m) => ({ default: m.StatisticsPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/not-found').then((m) => ({ default: m.NotFoundPage })),
);

const page = (Page: React.ComponentType) => (
  <Suspense fallback={null}>
    <Page />
  </Suspense>
);

const router = createBrowserRouter([
  {
    element: <RedirectIfAuthenticated />,
    children: [{ path: routes.login, element: <LoginPage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: routes.root, element: <HomeRedirect /> },
          { path: routes.objects, element: page(ObjectsPage) },
          { path: '/objects/:objectId', element: page(ObjectBoardPage) },
          { path: '/tasks/:taskId', element: page(TaskPage) },
          { path: routes.tasks, element: page(TasksPage) },
          // Старый адрес «Моих задач» — на общую доску задач.
          { path: '/my-tasks', element: <Navigate to={routes.tasks} replace /> },
          { path: routes.statistics, element: page(StatisticsPage) },
          { path: '*', element: page(NotFoundPage) },
        ],
      },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
