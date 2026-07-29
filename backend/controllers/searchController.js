const Question = require('../models/Question');

exports.searchQuestions = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    const unitMatch = q.match(/unit\s*0*(\d+)/i);
    const regex = new RegExp(q, 'i');

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
    res.status(500).json({ message: error.message });
  }
};
