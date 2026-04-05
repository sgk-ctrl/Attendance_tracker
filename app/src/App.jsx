import { createHashRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/layout/Layout';
import BandSelector from './pages/BandSelector';
import BandHome from './pages/BandHome';
import AttendanceFlow from './pages/AttendanceFlow';
import EventAttendance from './pages/EventAttendance';
import Dashboard from './pages/Dashboard';

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <BandSelector /> },
      { path: '/band/:bandId', element: <BandHome /> },
      { path: '/band/:bandId/attendance', element: <AttendanceFlow /> },
      { path: '/band/:bandId/events/:eventId', element: <EventAttendance /> },
      { path: '/dashboard', element: <Dashboard /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
