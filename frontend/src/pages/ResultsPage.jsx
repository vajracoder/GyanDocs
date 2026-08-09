import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchQuestions } from '../services/api.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import SearchBar from '../components/ui/SearchBar.jsx'
import QuestionCard from '../components/cards/QuestionCard.jsx'
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
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState([])
  const [searchInput, setSearchInput] = useState(query)

  useEffect(() => { setSearchInput(query) }, [query])

  useEffect(() => {
    let cancelled = false
    setPage(1)
    setLoading(true)
    searchQuestions(query)
      .then((response) => !cancelled && setResults(response.data || []))
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [query])

  const { pageItems, totalPages, page: safePage } = paginate(results, page, PER_PAGE)
  const heading = query ? `Results for "${query}"` : 'Search results'

  return (
    <div className="container" style={{ paddingBlock: 'var(--sp-10)' }}>
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Search', to: '/search' }, { label: query ? `"${query}"` : 'Results' }]} />
      <div style={{ marginTop: 'var(--sp-5)', marginBottom: 'var(--sp-6)' }}>
        <h1 style={{ fontSize: 'var(--fs-2xl)', marginBottom: 'var(--sp-2)' }}>{heading}</h1>
        {!loading && <p className="mono text-muted" style={{ fontSize: 'var(--fs-sm)' }}>{results.length} {results.length === 1 ? 'question' : 'questions'} found</p>}
      </div>
      <div style={{ marginBottom: 'var(--sp-8)', maxWidth: 640 }}><SearchBar value={searchInput} onChange={setSearchInput} onSubmit={(term) => setSearchParams({ q: term })} size="md" /></div>
      {loading ? <LoadingSkeleton variant="list" count={4} /> : results.length === 0 ? (
        <EmptyState title="No questions found" description={`Nothing matched "${query}". Try "Deadlock", "Binary Tree" or "Unit 3".`} actionLabel="Back to Search" actionTo="/search" />
      ) : (
        <><div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>{pageItems.map((question) => <QuestionCard key={question._id} question={question} />)}</div><Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} /></>
      )}
    </div>
  )
}
