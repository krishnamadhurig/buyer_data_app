import { NavLink, Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';

export default function DashboardLayout() {
  return (
    <>
      <Navbar variant="wide" />
      <div className="container wide">
        <nav className="tabs" aria-label="Dashboard">
          <NavLink to="/dashboard/upload">Upload</NavLink>
          <NavLink to="/dashboard/buyers">View buyers</NavLink>
        </nav>
        <Outlet />
      </div>
    </>
  );
}