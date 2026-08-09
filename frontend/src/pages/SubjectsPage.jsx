import { useEffect, useState } from 'react'
import subjectsFallback from '../data/subjects.json'
import { getSubjects } from '../services/api.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import SubjectCard from '../components/cards/SubjectCard.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import './SubjectsPage.css'

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getSubjects()
      .then((data) => !cancelled && setSubjects(data))
      .catch(() => !cancelled && setSubjects(subjectsFallback))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  return (
    <div className="container ev-subjects-page">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Subjects' }]} />

      <div className="ev-subjects-page__head">
        <span className="eyebrow">All subjects</span>
        <h1>Pick a subject to start</h1>
        {!loading && subjects && (
          <p className="text-muted">
            {subjects.length} subjects, {subjects.reduce((sum, s) => sum + s.questionsCount, 0)} indexed
            questions across {subjects.reduce((sum, s) => sum + s.unitsCount, 0)} units.
          </p>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton variant="card" count={6} />
      ) : (
        <div className="ev-subjects-page__grid">
          {subjects.map((s) => (
            <SubjectCard key={s._id || s.id} subject={s} />
          ))}
        </div>
      )}
    </div>
  )
}
