import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminTopbar.css";

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const PAGE_TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin": "Dashboard",
  "/admin/academic-manager": "Academic Manager",
  "/admin/pdf-import": "PDF Import",
  "/admin/subjects": "Subjects",
  "/admin/units": "Units",
  "/admin/questions": "Questions",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(email) {
  if (!email) return "A";
  const parts = email.split("@")[0].split(/[._-]/);
  return parts.map((p) => p[0]?.toUpperCase()).slice(0, 2).join("");
}

export default function AdminTopbar({ onToggle }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  const email = currentUser?.email || "";
  const displayName = email.split("@")[0];
  const pageTitle = PAGE_TITLES[location.pathname] ?? "Admin";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="menu-btn"
          onClick={onToggle}
          aria-label="Toggle admin navigation"
        >
          <IconMenu />
        </button>

        <div className="topbar-page-info">
          <h1 className="topbar-page-title">{pageTitle}</h1>
          <span className="topbar-greeting">
            {getGreeting()}, {displayName} 👋
          </span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-profile" title={email}>
          <div className="topbar-avatar" aria-hidden="true">
            {getInitials(email)}
          </div>
          <span className="topbar-admin-name">{displayName}</span>
        </div>
      </div>
    </header>
  );
}
