const express = require("express");
const router = express.Router();

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
router.post("/", createQuestion);

// PUT update question
router.put("/:id", updateQuestion);

// DELETE question
router.delete("/:id", deleteQuestion);

module.exports = router;