import { createBrowserRouter, RouterProvider } from 'react-router';
import { LoginPage } from '@/pages/login';
import { MyTasksPage } from '@/pages/my-tasks';
import { NotFoundPage } from '@/pages/not-found';
import { ObjectBoardPage } from '@/pages/object-board';
import { ObjectsPage } from '@/pages/objects';
import { StatisticsPage } from '@/pages/statistics';
import { TaskPage } from '@/pages/task';
import { routes } from '@/shared/config';
import { AppShell } from '@/widgets/app-shell';
import { ExecutorOnly, HomeRedirect, RedirectIfAuthenticated, RequireAuth } from './guards';

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
          { path: routes.objects, element: <ObjectsPage /> },
          { path: '/objects/:objectId', element: <ObjectBoardPage /> },
          { path: '/tasks/:taskId', element: <TaskPage /> },
          {
            element: <ExecutorOnly />,
            children: [{ path: routes.myTasks, element: <MyTasksPage /> }],
          },
          { path: routes.statistics, element: <StatisticsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
