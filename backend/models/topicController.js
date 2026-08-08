const Topic = require("../models/Topic");

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
    }).sort({
      name: 1,
    });

    res.status(200).json({
      success: true,
      count: topics.length,
      data: topics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// CREATE Topic
// ==============================
exports.createTopic = async (req, res) => {
  try {
    const topic = await Topic.create(req.body);

    res.status(201).json({
      success: true,
      message: "Topic created successfully",
      data: topic,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};