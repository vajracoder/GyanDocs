import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

export const getSubjects = () => api.get('/subjects').then((r) => r.data)
export const getSubject = (subjectSlug) => api.get(`/subjects/${subjectSlug}`).then((r) => r.data)

export const getUnits = (subjectSlug) => api.get(`/units/${subjectSlug}`).then((r) => r.data)
export const getUnit = (subjectSlug, unitSlug) => api.get(`/units/${subjectSlug}/${unitSlug}`).then((r) => r.data)

export const getTopics = (subjectSlug, unitSlug) => api.get(`/topics/${subjectSlug}/${unitSlug}`).then((r) => r.data)
export const getTopic = (subjectSlug, unitSlug, topicSlug) =>
  api.get(`/topics/${subjectSlug}/${unitSlug}/${topicSlug}`).then((r) => r.data)

export const getQuestionsByTopic = (subjectSlug, unitSlug, topicSlug) =>
  api.get(`/questions/${subjectSlug}/${unitSlug}/${topicSlug}`).then((r) => r.data)
export const getQuestionById = (id) => api.get(`/questions/id/${id}`).then((r) => r.data)

export const searchQuestions = (q) => api.get('/search', { params: { q } }).then((r) => r.data)

export default api
