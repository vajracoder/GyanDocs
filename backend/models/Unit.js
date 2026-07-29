const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema(
  {
    subjectSlug: { type: String, required: true, index: true },
    subjectName: { type: String, required: true },
    slug: { type: String, required: true },
    unitNumber: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    topicsCount: { type: Number, default: 0 },
    questionsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

unitSchema.index({ subjectSlug: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Unit', unitSchema);
