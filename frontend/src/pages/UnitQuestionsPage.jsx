import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getQuestions, getSubjects, getUnits } from '../services/api.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import QuestionFilters from '../components/QuestionFilters.jsx'
import QuestionCard from '../components/cards/QuestionCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import './UnitQuestionsPage.css'

const INITIAL_FILTERS = { search: '', priority: 'all', year: 'all', questionType: 'all' }

function latestYear(question) {
  return Math.max(...(question.years || []), 0)
}

function sortQuestions(questions) {
  return [...questions].sort((a, b) => {
    const priorityDifference = (b.priority || 0) - (a.priority || 0)
    if (priorityDifference) return priorityDifference

    const frequencyDifference = (b.years?.length || 0) - (a.years?.length || 0)
    if (frequencyDifference) return frequencyDifference

    return latestYear(b) - latestYear(a)
  })
}

export default function UnitQuestionsPage() {
  const { subjectSlug, unitSlug } = useParams()
  const [subject, setSubject] = useState(null)
  const [unit, setUnit] = useState(null)
  const [questions, setQuestions] = useState([])
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadUnitQuestions() {
      setLoading(true)
      setError(false)
      setFilters(INITIAL_FILTERS)

      try {
        const subjects = await getSubjects()
        const selectedSubject = subjects.find((item) => item.slug === subjectSlug)
        if (!selectedSubject) throw new Error('Subject not found')

        const unitsResponse = await getUnits(selectedSubject._id || selectedSubject.id)
        const selectedUnit = (unitsResponse.data || []).find((item) => item.slug === unitSlug)
        if (!selectedUnit) throw new Error('Unit not found')

        const questionsResponse = await getQuestions({ unitId: selectedUnit._id || selectedUnit.id })
        if (cancelled) return

        setSubject(selectedSubject)
        setUnit(selectedUnit)
        setQuestions(questionsResponse.data || [])
      } catch (_) {
        if (!cancelled) {
          setSubject(null)
          setUnit(null)
          setQuestions([])
          setError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUnitQuestions()
    return () => { cancelled = true }
  }, [subjectSlug, unitSlug])

  const availableYears = useMemo(() => Array.from(new Set(questions.flatMap((question) => question.years || []))).sort((a, b) => b - a), [questions])
  const filteredQuestions = useMemo(() => sortQuestions(questions.filter((question) => {
    if (filters.search && !question.questionText?.toLowerCase().includes(filters.search.trim().toLowerCase())) return false
    if (filters.priority !== 'all' && question.priority !== Number(filters.priority)) return false
    if (filters.year !== 'all' && !question.years?.includes(Number(filters.year))) return false
    if (filters.questionType !== 'all' && question.questionType !== filters.questionType) return false
    return true
  })), [questions, filters])
  const hasFilters = filters.search.trim() || filters.priority !== 'all' || filters.year !== 'all' || filters.questionType !== 'all'

  if (loading) return <div className="container ev-unit-questions-page"><LoadingSkeleton variant="list" count={4} /></div>
  if (error) return <div className="container ev-unit-questions-page"><EmptyState title="Unable to load questions" description="Please try again." actionLabel="Back to Subjects" actionTo="/subjects" /></div>

  return (
    <div className="container ev-unit-questions-page">
      <Breadcrumb items={[
        { label: 'Home', to: '/' },
        { label: 'Subjects', to: '/subjects' },
        { label: subject.name, to: `/subjects/${subjectSlug}` },
        { label: `Unit ${unit.unitNumber} — ${unit.name}` },
      ]} />
      <div className="ev-unit-questions-page__head">
        <span className="eyebrow">{subject.name}</span>
        <h1>Unit {unit.unitNumber} — {unit.name}</h1>
        {unit.description && <p className="text-muted">{unit.description}</p>}
      </div>
      <div className="ev-unit-questions-page__meta mono"><span>{hasFilters ? `Showing ${filteredQuestions.length} of ${questions.length} questions` : `${questions.length} Questions`}</span></div>
      <QuestionFilters filters={filters} years={availableYears} onChange={setFilters} onReset={() => setFilters(INITIAL_FILTERS)} />

      {questions.length === 0 ? (
        <EmptyState title="No questions found for this unit." description="Questions will appear here after they are added to the question bank." />
      ) : filteredQuestions.length === 0 ? (
        <EmptyState title="No questions match your filters." description="Try changing your search or filters." />
      ) : (
        <div className="ev-unit-questions-page__list">{filteredQuestions.map((question) => <QuestionCard key={question._id} question={question} />)}</div>
      )}
    </div>
  )
}
