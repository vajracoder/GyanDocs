const express = require('express');
const router = express.Router();
const { getQuestionsByTopic, getQuestionById } = require('../controllers/questionController');

router.get('/:subjectSlug/:unitSlug/:topicSlug', getQuestionsByTopic);
router.get('/id/:id', getQuestionById);

module.exports = router;
