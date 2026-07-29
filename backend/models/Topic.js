const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    subjectSlug: { type: String, required: true, index: true },
    subjectName: { type: String, required: true },
    unitSlug: { type: String, required: true, index: true },
    unitName: { type: String, required: true },
    unitNumber: { type: Number, required: true },
    slug: { type: String, required: true },
    name: { type: String, required: true },
    questionsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

topicSchema.index({ subjectSlug: 1, unitSlug: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Topic', topicSchema);
