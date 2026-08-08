const express = require("express");
const router = express.Router();

const {
  getTopicsByUnit,
  getTopicById,
  createTopic,
} = require("../controllers/topicController");

// Get all topics of a unit
router.get("/", getTopicsByUnit);

// Get single topic
router.get("/:id", getTopicById);

// Create topic
router.post("/", createTopic);

module.exports = router;