import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================
// SUBJECTS
// ==========================

export const getSubjects = () =>
  api.get("/subjects").then((res) => res.data);

export const createSubject = (data) =>
  api.post("/subjects", data).then((res) => res.data);

export const getSubject = (slug) =>
  api.get(`/subjects/${slug}`).then((res) => res.data);

// ==========================
// UNITS
// ==========================

export const getUnits = (subjectId) =>
  api.get(`/units?subjectId=${subjectId}`).then((res) => res.data);

export const getUnit = (subjectSlug, unitSlug) =>
  api.get(`/units/${subjectSlug}/${unitSlug}`).then((res) => res.data);

export const createUnit = (data) =>
  api.post("/units", data).then((res) => res.data);

// ==========================
// TOPICS
// ==========================

export const getTopics = (subjectSlug, unitSlug) =>
  api.get(`/topics?subjectSlug=${subjectSlug}&unitSlug=${unitSlug}`).then((res) => res.data);

// ==========================
// QUESTIONS
// ==========================

export const getQuestions = (params) =>
  api
    .get("/questions", {
      params: typeof params === "object" ? params : { unitId: params },
    })
    .then((res) => res.data);

export const getQuestionsByUnit = (unitId) =>
  api.get(`/questions?unitId=${unitId}`).then((res) => res.data);

export const getQuestionById = (id) =>
  api.get(`/questions/${id}`).then((res) => res.data);

export const createQuestion = (data) =>
  api.post("/questions", data).then((res) => res.data);

export const updateQuestion = (id, data) =>
  api.put(`/questions/${id}`, data).then((res) => res.data);

export const deleteQuestion = (id) =>
  api.delete(`/questions/${id}`).then((res) => res.data);

export const searchQuestions = (query) =>
  api.get(`/questions?search=${encodeURIComponent(query)}`).then((res) => res.data);

export const getQuestionsByTopic = (subjectSlug, unitSlug, topicSlug) =>
  api.get(`/questions?topicSlug=${topicSlug}`).then((res) => res.data);

// ==========================
// SMART REVISION
// ==========================

export const getRevisionQuestions = (unitId) =>
  api
    .get(`/questions/revision?unitId=${unitId}`)
    .then((res) => res.data);

// ==========================
// PDF PARSER
// ==========================

export const parsePdf = (file) => {
  const formData = new FormData();
  formData.append("pdf", file);
  return api
    .post("/pdf/parse", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => res.data);
};

export const importPdf = (payload) =>
  api.post("/pdf/import", payload).then((res) => res.data);

export default api;