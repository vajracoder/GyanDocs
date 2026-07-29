import { NavLink } from "react-router-dom";
import "./AdminSidebar.css";

export default function AdminSidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        GyanDoc
      </div>

      <nav>
        <NavLink to="/admin/dashboard">
          Dashboard
        </NavLink>

        <NavLink to="/admin/subjects">
          Subjects
        </NavLink>

        <NavLink to="/admin/units">
          Units
        </NavLink>

        <NavLink to="/admin/topics">
          Topics
        </NavLink>

        <NavLink to="/admin/questions">
          Questions
        </NavLink>
      </nav>
    </aside>
  );
}