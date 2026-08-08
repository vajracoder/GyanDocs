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