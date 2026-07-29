import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Button from "../ui/Button.jsx";
import "./Navbar.css";

const NAV_LINKS = [
  { label: "Subjects", to: "/subjects" },
  { label: "Search", to: "/search" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="ev-navbar">
      <div className="container ev-navbar__inner">
        {/* Logo */}
        <Link
          to="/"
          className="ev-navbar__logo"
          onClick={() => setMenuOpen(false)}
        >
          <span className="ev-navbar__mark" aria-hidden="true">
            GD
          </span>

          <span className="ev-navbar__word">GyanDoc</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="ev-navbar__links" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `ev-navbar__link ${
                  isActive ? "ev-navbar__link--active" : ""
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="ev-navbar__actions">
          <Button to="/search" variant="secondary" size="sm">
            Search PYQs
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="ev-navbar__toggle"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="ev-navbar__mobile">
          <nav className="ev-navbar__mobile-links">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="ev-navbar__mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <Button
            to="/search"
            variant="primary"
            fullWidth
            onClick={() => setMenuOpen(false)}
          >
            Search PYQs
          </Button>
        </div>
      )}
    </header>
  );
}