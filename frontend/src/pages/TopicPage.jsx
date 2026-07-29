import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import subjectsFallback from '../data/subjects.json'
import unitsFallback from '../data/units.json'
import topicsFallback from '../data/topics.json'
import { getUnit, getTopics } from '../services/api.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import TopicCard from '../components/cards/TopicCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import './TopicPage.css'

export default function TopicPage() {
  const { subjectSlug, unitSlug } = useParams()
  const [unit, setUnit] = useState(null)
  const [unitTopics, setUnitTopics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getUnit(subjectSlug, unitSlug), getTopics(subjectSlug, unitSlug)])
      .then(([u, t]) => {
        if (cancelled) return
        setUnit(u)
        setUnitTopics(t)
      })
      .catch(() => {
        if (cancelled) return
        setUnit(unitsFallback.find((u) => u.subjectSlug === subjectSlug && u.slug === unitSlug) || null)
        setUnitTopics(topicsFallback.filter((t) => t.subjectSlug === subjectSlug && t.unitSlug === unitSlug))
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [subjectSlug, unitSlug])

  const subject = subjectsFallback.find((s) => s.slug === subjectSlug)

  if (loading) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--sp-10)' }}>
        <LoadingSkeleton variant="list" count={4} />
      </div>
    )
  }

  if (!unit) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--sp-16)' }}>
        <EmptyState
          title="Unit not found"
          description="That unit doesn't exist in GyanDoc yet."
          actionLabel="Browse all subjects"
          actionTo="/subjects"
        />
      </div>
    )
  }

  return (
    <div className="container ev-topic-page">
      <Breadcrumb
        items={[
          { label: 'Subjects', to: '/subjects' },
          { label: subject?.name || subjectSlug, to: `/subjects/${subjectSlug}` },
          { label: `Unit ${unit.unitNumber}` },
        ]}
      />

      <div className="ev-topic-page__head">
        <span className="eyebrow">Unit {unit.unitNumber}</span>
        <h1>{unit.name}</h1>
        <p className="text-muted">{unit.description}</p>
      </div>

      <div className="ev-topic-page__meta mono">
        <span>{unitTopics.length} topics</span>
        <span className="ev-topic-page__dot">&middot;</span>
        <span>{unit.questionsCount} questions</span>
      </div>

      {unitTopics.length === 0 ? (
        <EmptyState
          title="No topics yet"
          description="This unit doesn't have any indexed topics yet."
          actionLabel="Back to units"
          actionTo={`/subjects/${subjectSlug}`}
        />
      ) : (
        <div className="ev-topic-page__list">
          {unitTopics.map((t) => (
            <TopicCard key={t.id} topic={t} />
          ))}
        </div>
      )}

      <Link to={`/subjects/${subjectSlug}`} className="ev-topic-page__back mono">
        ← Back to {subject?.name || subjectSlug} units
      </Link>
    </div>
  )
}
