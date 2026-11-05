import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { MyTasksPage } from '@/pages/my-tasks';
import { ObjectsPage } from '@/pages/objects';
import { routes } from '@/shared/config';
import { AppShell } from '@/widgets/app-shell';

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: routes.root, element: <Navigate to={routes.objects} replace /> },
      { path: routes.objects, element: <ObjectsPage /> },
      { path: routes.myTasks, element: <MyTasksPage /> },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
