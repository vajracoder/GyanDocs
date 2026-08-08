const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
      index: true,
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    years: [
      {
        type: Number,
      },
    ],

    frequency: {
      type: Number,
      default: 1,
    },

    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },

    marks: {
      type: Number,
      default: 0,
    },

    questionType: {
      type: String,
      enum: ["Theory", "Numerical", "Short", "Long"],
      default: "Theory",
    },

    pdfLinks: [
      {
        type: String,
      },
    ],

    isImportant: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model("Question", questionSchema);