const mongoose = require("mongoose");
const { calculatePriority } = require("../utils/priorityHelper");

const questionSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },

    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
      index: true,
    },

    // Sub-unit / topic classification (optional — may be null if admin
    // has not yet assigned a topic, or if the classifier was uncertain).
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      default: null,
      index: true,
    },

    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    years: {
      type: [Number],
      default: [],
    },

    priority: {
      type: Number,
      default: 0,
    },

    marks: {
      type: Number,
    },

    // Course outcome (CO) extracted from the PDF (e.g. 1, 2, 3 …)
    co: {
      type: Number,
      default: null,
    },

    // Bloom's level extracted from the PDF (e.g. "K1", "K2", "K3" …)
    level: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },

    // Confidence (0.0 – 1.0) of the automatic unit/sub-unit classification.
    // null means no automatic classification was attempted.
    classificationConfidence: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },

    questionType: {
      type: String,
      enum: ["theory", "numerical", "mcq"],
      default: "theory",
    },

    answer: {
      type: String,
      default: "",
    },

    source: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate priority automatically from years length
questionSchema.pre("save", function (next) {
  if (this.isModified("years") || this.isNew) {
    this.priority = calculatePriority(this.years);
  }
  next();
});

// Attach helper static method
questionSchema.statics.calculatePriority = calculatePriority;

module.exports = mongoose.model("Question", questionSchema);