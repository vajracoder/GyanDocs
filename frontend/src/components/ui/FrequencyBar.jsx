import './FrequencyBar.css'

const MAX_SCALE = 6

export default function FrequencyBar({ frequency = 1, showLabel = true, size = 'md' }) {
  const bars = Array.from({ length: MAX_SCALE }, (_, i) => i < Math.min(frequency, MAX_SCALE))
  const level = frequency >= 5 ? 'high' : frequency >= 3 ? 'medium' : 'low'
  return (
    <div className={`ev-freq ev-freq--${size}`} title={`Asked ${frequency} time${frequency === 1 ? '' : 's'} in past papers`}>
      <div className={`ev-freq__bars ev-freq__bars--${level}`} aria-hidden="true">
        {bars.map((filled, i) => (
          <span key={i} className={`ev-freq__bar ${filled ? 'ev-freq__bar--filled' : ''}`} style={{ height: `${30 + i * 12}%` }} />
        ))}
      </div>
      {showLabel && <span className="ev-freq__label mono">{frequency}&times; asked</span>}
    </div>
  )
}
