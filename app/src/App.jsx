import { createHashRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import BandSelector from './pages/BandSelector';
import BandHome from './pages/BandHome';
import AttendanceFlow from './pages/AttendanceFlow';
import EventAttendance from './pages/EventAttendance';
import Dashboard from './pages/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import Spinner from './components/layout/Spinner';

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner show text="Loading..." />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function PublicLogin() {
  return (
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
}

function ProtectedLayout() {
  return (
    <AuthProvider>
      <ProtectedRoute />
    </AuthProvider>
  );
}

const router = createHashRouter([
  {
    path: '/login',
    element: <PublicLogin />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <BandSelector /> },
          { path: '/band/:bandId', element: <BandHome /> },
          { path: '/band/:bandId/attendance', element: <AttendanceFlow /> },
          { path: '/band/:bandId/events/:eventId', element: <EventAttendance /> },
          { path: '/dashboard', element: <Dashboard /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
