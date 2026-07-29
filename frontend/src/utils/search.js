/**
 * searchQuestions
 * Filters + ranks the local questions dataset against a free-text query.
 * Understands: plain keywords ("Deadlock", "CPU Scheduling"), and
 * "Unit N" style queries which match by unit number across all subjects.
 */
export function searchQuestions(questions, rawQuery) {
  const query = (rawQuery || '').trim().toLowerCase()
  if (!query) return []

  const unitMatch = query.match(/unit\s*0*(\d+)/)

  const scored = questions
    .map((item) => {
      const topic = item.topicName.toLowerCase()
      const subject = item.subjectName.toLowerCase()
      const unit = item.unitName.toLowerCase()
      const text = item.question.toLowerCase()

      let score = 0
      if (unitMatch && Number(unitMatch[1]) === item.unitNumber) score += 5
      if (topic.includes(query)) score += 4
      if (subject.includes(query)) score += 2
      if (unit.includes(query)) score += 2
      if (text.includes(query)) score += 1

      return { item, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.item.frequency - a.item.frequency)

  return scored.map(({ item }) => item)
}

/** Scope a question list down to one topic (used by the ResultsPage when
 *  reached via /subjects/:subjectSlug/:unitSlug/:topicSlug) */
export function questionsForTopic(questions, subjectSlug, unitSlug, topicSlug) {
  return questions.filter(
    (q) => q.subjectSlug === subjectSlug && q.unitSlug === unitSlug && q.topicSlug === topicSlug
  )
}

export function paginate(items, page, perPage) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * perPage
  return {
    pageItems: items.slice(start, start + perPage),
    totalPages,
    page: safePage,
  }
}
