import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import subjectsFallback from '../data/subjects.json'
import { getSubjects } from '../services/api.js'
import SearchBar from '../components/ui/SearchBar.jsx'
import './SearchPage.css'

const TRENDING = ['Deadlock', 'Binary Tree', 'CPU Scheduling', 'Unit 3', 'Normalization', 'OSI Model']

export default function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [subjects, setSubjects] = useState(subjectsFallback)

  useEffect(() => {
    getSubjects().then(setSubjects).catch(() => setSubjects(subjectsFallback))
  }, [])

  function handleSubmit(term) {
    navigate(`/results?q=${encodeURIComponent(term)}`)
  }

  return (
    <div className="ev-search-page">
      <div className="container ev-search-page__inner">
        <span className="eyebrow">Search</span>
        <h1 className="ev-search-page__title">What are you studying for?</h1>
        <p className="ev-search-page__subtitle">
          Search by keyword or unit — e.g. "Deadlock", "Binary Tree" or "Unit 3".
        </p>

        <div className="ev-search-page__bar">
          <SearchBar value={query} onChange={setQuery} onSubmit={handleSubmit} autoFocus size="lg" />
        </div>

        <div className="ev-search-page__trending">
          <span className="ev-search-page__trending-label mono">Trending searches</span>
          <div className="ev-search-page__chips">
            {TRENDING.map((term) => (
              <button key={term} className="ev-search-page__chip" onClick={() => handleSubmit(term)}>
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="ev-search-page__subjects">
          <span className="ev-search-page__trending-label mono">Or browse by subject</span>
          <div className="ev-search-page__subject-grid">
            {subjects.map((s) => (
              <button
                key={s.id || s._id}
                className="ev-search-page__subject"
                onClick={() => navigate(`/subjects/${s.slug}`)}
              >
                <span className="ev-search-page__subject-code mono" style={{ color: s.accent }}>{s.code}</span>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
