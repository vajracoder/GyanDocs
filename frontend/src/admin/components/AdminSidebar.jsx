import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AdminSidebar.css";

export default function AdminSidebar({ open, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/admin/login");
  }

  return (
    <aside className={open ? "sidebar sidebar--open" : "sidebar"}>
      <div className="sidebar-logo">
        GyanDocs
      </div>

      <nav>

        <NavLink to="/admin/dashboard" onClick={onClose}>
          🏠 Dashboard
        </NavLink>

        <NavLink to="/admin/academic-manager" onClick={onClose}>
          📚 Academic Manager
        </NavLink>

        <NavLink to="/admin/pdf-import" onClick={onClose}>
          📄 PDF Import
        </NavLink>

      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>

    </aside>
  );
}