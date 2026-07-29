const express = require('express');
const router = express.Router();
const { getUnitsBySubject, getUnitBySlug } = require('../controllers/unitController');

router.get('/:subjectSlug', getUnitsBySubject);
router.get('/:subjectSlug/:unitSlug', getUnitBySlug);

module.exports = router;
