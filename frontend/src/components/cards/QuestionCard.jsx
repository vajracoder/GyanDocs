import { Link } from 'react-router-dom'
import PriorityBadge from '../ui/PriorityBadge.jsx'
import FrequencyBar from '../ui/FrequencyBar.jsx'
import './QuestionCard.css'

export default function QuestionCard({ question }) {
  const {
    _id,
    subjectId,
    unitId,
    questionText,
    years = [],
    marks,
    questionType,
    priority,
  } = question
  const subjectName = subjectId?.name || 'Subject'
  const unitNumber = unitId?.unitNumber
  const frequency = years.length
  const questionId = _id
  const typeLabel = questionType ? `${questionType.charAt(0).toUpperCase()}${questionType.slice(1)}` : 'Theory'

  return (
    <Link to={`/question/${questionId}`} className="ev-qcard card-base">
      <div className="ev-qcard__top">
        <span className="ev-qcard__path mono">
          {subjectName} <span className="ev-qcard__sep">/</span> Unit {unitNumber}
        </span>
        <PriorityBadge priority={priority} />
      </div>
      <p className="ev-qcard__question">{questionText}</p>
      <div className="ev-qcard__bottom">
        <div className="ev-qcard__stats mono">
          <span className="ev-qcard__stat">Asked in: {years.length ? years.join(' • ') : 'None'}</span>
          <span className="ev-qcard__stat">Frequency: {frequency} {frequency === 1 ? 'time' : 'times'}</span>
          <span className="ev-qcard__stat">Marks: {marks ?? 'N/A'}</span>
          <span className="ev-qcard__stat">Type: {typeLabel}</span>
        </div>
        <FrequencyBar frequency={frequency} size="sm" showLabel={false} />
      </div>
    </Link>
  )
}
