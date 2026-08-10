import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import subjectsFallback from '../data/subjects.json'
import { getSubjects, getUnits } from '../services/api.js'
import SearchBar from '../components/ui/SearchBar.jsx'
import './SearchPage.css'

const TRENDING = ['Deadlock', 'Binary Tree', 'CPU Scheduling', 'Unit 3', 'Normalization', 'OSI Model']

const PRIORITIES = [5, 4, 3, 2, 1]
const QUESTION_TYPES = ['Theory', 'Numerical', 'MCQ']
const YEARS = [2025, 2024, 2023, 2022, 2021, 2020]

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const urlQuery = searchParams.get('q') || ''
  const urlSubjectId = searchParams.get('subjectId') || ''
  const urlUnitId = searchParams.get('unitId') || ''
  const urlYear = searchParams.get('year') || ''
  const urlPriority = searchParams.get('priority') || ''
  const urlQuestionType = searchParams.get('questionType') || ''

  const [query, setQuery] = useState(urlQuery)
  const [subjects, setSubjects] = useState(subjectsFallback)

  // Advanced Filters state
  const [subjectId, setSubjectId] = useState(urlSubjectId)
  const [units, setUnits] = useState([])
  const [unitId, setUnitId] = useState(urlUnitId)
  const [year, setYear] = useState(urlYear)
  const [priority, setPriority] = useState(urlPriority)
  const [questionType, setQuestionType] = useState(urlQuestionType)

  useEffect(() => {
    getSubjects().then(setSubjects).catch(() => setSubjects(subjectsFallback))
  }, [])

  // When a subjectId is present in the URL, load its units and restore the unitId
  useEffect(() => {
    if (!urlSubjectId) {
      setUnits([])
      setUnitId('')
      return
    }

    let cancelled = false
    getUnits(urlSubjectId)
      .then((response) => {
        if (cancelled) return
        const loadedUnits = response.data || []
        setUnits(loadedUnits)

        // Restore unitId only if it belongs to the selected subject
        const unitExists = loadedUnits.some((u) => (u._id || u.id) === urlUnitId)
        setUnitId(unitExists ? urlUnitId : '')
      })
      .catch(() => {
        if (cancelled) return
        setUnits([])
        setUnitId('')
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSubjectId, urlUnitId])

  function handleSubmit(term) {
    navigate(`/results?q=${encodeURIComponent(term)}`)
  }

  function handleSubjectChange(e) {
    const value = e.target.value
    setSubjectId(value)
    setUnitId('')
    setUnits([])

    if (!value) return

    getUnits(value)
      .then((response) => setUnits(response.data || []))
      .catch(() => setUnits([]))
  }

  function handleApplyFilters() {
    const params = new URLSearchParams()

    if (query.trim()) params.set('q', query.trim())
    if (subjectId) params.set('subjectId', subjectId)
    if (unitId) params.set('unitId', unitId)
    if (year) params.set('year', year)
    if (priority) params.set('priority', priority)
    if (questionType) params.set('questionType', questionType)

    const qs = params.toString()
    navigate(qs ? `/results?${qs}` : '/results')
  }

  function handleResetFilters() {
    setQuery('')
    setSubjectId('')
    setUnits([])
    setUnitId('')
    setYear('')
    setPriority('')
    setQuestionType('')
    navigate('/search')
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

        {/* Advanced Filters */}
        <div className="ev-search-page__filters">
          <span className="ev-search-page__trending-label mono">Advanced Filters</span>

          <div className="ev-search-page__filters-grid">
            <label className="ev-search-page__filter-field">
              <span>Subject</span>
              <select value={subjectId} onChange={handleSubjectChange}>
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                ))}
              </select>
            </label>

            <label className="ev-search-page__filter-field">
              <span>Unit</span>
              <select value={unitId} onChange={(e) => setUnitId(e.target.value)} disabled={!subjectId}>
                <option value="">All Units</option>
                {units.map((u) => (
                  <option key={u._id || u.id} value={u._id || u.id}>Unit {u.unitNumber} — {u.name}</option>
                ))}
              </select>
            </label>

            <label className="ev-search-page__filter-field">
              <span>Year</span>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">All Years</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>

            <label className="ev-search-page__filter-field">
              <span>Priority</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="">All Priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{'★'.repeat(p)}{'☆'.repeat(5 - p)}</option>
                ))}
              </select>
            </label>

            <label className="ev-search-page__filter-field">
              <span>Question Type</span>
              <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
                <option value="">All Types</option>
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t.toLowerCase()}>{t}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="ev-search-page__filters-actions">
            <button className="ev-search-page__filter-btn" onClick={handleApplyFilters}>Apply Filters</button>
            <button className="ev-search-page__filter-btn ev-search-page__filter-btn--ghost" onClick={handleResetFilters}>Reset</button>
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