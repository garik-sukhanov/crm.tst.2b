import { createBrowserRouter, RouterProvider } from 'react-router';
import { HomePage } from '@/pages/home';

const router = createBrowserRouter([{ path: '/', element: <HomePage /> }]);

export const AppRouter = () => <RouterProvider router={router} />;
