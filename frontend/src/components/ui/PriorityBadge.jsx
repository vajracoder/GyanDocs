import './PriorityBadge.css'

const CONFIG = {
  high: { dot: 'var(--red)' },
  medium: { dot: 'var(--amber-ink)' },
  low: { dot: 'var(--green-ink)' },
}

export default function PriorityBadge({ priority = 1 }) {
  const numericPriority = Number(priority)
  const level = Number.isFinite(numericPriority)
    ? numericPriority >= 4 ? 'high' : numericPriority >= 3 ? 'medium' : 'low'
    : String(priority).toLowerCase()
  const cfg = CONFIG[level] || CONFIG.medium
  const label = Number.isFinite(numericPriority)
    ? `${'★'.repeat(Math.min(Math.max(numericPriority, 1), 5))}${'☆'.repeat(5 - Math.min(Math.max(numericPriority, 1), 5))}`
    : `${priority} Priority`
  const className = `ev-priority ev-priority--${level}`
  return (
    <span className={className}>
      <span className="ev-priority__dot" style={{ background: cfg.dot }} aria-hidden="true" />
      {label}
    </span>
  )
}
