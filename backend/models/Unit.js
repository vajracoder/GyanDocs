const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },

    unitNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    topicsCount: {
      type: Number,
      default: 0,
    },

    questionsCount: {
      type: Number,
      default: 0,
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

unitSchema.index(
  {
    subjectId: 1,
    unitNumber: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Unit", unitSchema);