const Topic = require('../models/Topic');
const { normalizeError } = require('../middleware/errorHandler');

// ==============================
// GET Topics by Unit
// ==============================
exports.getTopicsByUnit = async (req, res) => {
  try {
    const { unitId } = req.query;

    if (!unitId) {
      return res.status(400).json({
        success: false,
        message: "unitId is required",
      });
    }

    const topics = await Topic.find({
      unitId,
      isActive: true,
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: topics.length,
      data: topics,
    });
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({ message });
  }
};

// ==============================
// GET Topic by ID
// ==============================
exports.getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).populate("unitId");

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    res.status(200).json({
      success: true,
      data: topic,
    });
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({ message });
  }
};

// ==============================
// CREATE TOPIC
// ==============================
const TOPIC_CREATE_ALLOWLIST = [
  "unitId",
  "name",
  "slug",
  "description",
  "keywords",
  "aliases",
  "concepts",
];

exports.createTopic = async (req, res) => {
  try {
    const topicData = {};
    for (const field of TOPIC_CREATE_ALLOWLIST) {
      if (req.body[field] !== undefined) {
        topicData[field] = req.body[field];
      }
    }

    const topic = await Topic.create(topicData);

    res.status(201).json({
      success: true,
      message: "Topic created successfully",
      data: topic,
    });
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({ message });
  }
};

// ==============================
// UPDATE TOPIC
// ==============================
const TOPIC_UPDATE_ALLOWLIST = [
  "name",
  "slug",
  "description",
  "keywords",
  "aliases",
  "concepts",
];

exports.updateTopic = async (req, res) => {
  try {
    const updates = {};
    for (const field of TOPIC_UPDATE_ALLOWLIST) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const topic = await Topic.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Topic updated successfully",
      data: topic,
    });
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({ message });
  }
};

// ==============================
// DELETE TOPIC
// ==============================
exports.deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Topic deleted successfully",
    });
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({ message });
  }
};