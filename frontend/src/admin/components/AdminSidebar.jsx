import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminSidebar.css";

/* ── Inline SVG icon components ── */
const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const IconUpload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconLogOut = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

function getInitials(email) {
  if (!email) return "A";
  const parts = email.split("@")[0].split(/[._-]/);
  return parts.map((p) => p[0]?.toUpperCase()).slice(0, 2).join("");
}

export default function AdminSidebar({ open, onClose }) {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/admin/login");
  }

  const email = currentUser?.email || "";
  const displayName = email.split("@")[0];

  return (
    <aside className={open ? "sidebar sidebar--open" : "sidebar"}>
      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-name">GyanDocs</span>
        <span className="sidebar-brand-badge">ADMIN</span>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {/* Overview group */}
        <div className="nav-group">
          <span className="nav-group-label">Overview</span>
          <NavLink to="/admin/dashboard" onClick={onClose} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <IconGrid />
            <span>Dashboard</span>
          </NavLink>
        </div>

        {/* Academic group */}
        <div className="nav-group">
          <span className="nav-group-label">Academic</span>
          <NavLink to="/admin/academic-manager" onClick={onClose} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <IconBook />
            <span>Academic Manager</span>
          </NavLink>
        </div>

        {/* Content group */}
        <div className="nav-group">
          <span className="nav-group-label">Content</span>
          <NavLink to="/admin/pdf-import" onClick={onClose} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <IconUpload />
            <span>PDF Import</span>
          </NavLink>
        </div>
      </nav>

      {/* ── User Profile + Logout ── */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar" aria-hidden="true">{getInitials(email)}</div>
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-email">{email}</span>
          </div>
        </div>
        <button
          className="logout-btn"
          onClick={handleLogout}
          aria-label="Logout from admin panel"
        >
          <IconLogOut />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}