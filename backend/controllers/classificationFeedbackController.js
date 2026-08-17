const ClassificationFeedback = require("../models/ClassificationFeedback");
const { normalizeError } = require("../middleware/errorHandler");

// ==============================
// CREATE FEEDBACK
// Records an admin correction to an automatic classification.
// Used later to improve aliases/concepts. Not used for ML training.
// ==============================
exports.createFeedback = async (req, res) => {
  try {
    const {
      questionId,
      questionText,
      predictedUnitId,
      predictedTopicId,
      actualUnitId,
      actualTopicId,
      predictedConfidence,
      correctedBy,
    } = req.body;

    if (!questionText || questionText.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "questionText is required",
      });
    }

    if (!actualUnitId) {
      return res.status(400).json({
        success: false,
        message: "actualUnitId is required",
      });
    }

    const feedback = await ClassificationFeedback.create({
      questionId: questionId || null,
      questionText: questionText.trim(),
      predictedUnitId: predictedUnitId || null,
      predictedTopicId: predictedTopicId || null,
      actualUnitId,
      actualTopicId: actualTopicId || null,
      predictedConfidence:
        predictedConfidence != null ? Number(predictedConfidence) : null,
      correctedBy: correctedBy || "",
    });

    res.status(201).json({
      success: true,
      message: "Classification feedback recorded",
      data: feedback,
    });
  } catch (error) {
    // Handle duplicate feedback gracefully (same question + actual unit/topic)
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Feedback already recorded for this question",
        data: null,
      });
    }
    const { status, message } = normalizeError(error);
    res.status(status).json({ success: false, message });
  }
};

// ==============================
// GET FEEDBACK (admin review)
// ==============================
exports.getFeedback = async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;
    const feedback = await ClassificationFeedback.find()
      .sort({ correctedAt: -1 })
      .limit(Math.min(Number(limit) || 100, 500))
      .skip(Number(skip) || 0);

    const total = await ClassificationFeedback.countDocuments();

    res.status(200).json({
      success: true,
      count: feedback.length,
      total,
      data: feedback,
    });
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({ success: false, message });
  }
};

// ==============================
// DELETE FEEDBACK
// ==============================
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await ClassificationFeedback.findByIdAndDelete(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({ success: false, message });
  }
};