const Question = require("../models/Question");

// ==============================
// CREATE QUESTION
// ==============================
exports.createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: question,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// GET QUESTIONS BY UNIT
// ==============================
exports.getQuestionsByUnit = async (req, res) => {
  try {
    const { unitId } = req.query;

    if (!unitId) {
      return res.status(400).json({
        success: false,
        message: "unitId is required",
      });
    }

    const questions = await Question.find({
      unitId,
      isActive: true,
    }).sort({
      priority: -1,
      frequency: -1,
      marks: -1,
    });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// GET QUESTION BY ID
// ==============================
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate("unitId");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// SMART REVISION
// ==============================
exports.getRevisionQuestions = async (req, res) => {
  try {
    const { unitId } = req.query;

    if (!unitId) {
      return res.status(400).json({
        success: false,
        message: "unitId is required",
      });
    }

    const questions = await Question.find({
      unitId,
      isActive: true,
    }).sort({
      priority: -1,
      frequency: -1,
      marks: -1,
    });

    res.status(200).json({
      success: true,
      total: questions.length,
      data: questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};