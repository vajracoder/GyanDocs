const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
      index: true,
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

    // ── Rich syllabus profile (optional, non-breaking) ──────────
    // These fields enrich the classifier's concept profile. They are
    // optional so existing Topic documents continue to work unchanged.
    // When absent, the classifier derives tokens from name + description.

    // Core terms that uniquely identify this topic (e.g. "normalization", "3NF")
    keywords: {
      type: [String],
      default: [],
    },

    // Alternative names / aliases for this topic (e.g. "normal forms")
    aliases: {
      type: [String],
      default: [],
    },

    // Related concepts that questions about this topic often mention
    // (e.g. "functional dependency", "decomposition")
    concepts: {
      type: [String],
      default: [],
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

// One topic with the same name cannot exist twice in one unit
topicSchema.index(
  {
    unitId: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Topic", topicSchema);