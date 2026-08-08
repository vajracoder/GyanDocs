import { NavLink } from "react-router-dom";
import "./AdminSidebar.css";

export default function AdminSidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        GyanDocs
      </div>

      <nav>

        <NavLink to="/admin/dashboard">
          🏠 Dashboard
        </NavLink>

        <NavLink to="/admin/dashboard">
          📚 Academic Manager
        </NavLink>

        <NavLink to="/admin/pdf-import">
          📄 PDF Import
        </NavLink>

        <NavLink to="/admin/settings">
          ⚙ Settings
        </NavLink>

      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn">
          🚪 Logout
        </button>
      </div>

    </aside>
  );
}