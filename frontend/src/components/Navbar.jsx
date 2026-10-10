import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar({ variant }) {
  const { user, logout } = useAuth();

  return (
<header className={`topbar${variant ? ` ${variant}` : ''}`}>      <Link to="/" className="brand">
        <span className="brand-mark">B</span>Buyer Ledger
      </Link>
      <nav className="row">
        {user ? (
          <>
            <span>{user.name}</span>
            <button type="button" className="btn ghost" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/signin" className="btn ghost">Sign In</Link>
            <Link to="/signup" className="btn primary">Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  );
}