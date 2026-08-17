const Question = require('../models/Question');
const { normalizeError } = require('../middleware/errorHandler');
const { escapeRegex, MAX_SEARCH_LENGTH } = require('../utils/queryValidation');

/**
 * Search questions with optional filters:
 *   ?q=text            — free-text search on questionText
 *   ?subjectId=...     — filter by subject
 *   ?unitId=...        — filter by unit
 *   ?topicId=...       — filter by sub-unit (topic)
 *   ?year=2025         — filter by year
 *
 * Returns questions populated with subject, unit, and topic (sub-unit).
 */
exports.searchQuestions = async (req, res) => {
  try {
    const { q, subjectId, unitId, topicId, year, marks, co, level } = req.query;

    const filter = { isActive: true };

    // ── Free-text search on questionText ─────────────────────
    if (q) {
      const query = String(q).trim();
      if (query.length > MAX_SEARCH_LENGTH) {
        return res.status(400).json({ message: 'Search query is too long.' });
      }
      if (query) {
        // Treat user input as literal text — never as an executable regex pattern.
        filter.questionText = { $regex: escapeRegex(query), $options: "i" };
      }
    }

    // ── Subject filter ───────────────────────────────────────
    if (subjectId) {
      filter.subjectId = subjectId;
    }

    // ── Unit filter ──────────────────────────────────────────
    if (unitId) {
      filter.unitId = unitId;
    }

    // ── Sub-unit (topic) filter ──────────────────────────────
    if (topicId) {
      filter.topicId = topicId;
    }

    // ── Year filter ──────────────────────────────────────────
    if (year) {
      const y = Number(year);
      if (!isNaN(y) && y > 1900 && y < 2100) {
        filter.years = y;
      }
    }

    // ── Marks filter ─────────────────────────────────────────
    if (marks) {
      const m = Number(marks);
      if (!isNaN(m) && m > 0 && m <= 100) {
        filter.marks = m;
      }
    }

    // ── CO filter ────────────────────────────────────────────
    if (co) {
      const c = Number(co);
      if (!isNaN(c) && c >= 1 && c <= 10) {
        filter.co = c;
      }
    }

    // ── Level filter ─────────────────────────────────────────
    if (level) {
      const l = String(level).toUpperCase();
      if (/^K[1-6]$/.test(l)) {
        filter.level = l;
      }
    }

    const results = await Question.find(filter)
      .populate('subjectId', 'name code shortName slug semester')
      .populate('unitId', 'name unitNumber slug')
      .populate('topicId', 'name slug')
      .sort({ priority: -1, createdAt: -1 });

    res.json(results);
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({ message });
  }
};