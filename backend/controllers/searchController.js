const Question = require('../models/Question');
const { normalizeError } = require('../middleware/errorHandler');
const { escapeRegex, MAX_SEARCH_LENGTH } = require('../utils/queryValidation');

exports.searchQuestions = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    if (q.length > MAX_SEARCH_LENGTH) {
      return res.status(400).json({ message: 'Search query is too long.' });
    }

    const unitMatch = q.match(/unit\s*0*(\d+)/i);
    // Treat user input as literal text — never as an executable regex pattern.
    const regex = new RegExp(escapeRegex(q), 'i');

    const orConditions = [
      { topicName: regex },
      { subjectName: regex },
      { unitName: regex },
      { question: regex },
    ];
    if (unitMatch) orConditions.push({ unitNumber: Number(unitMatch[1]) });

    const results = await Question.find({ $or: orConditions });

    const scored = results.map((item) => {
      let score = 0;
      if (unitMatch && item.unitNumber === Number(unitMatch[1])) score += 5;
      if (regex.test(item.topicName)) score += 4;
      if (regex.test(item.subjectName)) score += 2;
      if (regex.test(item.unitName)) score += 2;
      if (regex.test(item.question)) score += 1;
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score || b.item.frequency - a.item.frequency);
    res.json(scored.map((s) => s.item));
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({ message });
  }
};
