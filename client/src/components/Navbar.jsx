import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const linkClass = ({ isActive }) => (isActive ? "active" : undefined);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Odin-Book
      </Link>
      <div className="navbar-links">
        <NavLink to="/" end className={linkClass}>
          Feed
        </NavLink>
        <NavLink to="/users" className={linkClass}>
          Users
        </NavLink>
        <NavLink to="/requests" className={linkClass}>
          Requests
        </NavLink>
        <NavLink to={`/users/${user.id}`} className={linkClass}>
          My Profile
        </NavLink>
        <button className="link-button" onClick={logout}>
          Log out
        </button>
      </div>
    </nav>
  );
}
