import axios from "axios";
import { auth } from "../firebase/firebase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach a fresh Firebase ID token to every request when the user is authenticated.
// Public GET requests continue to work without a token.
api.interceptors.request.use(
  async (config) => {
    try {
      if (auth && auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        if (idToken) {
          config.headers.Authorization = `Bearer ${idToken}`;
        }
      }
    } catch (err) {
      // If token retrieval fails, send the request without an Authorization header.
      // Protected endpoints will return 401, which is the expected behavior.
      console.error("Failed to attach Firebase ID token:", err.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================
// SUBJECTS
// ==========================

export const getSubjects = () =>
  api.get("/subjects").then((res) => res.data.data);

export const createSubject = (data) =>
  api.post("/subjects", data).then((res) => res.data);

export const updateSubject = (id, data) =>
  api.put(`/subjects/${id}`, data).then((res) => res.data);

export const getSubject = (slug) =>
  api.get(`/subjects/${slug}`).then((res) => res.data);

export const deleteSubject = (id) =>
  api.delete(`/subjects/${id}`).then((res) => res.data);

// ==========================
// UNITS
// ==========================

export const getUnits = (subjectId) =>
  api.get(`/units?subjectId=${subjectId}`).then((res) => res.data);

export const getUnit = (subjectSlug, unitSlug) =>
  api.get(`/units/${subjectSlug}/${unitSlug}`).then((res) => res.data);

export const createUnit = (data) =>
  api.post("/units", data).then((res) => res.data);

export const updateUnit = (id, data) =>
  api.put(`/units/${id}`, data).then((res) => res.data);

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
