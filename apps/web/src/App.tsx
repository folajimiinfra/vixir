import { createBrowserRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screens } from './routes/screens';
import { Landing } from './routes/Landing';
import { Auth } from './routes/Auth';
import { Placeholder } from './routes/Placeholder';
import { LabWorkspace } from './routes/LabWorkspace';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

export const routes = [
  { path: '/', element: <Landing /> },
  { path: '/auth', element: <Auth /> },
  { path: '/app/x/:experimentId/lab', element: <LabWorkspace /> },
  ...screens.filter((s) => s.code !== 'A1' && s.code !== 'A2' && s.code !== 'D1').map((s) => ({ path: s.path, element: <Placeholder screen={s} /> })),
  { path: '*', element: <Placeholder screen={{ code: '404', title: 'Page not found', path: '*', area: 'public' }} /> },
];

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={createBrowserRouter(routes)} />
    </QueryClientProvider>
  );
}
