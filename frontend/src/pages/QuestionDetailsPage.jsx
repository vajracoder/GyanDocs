import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import questionsFallback from '../data/questions.json'
import { getQuestionById, getQuestionsByTopic } from '../services/api.js'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import Button from '../components/ui/Button.jsx'
import PriorityBadge from '../components/ui/PriorityBadge.jsx'
import FrequencyBar from '../components/ui/FrequencyBar.jsx'
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
      .then((q) => {
        if (cancelled) return
        setQuestion(q)
        return getQuestionsByTopic(q.subjectSlug, q.unitSlug, q.topicSlug)
      })
      .then((topicQs) => {
        if (cancelled || !topicQs) return
        setRelated(topicQs.filter((q) => (q.id || q._id) !== questionId).slice(0, 3))
      })
      .catch(() => {
        if (cancelled) return
        const local = questionsFallback.find((q) => q.id === questionId) || null
        setQuestion(local)
        if (local) {
          setRelated(
            questionsFallback
              .filter((q) => q.id !== local.id && q.topicSlug === local.topicSlug && q.subjectSlug === local.subjectSlug)
              .slice(0, 3)
          )
        }
      })
      .finally(() => !cancelled && setLoading(false))

    return () => { cancelled = true }
  }, [questionId])

  if (loading) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--sp-10)' }}>
        <LoadingSkeleton variant="text" count={4} />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--sp-16)' }}>
        <EmptyState
          title="Question not found"
          description="This question may have been removed or the link is incorrect."
          actionLabel="Back to Search"
          actionTo="/search"
        />
      </div>
    )
  }

  const {
    subjectSlug, unitSlug, topicSlug,
    subjectName, unitNumber, topicName,
    question: text, marks, year, frequency, priority, pdfUrl,
  } = question
  const id = question.id || question._id

  return (
    <div className="container ev-qdp">
      <Breadcrumb
        items={[
          { label: 'Subjects', to: '/subjects' },
          { label: subjectName, to: `/subjects/${subjectSlug}` },
          { label: `Unit ${unitNumber}`, to: `/subjects/${subjectSlug}/${unitSlug}` },
          { label: topicName, to: `/subjects/${subjectSlug}/${unitSlug}/${topicSlug}` },
          { label: 'Question' },
        ]}
      />

      <div className="ev-qdp__card card-base">
        <div className="ev-qdp__top">
          <span className="ev-qdp__path mono">
            {subjectName} <span className="ev-qdp__sep">/</span> Unit {unitNumber} <span className="ev-qdp__sep">/</span> {topicName}
          </span>
          <PriorityBadge priority={priority} />
        </div>

        <h1 className="ev-qdp__question">{text}</h1>

        <div className="ev-qdp__stats">
          <div className="ev-qdp__stat">
            <span className="ev-qdp__stat-label mono">Marks</span>
            <span className="ev-qdp__stat-value">{marks}</span>
          </div>
          <div className="ev-qdp__stat">
            <span className="ev-qdp__stat-label mono">Year Asked</span>
            <span className="ev-qdp__stat-value">{year}</span>
          </div>
          <div className="ev-qdp__stat">
            <span className="ev-qdp__stat-label mono">Frequency</span>
            <FrequencyBar frequency={frequency} size="lg" />
          </div>
          <div className="ev-qdp__stat">
            <span className="ev-qdp__stat-label mono">Priority</span>
            <PriorityBadge priority={priority} />
          </div>
        </div>

        <div className="ev-qdp__actions">
          <Button to={`/question/${id}/pdf`} variant="primary" size="lg">
            View PDF
          </Button>
          <Button href={pdfUrl} download variant="secondary" size="lg">
            Download PDF
          </Button>
        </div>
      </div>

      {related.length > 0 && (
        <div className="ev-qdp__related">
          <h2>More from "{topicName}"</h2>
          <div className="ev-qdp__related-list">
            {related.map((q) => (
              <QuestionCard key={q.id || q._id} question={q} />
            ))}
          </div>
        </div>
      )}

      <Link to={`/subjects/${subjectSlug}/${unitSlug}/${topicSlug}`} className="ev-qdp__back mono">
        ← Back to {topicName} questions
      </Link>
    </div>
  )
}
