import { Link } from 'react-router-dom'
import './Breadcrumb.css'

export default function Breadcrumb({ items = [] }) {
  if (!items.length) return null
  return (
    <nav className="ev-breadcrumb" aria-label="Breadcrumb">
      <ol className="ev-breadcrumb__list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} className="ev-breadcrumb__item">
              {!isLast && item.to ? (
                <Link to={item.to} className="ev-breadcrumb__link">{item.label}</Link>
              ) : (
                <span className="ev-breadcrumb__current" aria-current={isLast ? 'page' : undefined}>{item.label}</span>
              )}
              {!isLast && <span className="ev-breadcrumb__sep" aria-hidden="true">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
