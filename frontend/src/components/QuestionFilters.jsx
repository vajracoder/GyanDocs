import './QuestionFilters.css'

const PRIORITIES = [5, 4, 3, 2, 1]

function stars(priority) {
  return '★'.repeat(priority) + '☆'.repeat(5 - priority)
}

export default function QuestionFilters({ filters, years, onChange, onReset }) {
  return (
    <section className="ev-question-filters" aria-label="Filter questions">
      <label className="ev-question-filters__field ev-question-filters__field--search">
        <span>Search</span>
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search questions..."
        />
      </label>

      <label className="ev-question-filters__field">
        <span>Priority</span>
        <select value={filters.priority} onChange={(event) => onChange({ ...filters, priority: event.target.value })}>
          <option value="all">All</option>
          {PRIORITIES.map((priority) => <option key={priority} value={priority}>{stars(priority)}</option>)}
        </select>
      </label>

      <label className="ev-question-filters__field">
        <span>Year</span>
        <select value={filters.year} onChange={(event) => onChange({ ...filters, year: event.target.value })}>
          <option value="all">All</option>
          {years.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
      </label>

      <label className="ev-question-filters__field">
        <span>Question Type</span>
        <select value={filters.questionType} onChange={(event) => onChange({ ...filters, questionType: event.target.value })}>
          <option value="all">All</option>
          <option value="theory">Theory</option>
          <option value="numerical">Numerical</option>
          <option value="mcq">MCQ</option>
        </select>
      </label>

      <button type="button" className="ev-question-filters__reset" onClick={onReset}>Reset filters</button>
    </section>
  )
}
