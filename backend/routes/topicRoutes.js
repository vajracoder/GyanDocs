const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  getTopicsByUnit,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
} = require('../controllers/topicController');

// GET topics by unit (?unitId=...)
router.get('/', getTopicsByUnit);

// GET single topic by ID
router.get('/:id', getTopicById);

// POST create topic
router.post('/', authMiddleware, adminMiddleware, createTopic);

// PUT update topic
router.put('/:id', authMiddleware, adminMiddleware, updateTopic);

// DELETE topic
router.delete('/:id', authMiddleware, adminMiddleware, deleteTopic);

module.exports = router;