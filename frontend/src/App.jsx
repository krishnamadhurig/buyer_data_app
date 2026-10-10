import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards.jsx';
import AuthLayout from './components/AuthLayout.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import Upload from './pages/Upload.jsx';
import Buyers from './pages/Buyers.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<SignIn />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="upload" replace />} />
          <Route path="upload" element={<Upload />} />
          <Route path="buyers" element={<Buyers />} />
        </Route>
      </Route>

      <Route path="*" element={<p className="container">Page not found</p>} />
    </Routes>
  );
}