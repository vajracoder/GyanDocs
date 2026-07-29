import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import questionsFallback from '../data/questions.json'
import subjects from '../data/subjects.json'
import units from '../data/units.json'
import topics from '../data/topics.json'
import { searchQuestions as searchApi, getQuestionsByTopic } from '../services/api.js'
import { searchQuestions as searchLocal, questionsForTopic, paginate } from '../utils/search.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import SearchBar from '../components/ui/SearchBar.jsx'
import QuestionCard from '../components/cards/QuestionCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import Pagination from '../components/ui/Pagination.jsx'

const PER_PAGE = 8

export default function ResultsPage() {
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isScoped = Boolean(params.topicSlug)

  const query = searchParams.get('q') || ''
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState([])
  const [searchInput, setSearchInput] = useState(query)

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  useEffect(() => {
    let cancelled = false
    setPage(1)
    setLoading(true)

    const fetcher = isScoped
      ? getQuestionsByTopic(params.subjectSlug, params.unitSlug, params.topicSlug)
      : searchApi(query)

    fetcher
      .then((data) => !cancelled && setResults(data))
      .catch(() => {
        if (cancelled) return
        setResults(
          isScoped
            ? questionsForTopic(questionsFallback, params.subjectSlug, params.unitSlug, params.topicSlug)
            : searchLocal(questionsFallback, query)
        )
      })
      .finally(() => !cancelled && setLoading(false))

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScoped, query, params.subjectSlug, params.unitSlug, params.topicSlug])

  const { breadcrumbItems, heading } = useMemo(() => {
    if (isScoped) {
      const { subjectSlug, unitSlug, topicSlug } = params
      const first = results[0]
      const subjectName = first?.subjectName || subjects.find((s) => s.slug === subjectSlug)?.name || subjectSlug
      const unitNumber = first?.unitNumber ?? units.find((u) => u.subjectSlug === subjectSlug && u.slug === unitSlug)?.unitNumber
      const topicName = first?.topicName || topics.find((t) => t.subjectSlug === subjectSlug && t.unitSlug === unitSlug && t.slug === topicSlug)?.name || topicSlug

      return {
        heading: topicName || 'Questions',
        breadcrumbItems: [
          { label: 'Subjects', to: '/subjects' },
          { label: subjectName, to: `/subjects/${subjectSlug}` },
          { label: unitNumber ? `Unit ${unitNumber}` : unitSlug, to: `/subjects/${subjectSlug}/${unitSlug}` },
          { label: topicName },
        ],
      }
    }

    return {
      heading: query ? `Results for "${query}"` : 'Search results',
      breadcrumbItems: [
        { label: 'Search', to: '/search' },
        { label: query ? `"${query}"` : 'Results' },
      ],
    }
  }, [isScoped, params, query, results])

  const { pageItems, totalPages, page: safePage } = paginate(results, page, PER_PAGE)

  function handleSearchSubmit(term) {
    setSearchParams({ q: term })
  }

  return (
    <div className="container" style={{ paddingBlock: 'var(--sp-10)' }}>
      <Breadcrumb items={breadcrumbItems} />

      <div style={{ marginTop: 'var(--sp-5)', marginBottom: 'var(--sp-6)' }}>
        <h1 style={{ fontSize: 'var(--fs-2xl)', marginBottom: 'var(--sp-2)' }}>{heading}</h1>
        {!loading && (
          <p className="mono text-muted" style={{ fontSize: 'var(--fs-sm)' }}>
            {results.length} {results.length === 1 ? 'question' : 'questions'} found
          </p>
        )}
      </div>

      {!isScoped && (
        <div style={{ marginBottom: 'var(--sp-8)', maxWidth: 640 }}>
          <SearchBar value={searchInput} onChange={setSearchInput} onSubmit={handleSearchSubmit} size="md" />
        </div>
      )}

      {loading ? (
        <LoadingSkeleton variant="list" count={4} />
      ) : results.length === 0 ? (
        <EmptyState
          title="No questions found"
          description={
            isScoped
              ? "This topic doesn't have any indexed questions yet."
              : `Nothing matched "${query}". Try "Deadlock", "Binary Tree" or "Unit 3".`
          }
          actionLabel="Back to Search"
          actionTo="/search"
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {pageItems.map((q) => (
              <QuestionCard key={q.id || q._id} question={q} />
            ))}
          </div>
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
