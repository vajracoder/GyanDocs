import './Pagination.css'

function getPageList(current, total) {
  const pages = []
  const windowSize = 1
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= windowSize) pages.push(i)
    else if (pages[pages.length - 1] !== '...') pages.push('...')
  }
  return pages
}

export default function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null
  const pages = getPageList(currentPage, totalPages)
  return (
    <nav className="ev-pagination" aria-label="Pagination">
      <button className="ev-pagination__nav" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">←</button>
      <div className="ev-pagination__pages">
        {pages.map((p, i) => p === '...' ? (
          <span key={`ellipsis-${i}`} className="ev-pagination__ellipsis">…</span>
        ) : (
          <button key={p} className={`ev-pagination__page ${p === currentPage ? 'ev-pagination__page--active' : ''}`} onClick={() => onPageChange(p)} aria-current={p === currentPage ? 'page' : undefined}>{p}</button>
        ))}
      </div>
      <button className="ev-pagination__nav" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page">→</button>
    </nav>
  )
}
