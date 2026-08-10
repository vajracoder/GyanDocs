import { Link } from 'react-router-dom'
import SearchBar from '../components/ui/SearchBar.jsx'
import './LandingPage.css'

const SEARCH_SUGGESTIONS = ['Deadlock', 'Binary Tree', 'Unit 3', 'CPU Scheduling']

const FEATURES = [
  {
    title: 'Previous Year Papers',
    description: 'Every past question, organized by university, course, branch, semester and subject.',
    to: '/subjects',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Smart Search',
    description: 'Type a keyword or unit — GyanDoc ranks results by relevance instantly.',
    to: '/search',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
        <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Advanced Filters',
    description: 'Narrow down by subject, unit or year to find exactly what you need.',
    to: '/search',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'One-Click PDF Download',
    description: 'Open or download any question paper instantly — no sign-up required.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 4v11m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 19h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Fast Access',
    description: 'No clutter, no waiting — from search to answer sheet in seconds.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function LandingPage() {
  return (
    <div className="ev-home">
      {/* ---------------- HERO ---------------- */}
      <section className="ev-home-hero">
        <div className="container ev-home-hero__inner">
          <span className="eyebrow">GyanDoc</span>
          <h1 className="ev-home-hero__title">
            Find the question paper<br />you're looking for.
          </h1>
          <p className="ev-home-hero__subtitle">
            Search previous year papers by university, course, branch, semester, subject or year.
          </p>

          <div className="ev-home-hero__search">
            <SearchBar
              size="lg"
              placeholder="Search by University, Course, Branch, Semester, Subject or Year..."
              suggestions={SEARCH_SUGGESTIONS}
            />
          </div>
        </div>
      </section>

      {/* ---------------- CORE FEATURES ---------------- */}
      <section className="ev-home-features">
        <div className="container">
          <div className="ev-home-features__grid">
            {FEATURES.map((f) => (
              f.to ? (
                <Link to={f.to} className="ev-home-feature" key={f.title}>
                  <span className="ev-home-feature__icon" aria-hidden="true">{f.icon}</span>
                  <h3>{f.title}</h3>
                  <p>{f.description}</p>
                </Link>
              ) : (
                <div className="ev-home-feature" key={f.title}>
                  <span className="ev-home-feature__icon" aria-hidden="true">{f.icon}</span>
                  <h3>{f.title}</h3>
                  <p>{f.description}</p>
                </div>
              )
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
