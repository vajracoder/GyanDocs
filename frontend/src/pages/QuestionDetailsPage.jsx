import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getQuestionById, getQuestions } from '../services/api.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import PriorityBadge from '../components/ui/PriorityBadge.jsx'
import QuestionCard from '../components/cards/QuestionCard.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import './QuestionDetailsPage.css'

export default function QuestionDetailsPage() {
  const { questionId } = useParams()
  const [question, setQuestion] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getQuestionById(questionId)
      .then((response) => {
        const currentQuestion = response.data
        if (cancelled || !currentQuestion) return null
        setQuestion(currentQuestion)
        return getQuestions({ unitId: currentQuestion.unitId?._id || currentQuestion.unitId })
      })
      .then((response) => {
        if (cancelled || !response) return
        setRelated((response.data || []).filter((item) => (item._id || item.id) !== questionId).slice(0, 3))
      })
      .catch(() => {
        if (!cancelled) setQuestion(null)
      })
      .finally(() => !cancelled && setLoading(false))

    return () => { cancelled = true }
  }, [questionId])

  if (loading) {
    return <div className="container" style={{ paddingBlock: 'var(--sp-10)' }}><LoadingSkeleton variant="text" count={4} /></div>
  }

  if (!question) {
    return <div className="container" style={{ paddingBlock: 'var(--sp-16)' }}><EmptyState title="Question not found" description="This question may have been removed or the link is incorrect." actionLabel="Back to Search" actionTo="/search" /></div>
  }

  const { subjectId, unitId, questionText, years = [], marks, questionType, priority, source } = question
  const subjectName = subjectId?.name || 'Subject'
  const subjectSlug = subjectId?.slug
  const unitNumber = unitId?.unitNumber
  const unitSlug = unitId?.slug

  return (
    <div className="container ev-qdp">
      <Breadcrumb items={[
        { label: 'Home', to: '/' },
        { label: 'Subjects', to: '/subjects' },
        { label: subjectName, to: `/subjects/${subjectSlug}` },
        { label: `Unit ${unitNumber}`, to: `/subjects/${subjectSlug}/${unitSlug}` },
        { label: 'Question' },
      ]} />

      <div className="ev-qdp__card card-base">
        <div className="ev-qdp__top">
          <span className="ev-qdp__path mono">{subjectName} <span className="ev-qdp__sep">/</span> Unit {unitNumber}</span>
          <PriorityBadge priority={priority} />
        </div>
        <h1 className="ev-qdp__question">{questionText}</h1>
        <div className="ev-qdp__stats">
          <div className="ev-qdp__stat"><span className="ev-qdp__stat-label mono">Marks</span><span className="ev-qdp__stat-value">{marks ?? 'N/A'}</span></div>
          <div className="ev-qdp__stat"><span className="ev-qdp__stat-label mono">Years Asked</span><span className="ev-qdp__stat-value">{years.length ? years.join(' • ') : 'None'}</span></div>
          <div className="ev-qdp__stat"><span className="ev-qdp__stat-label mono">Frequency</span><span className="ev-qdp__stat-value">{years.length} {years.length === 1 ? 'time' : 'times'}</span></div>
          <div className="ev-qdp__stat"><span className="ev-qdp__stat-label mono">Question Type</span><span className="ev-qdp__stat-value">{questionType || 'theory'}</span></div>
        </div>
        {source && <div className="ev-qdp__actions"><span className="mono">Source: {source}</span></div>}
      </div>

      {related.length > 0 && <div className="ev-qdp__related"><h2>More from Unit {unitNumber}</h2><div className="ev-qdp__related-list">{related.map((item) => <QuestionCard key={item._id || item.id} question={item} />)}</div></div>}
      <Link to={`/subjects/${subjectSlug}/${unitSlug}`} className="ev-qdp__back mono">Back to Unit {unitNumber}</Link>
    </div>
  )
}
