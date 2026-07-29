import './LoadingSkeleton.css'

export default function LoadingSkeleton({ variant = 'card', count = 3 }) {
  const items = Array.from({ length: count })

  if (variant === 'list') {
    return (
      <div className="ev-skel-list">
        {items.map((_, i) => (
          <div className="ev-skel ev-skel--row" key={i}>
            <div className="ev-skel__line ev-skel__line--80" />
            <div className="ev-skel__line ev-skel__line--40" />
            <div className="ev-skel__meta">
              <span className="ev-skel__chip" /><span className="ev-skel__chip" /><span className="ev-skel__chip" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (variant === 'text') {
    return (
      <div className="ev-skel-text">
        {items.map((_, i) => (
          <div className="ev-skel ev-skel__line" key={i} style={{ width: i % 2 ? '60%' : '90%' }} />
        ))}
      </div>
    )
  }
  return (
    <div className="ev-skel-grid">
      {items.map((_, i) => (
        <div className="ev-skel ev-skel--card" key={i}>
          <div className="ev-skel__block ev-skel__block--icon" />
          <div className="ev-skel__line ev-skel__line--70" />
          <div className="ev-skel__line ev-skel__line--50" />
        </div>
      ))}
    </div>
  )
}
