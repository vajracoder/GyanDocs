import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import subjectsFallback from '../data/subjects.json'
import unitsFallback from '../data/units.json'
import { getSubject, getUnits } from '../services/api.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import UnitCard from '../components/cards/UnitCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import './UnitPage.css'

export default function UnitPage() {
  const { subjectSlug } = useParams()
  const [subject, setSubject] = useState(null)
  const [subjectUnits, setSubjectUnits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getSubject(subjectSlug), getUnits(subjectSlug)])
      .then(([s, u]) => {
        if (cancelled) return
        setSubject(s)
        setSubjectUnits([...u].sort((a, b) => a.unitNumber - b.unitNumber))
      })
      .catch(() => {
        if (cancelled) return
        setSubject(subjectsFallback.find((s) => s.slug === subjectSlug) || null)
        setSubjectUnits(
          unitsFallback.filter((u) => u.subjectSlug === subjectSlug).sort((a, b) => a.unitNumber - b.unitNumber)
        )
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [subjectSlug])

  if (loading) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--sp-10)' }}>
        <LoadingSkeleton variant="list" count={5} />
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--sp-16)' }}>
        <EmptyState
          title="Subject not found"
          description="That subject doesn't exist in GyanDoc yet."
          actionLabel="Browse all subjects"
          actionTo="/subjects"
        />
      </div>
    )
  }

  return (
    <div className="container ev-unit-page">
      <Breadcrumb
        items={[
          { label: 'Subjects', to: '/subjects' },
          { label: subject.name },
        ]}
      />

      <div className="ev-unit-page__head">
        <div className="ev-unit-page__icon" style={{ background: `${subject.accent}14`, color: subject.accent }}>
          {subject.code}
        </div>
        <div>
          <h1>{subject.name}</h1>
          <p className="text-muted">{subject.description}</p>
        </div>
      </div>

      <div className="ev-unit-page__meta mono">
        <span>{subjectUnits.length} units</span>
        <span className="ev-unit-page__dot">&middot;</span>
        <span>{subject.questionsCount} questions indexed</span>
      </div>

      <div className="ev-unit-page__list">
        {subjectUnits.map((u) => (
          <UnitCard key={u.id} unit={u} />
        ))}
      </div>

      <Link to="/search" className="ev-unit-page__search-link mono">
        Looking for something specific? Search all questions →
      </Link>
    </div>
  )
}
