import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchQuestions, getQuestions } from '../services/api.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import SearchBar from '../components/ui/SearchBar.jsx'
import QuestionCard from '../components/cards/QuestionCard.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import Pagination from '../components/ui/Pagination.jsx'

const PER_PAGE = 8

function paginate(items, page, perPage) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * perPage
  return { pageItems: items.slice(start, start + perPage), totalPages, page: safePage }
}

export default function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const subjectId = searchParams.get('subjectId') || ''
  const unitId = searchParams.get('unitId') || ''
  const year = searchParams.get('year') || ''
  const priority = searchParams.get('priority') || ''
  const questionType = searchParams.get('questionType') || ''
  const pageParam = Number(searchParams.get('page'))
  const page = Number.isInteger(pageParam) && pageParam >= 1 ? pageParam : 1
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [results, setResults] = useState([])
  const [retryKey, setRetryKey] = useState(0)
  const [searchInput, setSearchInput] = useState(query)

  const hasFilters = Boolean(subjectId || unitId || year || priority || questionType)
  const hasSearchCriteria = Boolean(query) || hasFilters

  useEffect(() => { setSearchInput(query) }, [query])

  // Reset page to 1 only when the search/filter criteria actually change
  // (not on initial mount, so a refresh keeps the current page)
  const prevCriteria = useRef(`${query}|${subjectId}|${unitId}|${year}|${priority}|${questionType}`)

  useEffect(() => {
    const currentCriteria = `${query}|${subjectId}|${unitId}|${year}|${priority}|${questionType}`
    if (prevCriteria.current !== currentCriteria) {
      prevCriteria.current = currentCriteria
      if (page > 1) {
        const params = new URLSearchParams(searchParams)
        params.set('page', '1')
        setSearchParams(params, { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, subjectId, unitId, year, priority, questionType])

  function handlePageChange(nextPage) {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(nextPage))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Search from ResultsPage: preserve active filters, update only q, reset page to 1
  // (never replace the entire URL, so existing filters are kept)
  function handleSearch(term) {
    const params = new URLSearchParams(searchParams)
    const trimmed = term.trim()
    if (trimmed) params.set('q', trimmed)
    else params.delete('q')
    params.set('page', '1')
    setSearchParams(params)
  }

  useEffect(() => {
    let cancelled = false

    if (!hasSearchCriteria) {
      setResults([])
      setError(false)
      setLoading(false)
      return () => { cancelled = true }
    }

    setLoading(true)
    setError(false)

    const params = {}
    if (query) params.search = query
    if (subjectId) params.subjectId = subjectId
    if (unitId) params.unitId = unitId
    if (year) params.year = year
    if (priority) params.priority = priority
    if (questionType) params.questionType = questionType

    const request = hasFilters
      ? getQuestions(params)
      : searchQuestions(query)

    request
      .then((response) => {
        if (cancelled) return
        setError(false)
        setResults(response.data || [])
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setResults([])
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [query, subjectId, unitId, year, priority, questionType, hasFilters, hasSearchCriteria, retryKey])

  const { pageItems, totalPages, page: safePage } = paginate(results, page, PER_PAGE)
  const heading = query ? `Results for "${query}"` : 'Search results'

  return (
    <div className="container" style={{ paddingBlock: 'var(--sp-10)' }}>
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Search', to: '/search' }, { label: query ? `"${query}"` : 'Results' }]} />
      <div style={{ marginTop: 'var(--sp-5)', marginBottom: 'var(--sp-6)' }}>
        <h1 style={{ fontSize: 'var(--fs-2xl)', marginBottom: 'var(--sp-2)' }}>{heading}</h1>
        {!loading && hasSearchCriteria && <p className="mono text-muted" style={{ fontSize: 'var(--fs-sm)' }}>{results.length} {results.length === 1 ? 'question' : 'questions'} found</p>}
      </div>
      <div style={{ marginBottom: 'var(--sp-8)', maxWidth: 640 }}><SearchBar value={searchInput} onChange={setSearchInput} onSubmit={handleSearch} size="md" /></div>
      {loading ? <LoadingSkeleton variant="list" count={4} /> : !hasSearchCriteria ? (
        <EmptyState title="Start searching to find questions" description="Enter a keyword or choose at least one filter to browse questions." actionLabel="Back to Search" actionTo="/search" />
      ) : error ? (
        <div className="ev-empty">
          <div className="ev-empty__icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 8v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>
          <h3 className="ev-empty__title">Something went wrong</h3>
          <p className="ev-empty__desc">We couldn't load your results. Please try again.</p>
          <Button variant="secondary" size="sm" onClick={() => setRetryKey((prev) => prev + 1)}>Retry</Button>
        </div>
      ) : results.length === 0 ? (
        <EmptyState title="No questions found" description={query ? `Nothing matched "${query}". Try "Deadlock", "Binary Tree" or "Unit 3".` : 'Nothing matched your selected filters.'} actionLabel="Back to Search" actionTo="/search" />
      ) : (
        <><div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>{pageItems.map((question) => <QuestionCard key={question._id} question={question} />)}</div><Pagination currentPage={safePage} totalPages={totalPages} onPageChange={handlePageChange} /></>
      )}
    </div>
  )
}
