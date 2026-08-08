const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    shortName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
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

subjectSchema.index({ code: 1 }, { unique: true });

subjectSchema.index(
  { semester: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("Subject", subjectSchema);