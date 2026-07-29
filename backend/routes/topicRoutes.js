const express = require('express');
const router = express.Router();
const { getTopicsByUnit, getTopicBySlug } = require('../controllers/topicController');

router.get('/:subjectSlug/:unitSlug', getTopicsByUnit);
router.get('/:subjectSlug/:unitSlug/:topicSlug', getTopicBySlug);

module.exports = router;
