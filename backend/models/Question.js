const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    subjectSlug: { type: String, required: true, index: true },
    subjectName: { type: String, required: true },
    unitSlug: { type: String, required: true, index: true },
    unitName: { type: String, required: true },
    unitNumber: { type: Number, required: true },
    topicSlug: { type: String, required: true, index: true },
    topicName: { type: String, required: true },
    question: { type: String, required: true },
    marks: { type: Number, required: true },
    year: { type: Number, required: true },
    frequency: { type: Number, default: 1 },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Low' },
    pdfUrl: { type: String, default: '/sample.pdf' },
  },
  { timestamps: true }
);

questionSchema.index({ question: 'text', topicName: 'text', subjectName: 'text', unitName: 'text' });

module.exports = mongoose.model('Question', questionSchema);
