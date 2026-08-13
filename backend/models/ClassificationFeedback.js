const mongoose = require("mongoose");

/**
 * Records an admin correction to an automatic classification.
 * Used later to improve aliases/concepts. Not used for ML training.
 */
const classificationFeedbackSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
      index: true,
    },

    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    predictedUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      default: null,
    },

    predictedTopicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      default: null,
    },

    actualUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },

    actualTopicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      default: null,
    },

    predictedConfidence: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },

    correctedBy: {
      type: String,
      default: "",
      trim: true,
    },

    correctedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate feedback for the same question + actual unit/topic
classificationFeedbackSchema.index(
  {
    questionId: 1,
    actualUnitId: 1,
    actualTopicId: 1,
  },
  {
    unique: true,
    partialFilterExpression: { questionId: { $type: "objectId" } },
  }
);

module.exports = mongoose.model("ClassificationFeedback", classificationFeedbackSchema);