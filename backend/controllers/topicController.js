const Topic = require('../models/Topic');

exports.getTopicsByUnit = async (req, res) => {
  try {
    const { subjectSlug, unitSlug } = req.params;
    const topics = await Topic.find({ subjectSlug, unitSlug });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTopicBySlug = async (req, res) => {
  try {
    const { subjectSlug, unitSlug, topicSlug } = req.params;
    const topic = await Topic.findOne({ subjectSlug, unitSlug, slug: topicSlug });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
