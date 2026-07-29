import { Link } from 'react-router-dom'
import './UnitCard.css'

export default function UnitCard({ unit }) {
  const { subjectSlug, slug, unitNumber, name, description, topicsCount, questionsCount } = unit
  return (
    <Link to={`/subjects/${subjectSlug}/${slug}`} className="ev-unit-card card-base">
      <span className="ev-unit-card__number mono">{String(unitNumber).padStart(2, '0')}</span>
      <div className="ev-unit-card__body">
        <span className="ev-unit-card__label mono">UNIT {unitNumber}</span>
        <h3 className="ev-unit-card__name">{name}</h3>
        <p className="ev-unit-card__desc">{description}</p>
        <div className="ev-unit-card__meta mono">
          <span>{topicsCount} topics</span>
          <span className="ev-unit-card__dot" aria-hidden="true">&middot;</span>
          <span>{questionsCount} questions</span>
        </div>
      </div>
      <span className="ev-unit-card__arrow" aria-hidden="true">→</span>
    </Link>
  )
}
