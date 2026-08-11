const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require("../controllers/questionController");

// GET all questions (supports query filters: subjectId, unitId, year, priority, questionType, search)
router.get("/", getQuestions);

// GET single question by ID
router.get("/:id", getQuestionById);

// POST create question
router.post("/", authMiddleware, adminMiddleware, createQuestion);

// PUT update question
router.put("/:id", authMiddleware, adminMiddleware, updateQuestion);

// DELETE question
router.delete("/:id", authMiddleware, adminMiddleware, deleteQuestion);

module.exports = router;