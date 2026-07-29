const express = require('express');
const router = express.Router();
const { getAllSubjects, getSubjectBySlug } = require('../controllers/subjectController');

router.get('/', getAllSubjects);
router.get('/:slug', getSubjectBySlug);

module.exports = router;
