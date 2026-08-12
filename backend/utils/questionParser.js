/**
 * GyanDocs Question Parser Utility
 * Extracts exam year, individual questions, marks, CO/Level metadata, and sub-questions from raw PDF text.
 *
 * The parser has three stages:
 *   1. Normalize – map raw lines into a clean, ordered list of "content" lines
 *   2. SplitQuestions – detect question boundaries from true question markers
 *   3. CleanEach – remove trailing marks / CO "K" level artefacts from each question
 *
 * Important:
 *   - Metadata such as headers, footers, timestamps, IPs, and exam-paper identifiers are
 *     NEVER allowed to become part of questionText.
 *   - Question detection is based on actual question markers (e.g. "1.", "2.", "a.", "b.",
 *     "Q1.", "Q.1") and not by blindly treating every text chunk as a question.
 *   - Questions that span multiple lines or pages are concatenated into a single questionText.
 */

// ────────────────────────────────────────────────────────────
// YEAR DETECTION (kept from original implementation)
// ────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────
// NORMALIZATION + METADATA STRIPPING
// ────────────────────────────────────────────────────────────

// Patterns that identify exam-paper metadata lines.
// These patterns are NEVER allowed to become part of questionText.
const METADATA_PATTERNS = [
  // Instructions
  /^attempt any\s/i,
  /^attempt all\s/i,
  /^note\s*:/i,
  /^instruction/i,
  /^answer\s+(any|all)\s/i,
  // Marks instructions
  /\d+\s*x\s*=\s*\d+/i,           // "07 x 1 = 07", "07 x 3 = 07"
  // Section headings (SECTION A, SECTION B, ...)
  /^section\s+[a-z]/i,
  // Table headings (Q no. / Question / CO / Level columns)
  /^q\s*no\.?\s+/i,
  /^(q\s*no\.?|question)\s*.*\b(co|level)\b/i,
  /^q\s*no\.?\s*.*\bquestion\b.*\bco\b.*\blevel\b/i,
  // Page / footer identifiers
  /^--\s*\d+\s*of\s*\d+\s*--/i,    // "-- 1 of 3 --", "-- 2 of 3 --"
  /printed\s*page/i,
  /page\s+\d+\s*(of\s+\d+)?/i,
  /^\s*\d+\s*\/\s*\d+\s*$/,
  // Exam / session metadata
  /subject\s*code\s*:/i,
  /btech\s*\(sem/i,
  /theory\s*examination/i,
  /examination\s*202[0-9]/i,
  /semester\s*examination/i,
  /time\s*:\s*\d+/i,
  /total\s*marks\s*:/i,
  /roll\s*no/i,
  /paper\s*id/i,
  /academic\s*session/i,
  /session\s*20[12]\d/i,
  // Timestamps / IPs
  /\b\d{1,2}-[A-Z][a-z]{2}-\d{4}\s+\d{1,2}:\d{2}:\d{2}\s*(AM|PM)\b/i,  // "09-Jan-2025 9:05:30 AM"
  /\d{1,3}(\.\d{1,3}){3}/,          // IP address
  // QP identifiers
  /\bQP[A-Z0-9]+_[0-9]+\b/i,         // "QP25DP1_290"
  /^attached\s*sheet/i,
  /^page\s*\d+/i,
];

// Regex used to strip metadata tokens that may be embedded WITHIN a question line
// (e.g. trailing "-- 1 of 3 -- QP25DP1_290 ..." appended at end of a question).
const EMBEDDED_METADATA_PATTERNS = [
  /--\s*\d+\s*of\s*\d+\s*--/gi,
  /QP[A-Z0-9]+_[0-9]+\s*\|/gi,
  /\|\s*\d{1,2}-[A-Z][a-z]{2}-\d{4}\s+\d{1,2}:\d{2}:\d{2}\s*(AM|PM)\b/gi,
  /\|\s*\d{1,3}(\.\d{1,3}){3}\b/gi,
  /printed\s*page\s*:\s*\d+\s*of\s*\d+/gi,
  /subject\s*code\s*:\s*[A-Z0-9]+/gi,
  /btech\s*\(sem\s*[IVX]+\)\s*theory\s*examination\s*20[0-9]{2}/gi,
  /^--\s*\d+\s*of\s*\d+\s*--/gm,
  /\s+section\s+[a-z]\s*$/gi,
];

// Strong page-break / footer markers. When encountered, we stop appending the
// current question's continuation until a new question marker appears.
const FOOTER_BLOCK_STARTERS = [
  /^--\s*\d+\s*of\s*\d+\s*--/i,
  /printed\s*page/i,
  /^subject\s*code\s*:/i,
  /^btech\s*\(sem/i,
  /\bQP[A-Z0-9]+_[0-9]+\b/i,
  /\b\d{1,3}(\.\d{1,3}){3}\b/,          // IP
  /\b\d{1,2}-[A-Z][a-z]{2}-\d{4}\s+\d{1,2}:\d{2}:\d{2}\s*(AM|PM)\b/i, // timestamp
];

// All-caps heading detection — e.g. "DATABASE MANAGEMENT SYSTEM"
// A line consisting of 3+ ALL-CAPS words, no digits, no question-verbs,
// is likely a repeated subject/heading footer.
const ALL_CAPS_QUESTION_VERBS = /^(explain|discuss|describe|define|consider|determine|identify|justify|write|list|what|why|how)\b/i;

const isAllCapsHeading = (line) => {
  const trimmed = (line || "").trim();
  if (!trimmed) return false;
  if (/\d/.test(trimmed)) return false;

  // Must be 3+ words of ALL-CAPS letters
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  for (const w of words) {
    // Allow "&", hyphenated, or letters. Must be alphabetic-only words.
    const cleaned = w.replace(/[^A-Za-z]/g, "");
    if (!cleaned) return false;
    if (cleaned !== cleaned.toUpperCase()) return false;
  }
  // Exclude question-verb starting lines
  if (ALL_CAPS_QUESTION_VERBS.test(trimmed)) return false;
  // Exclude lines that are CO/Level values
  if (/^(CO|K)[0-9]+$/i.test(trimmed)) return false;

  return true;
};

/**
 * Detect whether a line is exam metadata / header / footer / instruction.
 * Returns `true` if the line should be completely discarded.
 */
const isMetadataLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed) return true;

  const l = trimmed.toLowerCase();

  // Explicit metadata patterns
  for (const re of METADATA_PATTERNS) {
    if (re.test(trimmed)) return true;
  }

  // Table header: "Q no. Question CO Level" or variations
  if (/^q\s*no/i.test(l) && /\bquestion\b/i.test(l)) return true;
  if (/^q\s*no/i.test(l) && /\bco\b/i.test(l)) return true;
  if (l.startsWith("q no.")) return true;
  if (l.startsWith("question") && /^\s*(co|level)$/i.test(l.replace(/^question\s*/i, ""))) return true;
  if (/^\s*(co|level)\s*$/.test(trimmed)) return true;

  // All-caps heading (subject name footer/header)
  if (isAllCapsHeading(trimmed)) return true;

  // Generic page markers
  if (/^\d+\s*$/.test(trimmed) && trimmed.length <= 4) return true;

  return false;
};

/**
 * Remove embedded metadata tokens from a string that contains a real question.
 * E.g. trailing "-- 1 of 3 -- QP25DP1_290 | 09-Jan-2025 9:05:30 AM | 117.55.242.132"
 */
const stripEmbeddedMetadata = (text) => {
  let out = text;
  for (const re of EMBEDDED_METADATA_PATTERNS) {
    out = out.replace(re, " ");
  }
  // Remove any remaining pipe-separated metadata
  // e.g. "QP25DP1_290 | 09-Jan-2025 9:05:30 AM | 117.55.242.132"
  out = out.replace(
    /\bQP[A-Z0-9]+_[0-9]+\s*\|.*$/i,
    " "
  );
  // Remove a lone trailing "Printed Page:" remnant
  out = out.replace(/\bprinted\s+page\s*:\s*\d+.*$/i, " ");
  return out;
};

// ────────────────────────────────────────────────────────────
// MARKS, CO, LEVEL EXTRACTION HELPERS
// ────────────────────────────────────────────────────────────

/**
 * Extract trailing marks in common formats:
 *   "07 x 1 = 07"
 *   "[10]"
 *   "(10 Marks)"
 *   "10 Marks"
 *   "1 K2"  → marks=1, CO=1, Level=K2
 *   "5 K2"  → marks=5, CO=5, Level=K2
 * Returns { mark, co, level } or null if not detectable.
 */
const extractTrailingMeta = (str) => {
  const s = str.trim();
  let mark = null;
  let co = null;
  let level = null;

  // Pattern: trailing "<number> K<digit>"
  // e.g. "Explain Joins? Discuss all types ... 2 K2" → mark=2, co=2, level=K2
  let m = s.match(/(?:^|\s)(\d{1,2})\s+K\s*(\d)\s*$/i);
  if (m) {
    mark = parseInt(m[1], 10);
    co = parseInt(m[2], 10);
    level = `K${m[2]}`;
    return { mark, co, level };
  }

  // Pattern: trailing "<number> <number>" e.g. "2 1" → marks=2, CO=1
  // AKTU-style two-number trailing metadata. Only recognized when the two
  // numbers follow a sentence terminator (".", "?", "!") — i.e. they are
  // clearly trailing metadata, NOT part of the question content.
  // e.g. "What is the concept of keys in database? 2 1" → marks=2, co=1
  // but "Analyze ... relation 1 2 1 3" → "1 3" is NOT stripped (no terminator).
  m = s.match(/([.?!])\s*(\d{1,2})\s+(\d{1,2})\s*$/);
  if (m) {
    mark = parseInt(m[2], 10);
    co = parseInt(m[3], 10);
    return { mark, co, level };
  }

  // Pattern: trailing "<number> <marks>" e.g. "10 Marks"
  m = s.match(/(?:^|\s)(\d{1,2})\s*marks?\s*$/i);
  if (m) {
    mark = parseInt(m[1], 10);
    return { mark, co, level };
  }

  // Pattern: [10] or (10 Marks) or [CO1/10]
  m = s.match(/\[\s*(?:CO\d+\/)?(\d{1,2})\s*(?:marks?)?\s*\]/i);
  if (m) {
    mark = parseInt(m[1], 10);
    const coMatch = s.match(/CO\s*(\d+)/i);
    if (coMatch) co = parseInt(coMatch[1], 10);
    return { mark, co, level };
  }
  m = s.match(/\(\s*(\d{1,2})\s*(?:marks?)?\s*\)/i);
  if (m) {
    mark = parseInt(m[1], 10);
    return { mark, co, level };
  }

  return { mark, co, level };
};

/**
 * Remove marks / CO / Level artefacts from the text.
 * Preserves the trailing period of a question sentence.
 */
const cleanTrailingMeta = (text) => {
  let out = text.trim();
  // "2 K2" at end
  out = out.replace(/(?:^|\s)\d{1,2}\s+K\s*\d\s*$/i, "");
  // "2 1" at end (two-number marks CO) — only when preceded by a sentence
  // terminator so question content like "relation 1 2 1 3" is preserved.
  out = out.replace(/([.?!])\s*\d{1,2}\s+\d{1,2}\s*$/, "$1");
  // "10 Marks" at end
  out = out.replace(/(?:^|\s)\d{1,2}\s*marks?\s*$/i, "");
  // "[10]" or "[CO1/10]" anywhere
  out = out.replace(/\[\s*(?:CO\d+\/)?\d{1,2}\s*(?:marks?)?\s*\]/gi, "");
  // "(10 Marks)"
  out = out.replace(/\(\s*\d{1,2}\s*(?:marks?)?\s*\)/gi, "");
  // "CO2" at end
  out = out.replace(/\s*CO\s*\d+\s*$/i, "");
  // "K2" at end (level)
  out = out.replace(/\s*K\s*\d\s*$/i, "");

  // Repeat maybe twice in case something like "1 K2" remains after another removal
  out = out.replace(/(?:^|\s)\d{1,2}\s+K\s*\d\s*$/i, "");

  // Collapse whitespace
  out = out.replace(/\s+/g, " ").trim();

  return out;
};

// ────────────────────────────────────────────────────────────
// QUESTION START DETECTION
// ────────────────────────────────────────────────────────────

/**
 * Detect question-start markers.
 * Supported:
 *   numbered:  "1.", "1)", "1:", "Q1.", "Q.1", "Q1:", "Question 1:"
 *   lettered:  "a.", "a)", "(a)", "b.", "(b)"
 *
 * Returns `{ label, rest }` if this line begins a new question, else `null`.
 */
const matchQuestionStart = (line) => {
  const trimmed = line.trim();

  // Numbered: 1. 1) 1: Q1. Q.1 Q1: Question 1:
  let m = trimmed.match(/^(?:Q(?:uestion)?[\.\s]*([0-9]{1,2})[\:\.]?|([0-9]{1,2})[\.\)])\s*(.*)/i);
  if (m) {
    const label = m[1] || m[2];
    return { label, rest: m[3] || "" };
  }

  // Lettered sub-question: a. a) a: (a) (a) Question b. ... z.
  // Full alphabet — real exam papers commonly use a. through j. (or more).
  m = trimmed.match(/^\(?([a-z])\)?\s*[\.\-:]\s*(.*)/i);
  if (m) {
    const label = m[1].toLowerCase();
    return { label, rest: m[2] || "" };
  }

  // Parenthesized lettered marker followed directly by whitespace:
  // "(a) Define candidate key..." — the ")" is followed by a space, not a
  // separator, so the regex above does not match. Handle it explicitly.
  m = trimmed.match(/^\(([a-z])\)\s+(.*)/i);
  if (m) {
    const label = m[1].toLowerCase();
    return { label, rest: m[2] || "" };
  }

  return null;
};

// ────────────────────────────────────────────────────────────
// MAIN PARSER
// ────────────────────────────────────────────────────────────

/**
 * Extract numbered & lettered questions, multi-line continuations, marks, CO, Level.
 */
const parseQuestions = (rawText) => {
  if (!rawText) return [];

  // 1. Split into raw lines
  const rawLines = rawText.split(/\r?\n/);

  // 2. Normalize whitespace per line
  const normalizedLines = rawLines.map((l) => l.replace(/\s+/g, " ").trim());

  // 3. Detect & remove duplicated consecutive lines (PDF extraction artifact)
  const dedupedLines = [];
  for (const line of normalizedLines) {
    const prev = dedupedLines[dedupedLines.length - 1] || "";
    if (line && line.toLowerCase() === prev.toLowerCase()) {
      continue; // skip duplicate
    }
    dedupedLines.push(line);
  }

  // 4. Classify lines into "content" vs "metadata" by examining the whole set first.
  const lines = dedupedLines.filter((l) => l.length > 0).filter((l) => !isMetadataLine(l));

  // Strip embedded metadata from each remaining line (e.g. page footers).
  const cleanedLines = lines.map((l) => stripEmbeddedMetadata(l))
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 0);

  const questions = [];
  let current = null;
  let inFooterBlock = false;

  /**
   * Finish the current question and push it if it looks like a real question.
   */
  const flush = () => {
    if (!current) return;
    const cleanText = cleanTrailingMeta(current.text);
    if (cleanText.length > 5) {
      questions.push({
        questionNumber: current.label,
        questionText: cleanText,
        marks: current.mark,
        confidence: current.confidence,
        co: current.co,
        level: current.level,
        subQuestions: current.subQuestions,
      });
    }
    current = null;
  };

  for (let i = 0; i < cleanedLines.length; i++) {
    const line = cleanedLines[i];

    // Detect footer-block start (page break / metadata footer)
    const isFooterStart = FOOTER_BLOCK_STARTERS.some((re) => re.test(line));
    if (isFooterStart) {
      inFooterBlock = true;
      continue;
    }

    // If we're in a footer block, only a new question marker exits it.
    if (inFooterBlock) {
      const start = matchQuestionStart(line);
      if (start && start.label) {
        inFooterBlock = false;
        // Fall through to process this line as a new question start.
      } else {
        continue; // still in footer block, skip this line
      }
    }

    const start = matchQuestionStart(line);

    if (start && start.label) {
      // This line begins a new question.

      // If it's a lettered item and we already have an active question whose text
      // is substantial, treat it as a sub-question belonging to the current question.
      const isLettered = /^[a-z]$/i.test(start.label);
      if (isLettered && current && current.text.trim().length > 20 && !current.startedWithLetter) {
        // Sub-question
        const subText = cleanTrailingMeta(start.rest);
        current.subQuestions.push({
          label: start.label.toLowerCase(),
          questionText: subText,
        });
        current.text += ` (${start.label.toLowerCase()}) ${subText}`;
        // Check sub-line for marks / CO / Level
        const subMeta = extractTrailingMeta(start.rest);
        if (subMeta.mark && !current.mark) {
          current.mark = subMeta.mark;
        }
        if (subMeta.co && !current.co) current.co = subMeta.co;
        if (subMeta.level && !current.level) current.level = subMeta.level;
        continue;
      }

      // Otherwise it's a new question.
      flush();

      const meta = extractTrailingMeta(start.rest);
      current = {
        label: start.label,
        text: start.rest,
        mark: meta.mark || null,
        co: meta.co || null,
        level: meta.level || null,
        confidence: meta.mark ? 0.95 : 0.88,
        subQuestions: [],
        startedWithLetter: isLettered,
      };
      continue;
    }

    // Continuation line of an existing question.
    if (current) {
      // Try to extract trailing marks / CO / Level from a continuation line.
      const meta = extractTrailingMeta(line);
      const cleanedContinuation = cleanTrailingMeta(line);

      // Always apply marks/CO/Level, even if the continuation is a pure
      // metadata line like "3 K4" (marks on its own line).
      if (meta.mark && !current.mark) current.mark = meta.mark;
      if (meta.co && !current.co) current.co = meta.co;
      if (meta.level && !current.level) current.level = meta.level;

      if (cleanedContinuation && cleanedContinuation.length > 0) {
        current.text += ` ${cleanedContinuation}`;
      }
      continue;
    }

    // No active question and this line is not a question start and not metadata.
    // Skip — do NOT treat arbitrary text as a question (that's the old bug).
  }

  flush();

  // ── Fallback ─────────────────────────────────────────────
  // If we found zero questions, the PDF may be a simple list of questions
  // without any markers. In that case, do a paragraph-based fallback that
  // still strips metadata.
  // IMPORTANT: Even the fallback must NOT turn arbitrary chunks into questions.
  if (questions.length === 0) {
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => {
        let out = stripEmbeddedMetadata(p);
        out = cleanTrailingMeta(out);
        out = out.replace(/\s+/g, " ").trim();
        return out;
      })
      .filter((p) => p.length > 15 && !isMetadataLine(p));

    for (const p of paragraphs) {
      const meta = extractTrailingMeta(p);
      questions.push({
        questionNumber: String(questions.length + 1),
        questionText: cleanTrailingMeta(p),
        marks: meta.mark || null,
        confidence: 0.70, // lower confidence for fallback detection
        co: meta.co || null,
        level: meta.level || null,
        subQuestions: [],
      });
    }
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
  // Expose helpers for testing
  _internal: {
    isMetadataLine,
    stripEmbeddedMetadata,
    extractTrailingMeta,
    cleanTrailingMeta,
    matchQuestionStart,
  },
};