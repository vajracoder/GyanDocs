const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
    accent: { type: String, default: '#2F5FFF' },
    unitsCount: { type: Number, default: 0 },
    questionsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
