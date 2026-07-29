import { Link } from 'react-router-dom'
import './Button.css'

export default function Button({
  children, variant = 'primary', size = 'md', to, href, icon, iconPosition = 'left', fullWidth = false, type = 'button', ...rest
}) {
  const className = ['ev-btn', `ev-btn--${variant}`, `ev-btn--${size}`, fullWidth ? 'ev-btn--full' : ''].filter(Boolean).join(' ')
  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="ev-btn__icon" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="ev-btn__icon" aria-hidden="true">{icon}</span>}
    </>
  )
  if (to) return (<Link to={to} className={className} {...rest}>{content}</Link>)
  if (href) return (<a href={href} className={className} {...rest}>{content}</a>)
  return (<button type={type} className={className} {...rest}>{content}</button>)
}
