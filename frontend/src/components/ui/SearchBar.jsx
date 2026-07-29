import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './SearchBar.css'

export default function SearchBar({
  value, onChange, onSubmit,
  placeholder = 'Search "Deadlock", "Binary Tree", "Unit 3"...',
  size = 'lg', autoFocus = false, suggestions = [],
}) {
  const navigate = useNavigate()
  const [internalValue, setInternalValue] = useState('')
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  function handleChange(e) {
    const next = e.target.value
    if (isControlled) onChange?.(next)
    else setInternalValue(next)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const query = currentValue.trim()
    if (!query) return
    if (onSubmit) onSubmit(query)
    else navigate(`/results?q=${encodeURIComponent(query)}`)
  }

  function handleSuggestionClick(term) {
    if (isControlled) { onChange?.(term); onSubmit?.(term) }
    else navigate(`/results?q=${encodeURIComponent(term)}`)
  }

  return (
    <div className={`ev-searchbar ev-searchbar--${size}`}>
      <form onSubmit={handleSubmit} className="ev-searchbar__form" role="search">
        <svg className="ev-searchbar__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text" className="ev-searchbar__input" placeholder={placeholder}
          value={currentValue} onChange={handleChange} autoFocus={autoFocus}
          aria-label="Search previous year questions"
        />
        <button type="submit" className="ev-searchbar__submit">Search</button>
      </form>
      {suggestions.length > 0 && (
        <div className="ev-searchbar__suggestions">
          <span className="ev-searchbar__suggestions-label">Try:</span>
          {suggestions.map((term) => (
            <button key={term} type="button" className="ev-searchbar__chip" onClick={() => handleSuggestionClick(term)}>
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
