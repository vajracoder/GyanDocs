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