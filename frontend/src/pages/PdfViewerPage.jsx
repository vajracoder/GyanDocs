import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import questionsFallback from '../data/questions.json'
import { getQuestionById } from '../services/api.js'
import EmptyState from '../components/ui/EmptyState.jsx'
import LoadingSkeleton from '../components/ui/LoadingSkeleton.jsx'
import './PdfViewerPage.css'

const ZOOM_STEPS = [50, 75, 100, 125, 150, 175, 200]

export default function PdfViewerPage() {
  const { questionId } = useParams()
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [zoomIndex, setZoomIndex] = useState(2) // 100%
  const [page] = useState(1)
  const totalPages = 1 // sample PDF is a single page — UI still shows real nav controls

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getQuestionById(questionId)
      .then((q) => !cancelled && setQuestion(q))
      .catch(() => !cancelled && setQuestion(questionsFallback.find((q) => q.id === questionId) || null))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [questionId])

  if (loading) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--sp-10)' }}>
        <LoadingSkeleton variant="text" count={3} />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--sp-16)' }}>
        <EmptyState
          title="Question not found"
          description="Can't open a PDF for a question that doesn't exist."
          actionLabel="Back to Search"
          actionTo="/search"
        />
      </div>
    )
  }

  const zoom = ZOOM_STEPS[zoomIndex]
  const id = question.id || question._id

  return (
    <div className="ev-pdf">
      <div className="ev-pdf__toolbar">
        <div className="ev-pdf__toolbar-left">
          <Link to={`/question/${id}`} className="ev-pdf__close" aria-label="Close viewer">
            ✕
          </Link>
          <div className="ev-pdf__title">
            <span className="ev-pdf__title-main">{question.topicName}</span>
            <span className="ev-pdf__title-sub mono">
              {question.subjectName} · Unit {question.unitNumber} · {question.year}
            </span>
          </div>
        </div>

        <div className="ev-pdf__toolbar-center">
          <button
            className="ev-pdf__icon-btn"
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
            disabled={zoomIndex === 0}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="ev-pdf__zoom-value mono">{zoom}%</span>
          <button
            className="ev-pdf__icon-btn"
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            aria-label="Zoom in"
          >
            +
          </button>

          <span className="ev-pdf__divider" aria-hidden="true" />

          <button className="ev-pdf__icon-btn" disabled aria-label="Previous page">‹</button>
          <span className="ev-pdf__page-value mono">
            Page {page} of {totalPages}
          </span>
          <button className="ev-pdf__icon-btn" disabled aria-label="Next page">›</button>
        </div>

        <div className="ev-pdf__toolbar-right">
          <a href={question.pdfUrl} download className="ev-pdf__download">
            Download
          </a>
        </div>
      </div>

      <div className="ev-pdf__stage">
        <div className="ev-pdf__page-wrap" style={{ transform: `scale(${zoom / 100})` }}>
          <iframe
            src={question.pdfUrl}
            title={`${question.topicName} — PDF`}
            className="ev-pdf__frame"
          />
        </div>
      </div>
    </div>
  )
}
