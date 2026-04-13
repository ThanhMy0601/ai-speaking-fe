import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-layout">
      <nav className="app-nav" role="navigation" aria-label="Main navigation">
        <Link to="/roadmap" className="nav-logo">🗣️ SpeakAI</Link>
        <div className="nav-links">
          <Link to="/roadmap">Roadmap</Link>
          <Link to="/sessions">History</Link>
          <Link to="/profile">Profile</Link>
        </div>
        {user && (
          <div className="nav-user">
            <span>⚡ {user.total_xp} XP</span>
            <span>🔥 {user.current_streak}</span>
            <button onClick={handleLogout} className="nav-logout">Logout</button>
          </div>
        )}
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
