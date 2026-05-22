import { createBrowserRouter } from 'react-router-dom';
import { requireAuth } from 'framework-react-core/routes';
import Home from './pages/Home';
import AuthCallback from './pages/AuthCallback';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    loader: requireAuth(),
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
]);

export default router;
