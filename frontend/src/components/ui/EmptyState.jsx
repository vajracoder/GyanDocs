import Button from './Button.jsx'
import './EmptyState.css'

export default function EmptyState({ title = 'Nothing here yet', description = '', actionLabel, actionTo, icon }) {
  return (
    <div className="ev-empty">
      <div className="ev-empty__icon" aria-hidden="true">
        {icon || (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
            <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M8.5 11h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <h3 className="ev-empty__title">{title}</h3>
      {description && <p className="ev-empty__desc">{description}</p>}
      {actionLabel && actionTo && (<Button to={actionTo} variant="secondary" size="sm">{actionLabel}</Button>)}
    </div>
  )
}
