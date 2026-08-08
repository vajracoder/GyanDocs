const express = require("express");
const router = express.Router();

const {
  createQuestion,
  getQuestionsByUnit,
  getQuestionById,
  getRevisionQuestions,
} = require("../controllers/questionController");

// Smart Revision
router.get("/revision", getRevisionQuestions);

// Get Questions of a Unit
router.get("/", getQuestionsByUnit);

// Get Single Question
router.get("/:id", getQuestionById);

// Create Question
router.post("/", createQuestion);

module.exports = router;