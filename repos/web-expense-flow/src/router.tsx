import { createBrowserRouter } from 'react-router-dom';
import { requireAuth } from 'framework-react-core/routes';
import AuthCallback from './pages/AuthCallback';
import MyExpenses from './pages/MyExpenses/MyExpenses';
import NewReport from './pages/NewReport/NewReport';
import ReportDetail from './pages/ReportDetail/ReportDetail';
import ApprovalQueue from './pages/ApprovalQueue/ApprovalQueue';
import ApprovalDetail from './pages/ApprovalDetail/ApprovalDetail';
import FinanceDashboard from './pages/FinanceDashboard/FinanceDashboard';
import Policies from './pages/Policies/Policies';
import Users from './pages/Users/Users';

const router = createBrowserRouter([
  {
    path: '/expenses',
    element: <MyExpenses />,
    loader: requireAuth(),
  },
  {
    path: '/expenses/new',
    element: <NewReport />,
    loader: requireAuth(),
  },
  {
    path: '/expenses/:id',
    element: <ReportDetail />,
    loader: requireAuth(),
  },
  {
    path: '/approvals',
    element: <ApprovalQueue />,
    loader: requireAuth(),
  },
  {
    path: '/approvals/:id',
    element: <ApprovalDetail />,
    loader: requireAuth(),
  },
  {
    path: '/finance',
    element: <FinanceDashboard />,
    loader: requireAuth(),
  },
  {
    path: '/admin/policies',
    element: <Policies />,
    loader: requireAuth(),
  },
  {
    path: '/admin/users',
    element: <Users />,
    loader: requireAuth(),
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
]);

export default router;
