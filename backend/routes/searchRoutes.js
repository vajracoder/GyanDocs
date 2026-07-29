const express = require('express');
const router = express.Router();
const { searchQuestions } = require('../controllers/searchController');

router.get('/', searchQuestions);

module.exports = router;
