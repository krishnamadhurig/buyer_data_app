import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';

export default function AuthLayout() {
  return (
    <div className="stage navy">
      <Navbar variant="navy" />
      <Outlet />
    </div>
  );
}