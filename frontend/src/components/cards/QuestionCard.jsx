import { Link } from 'react-router-dom'
import PriorityBadge from '../ui/PriorityBadge.jsx'
import FrequencyBar from '../ui/FrequencyBar.jsx'
import './QuestionCard.css'

export default function QuestionCard({ question }) {
  const { id, subjectName, unitName, unitNumber, topicName, question: text, marks, year, frequency, priority } = question
  return (
    <Link to={`/question/${id}`} className="ev-qcard card-base">
      <div className="ev-qcard__top">
        <span className="ev-qcard__path mono">
          {subjectName} <span className="ev-qcard__sep">/</span> Unit {unitNumber} <span className="ev-qcard__sep">/</span> {topicName}
        </span>
        <PriorityBadge priority={priority} />
      </div>
      <p className="ev-qcard__question">{text}</p>
      <div className="ev-qcard__bottom">
        <div className="ev-qcard__stats mono">
          <span className="ev-qcard__stat">{marks} marks</span>
          <span className="ev-qcard__stat">{year}</span>
        </div>
        <FrequencyBar frequency={frequency} size="sm" />
      </div>
    </Link>
  )
}
