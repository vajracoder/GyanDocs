/**
 * GyanDocs Question Parser Utility
 * Extracts exam year, individual questions, marks, and sub-questions from raw PDF text.
 */

/**
 * Detects exam year from PDF header text
 * Supports formats like: 2025, 2024, 2023, 2024-25, 2023-24
 * Returns 4-digit Year number or null if not detected.
 */
const parseYear = (rawText) => {
  if (!rawText) return null;

  // Inspect header sample (first 1500 chars)
  const headerSample = rawText.slice(0, 1500);

  // Pattern 1: Session / Semester range like 2024-25 or 2024-2025
  const acadMatch = headerSample.match(
    /(?:examination|session|semester|sem|year|paper|held in|aktu|b\.?tech)?.*?\b(20[1-3]\d)[-–/](20)?([1-3]\d)\b/i
  );
  if (acadMatch) {
    const startYear = parseInt(acadMatch[1], 10);
    const endPart = parseInt(acadMatch[3], 10);
    if (endPart < 100) {
      return Math.floor(startYear / 100) * 100 + endPart;
    }
    return endPart;
  }

  // Pattern 2: Standalone 4-digit year in header (2015 to 2030)
  const years = [];
  const singleYearRegex = /\b(20[1-3]\d)\b/g;
  let m;
  while ((m = singleYearRegex.exec(headerSample)) !== null) {
    const y = parseInt(m[1], 10);
    if (y >= 2015 && y <= 2030) {
      years.push(y);
    }
  }

  if (years.length > 0) {
    return Math.max(...years);
  }

  return null;
};

/**
 * Extracts numbered questions, multi-line continuations, sub-questions, and marks.
 */
const parseQuestions = (rawText) => {
  if (!rawText) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions = [];
  let currentQuestion = null;

  // Regex matching question start: "1.", "1)", "Q1.", "Q.1", "Q1:", "Question 1:"
  const qStartRegex = /^(?:Q(?:uestion)?[\.\s]*([0-9]{1,2})[\:\.]?|([0-9]{1,2})[\.\)])\s+(.*)/i;

  const isNoiseLine = (line) => {
    const l = line.toLowerCase();
    return (
      l.startsWith("page ") ||
      l.includes("printed pages") ||
      l.includes("roll no") ||
      l.includes("paper id") ||
      l.includes("time:") ||
      l.includes("total marks") ||
      l.includes("attempt all") ||
      l.includes("section -") ||
      l.includes("section a") ||
      l.includes("section b") ||
      l.includes("section c") ||
      l.includes("b.tech") ||
      l.includes("semester examination")
    );
  };

  const extractMarks = (str) => {
    let m = str.match(/\[\s*(?:CO\d+\/)?(\d{1,2})\s*(?:marks?)?\s*\]/i);
    if (m) return parseInt(m[1], 10);

    m = str.match(/\(\s*(\d{1,2})\s*(?:marks?)?\s*\)/i);
    if (m) return parseInt(m[1], 10);

    m = str.match(/\b(\d{1,2})\s*marks?\b/i);
    if (m) return parseInt(m[1], 10);

    return null;
  };

  const cleanText = (text) => {
    return text
      .replace(/\[\s*(?:CO\d+\/)?\d{1,2}\s*(?:marks?)?\s*\]/gi, "")
      .replace(/\(\s*\d{1,2}\s*(?:marks?)?\s*\)/gi, "")
      .replace(/\b\d{1,2}\s*marks?\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isNoiseLine(line)) {
      continue;
    }

    const matchQ = line.match(qStartRegex);
    if (matchQ) {
      if (currentQuestion) {
        currentQuestion.questionText = cleanText(currentQuestion.questionText);
        if (currentQuestion.questionText.length > 5) {
          questions.push(currentQuestion);
        }
      }

      const qNum = matchQ[1] || matchQ[2];
      const restOfLine = matchQ[3] || "";
      const marks = extractMarks(line);

      currentQuestion = {
        questionNumber: qNum,
        questionText: restOfLine,
        marks,
        confidence: marks ? 0.95 : 0.88,
        subQuestions: [],
      };
    } else if (currentQuestion) {
      const subMatch = line.match(/^(?:\(([a-d])\)|([a-d])\))\s+(.*)/i);
      if (subMatch) {
        const subLabel = subMatch[1] || subMatch[2];
        const subText = subMatch[3] || "";
        currentQuestion.subQuestions.push({
          label: subLabel.toLowerCase(),
          questionText: cleanText(subText),
        });
        currentQuestion.questionText += ` (${subLabel}) ${subText}`;
      } else {
        currentQuestion.questionText += ` ${line}`;
        if (!currentQuestion.marks) {
          const m = extractMarks(line);
          if (m) {
            currentQuestion.marks = m;
            currentQuestion.confidence = 0.95;
          }
        }
      }
    }
  }

  if (currentQuestion) {
    currentQuestion.questionText = cleanText(currentQuestion.questionText);
    if (currentQuestion.questionText.length > 5) {
      questions.push(currentQuestion);
    }
  }

  // Fallback: If no regex matches were found, split paragraphs
  if (questions.length === 0) {
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => cleanText(p))
      .filter((p) => p.length > 15 && !isNoiseLine(p));

    paragraphs.forEach((p, idx) => {
      questions.push({
        questionNumber: String(idx + 1),
        questionText: p,
        marks: extractMarks(p),
        confidence: 0.70,
        subQuestions: [],
      });
    });
  }

  return questions;
};

/**
 * Main parser entry point
 */
const parsePdfText = (rawText) => {
  const detectedYear = parseYear(rawText);
  const questions = parseQuestions(rawText);

  return {
    detectedYear,
    questions,
  };
};

module.exports = {
  parseYear,
  parseQuestions,
  parsePdfText,
};
