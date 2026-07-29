import './PriorityBadge.css'

const CONFIG = {
  High: { dot: 'var(--red)' },
  Medium: { dot: 'var(--amber-ink)' },
  Low: { dot: 'var(--green-ink)' },
}

export default function PriorityBadge({ priority = 'Medium' }) {
  const cfg = CONFIG[priority] || CONFIG.Medium
  const className = `ev-priority ev-priority--${priority.toLowerCase()}`
  return (
    <span className={className}>
      <span className="ev-priority__dot" style={{ background: cfg.dot }} aria-hidden="true" />
      {priority} Priority
    </span>
  )
}
