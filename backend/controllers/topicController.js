const Topic = require('../models/Topic');
const { normalizeError } = require('../middleware/errorHandler');

exports.getTopicsByUnit = async (req, res) => {
  try {
    const { subjectSlug, unitSlug } = req.params;
    const topics = await Topic.find({ subjectSlug, unitSlug });
    res.json(topics);
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({ message });
  }
};

exports.getTopicBySlug = async (req, res) => {
  try {
    const { subjectSlug, unitSlug, topicSlug } = req.params;
    const topic = await Topic.findOne({ subjectSlug, unitSlug, slug: topicSlug });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json(topic);
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({ message });
  }
};
