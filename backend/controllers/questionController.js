const Question = require('../models/Question');

exports.getQuestionsByTopic = async (req, res) => {
  try {
    const { subjectSlug, unitSlug, topicSlug } = req.params;
    const questions = await Question.find({ subjectSlug, unitSlug, topicSlug });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
