import { Link } from 'react-router-dom'
import './SubjectCard.css'

export default function SubjectCard({ subject }) {
  const { slug, name, code, description, unitsCount, questionsCount, accent } = subject
  return (
    <Link to={`/subjects/${slug}`} className="ev-subject-card card-base">
      <div className="ev-subject-card__icon" style={{ background: `${accent}14`, color: accent }}>{code}</div>
      <h3 className="ev-subject-card__name">{name}</h3>
      <p className="ev-subject-card__desc">{description}</p>
      <div className="ev-subject-card__meta mono">
        <span>{unitsCount} units</span>
        <span className="ev-subject-card__dot" aria-hidden="true">&middot;</span>
        <span>{questionsCount} questions</span>
      </div>
    </Link>
  )
}
