import { Link } from 'react-router-dom'
import './TopicCard.css'

export default function TopicCard({ topic }) {
  const { subjectSlug, unitSlug, slug, name, questionsCount } = topic
  return (
    <Link to={`/subjects/${subjectSlug}/${unitSlug}/${slug}`} className="ev-topic-card card-base">
      <span className="ev-topic-card__name">{name}</span>
      <span className="ev-topic-card__count mono">{questionsCount} {questionsCount === 1 ? 'question' : 'questions'}</span>
      <span className="ev-topic-card__arrow" aria-hidden="true">→</span>
    </Link>
  )
}
