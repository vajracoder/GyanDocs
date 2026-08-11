const mongoose = require("mongoose");

// Maximum search string length (ReDoS / resource protection)
const MAX_SEARCH_LENGTH = 100;

// Valid questionType values from the Question model schema
const VALID_QUESTION_TYPES = ["theory", "numerical", "mcq"];

// Valid priority range (derived from priorityHelper: 1-5)
const VALID_PRIORITY_MIN = 1;
const VALID_PRIORITY_MAX = 5;

// Valid year range (consistent with Question model and application logic)
const VALID_YEAR_MIN = 1900;
const VALID_YEAR_MAX = 2100;

/**
 * Escape user input so it is treated as literal text, not a regex pattern.
 * Prevents ReDoS via user-supplied constructs like "(a+)+" or ".*".
 */
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validate that a value is a plain string (not an object/array from query
 * parameter injection) and not empty.
 */
function isPlainString(value) {
  return typeof value === "string" && value.length > 0;
}

/**
 * Validate a MongoDB ObjectId. Rejects malformed IDs and query-object
 * injection attempts (e.g. ?subjectId[$ne]=...).
 * Returns { valid, value }.
 */
function validateObjectId(value, label) {
  if (!isPlainString(value) || !mongoose.Types.ObjectId.isValid(value)) {
    return { valid: false, error: `Invalid ${label}.` };
  }
  return { valid: true, value };
}

/**
 * Validate a numeric filter (year/priority). Rejects objects, arrays,
 * non-numeric strings, and out-of-range integers.
 * Returns { valid, value }.
 */
function validateInteger(value, label, min, max) {
  if (!isPlainString(value) || !/^\d+$/.test(value)) {
    return { valid: false, error: `Invalid ${label}.` };
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    return { valid: false, error: `Invalid ${label}.` };
  }
  return { valid: true, value: num };
}

/**
 * Validate the search query parameter.
 * Rejects non-strings, empty-after-trim, and over-length input.
 * Returns { valid, value } where value is the trimmed literal string.
 */
function validateSearch(value) {
  // Empty string is valid (means "no search"). Non-string values
  // (objects/arrays from query injection) are rejected.
  if (typeof value !== "string") {
    return { valid: false, error: "Invalid search query." };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: true, value: "" };
  }
  if (trimmed.length > MAX_SEARCH_LENGTH) {
    return { valid: false, error: "Search query is too long." };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validate questionType against the allowed enum.
 */
function validateQuestionType(value) {
  if (!isPlainString(value)) {
    return { valid: false, error: "Invalid question type." };
  }
  if (!VALID_QUESTION_TYPES.includes(value)) {
    return { valid: false, error: "Invalid question type." };
  }
  return { valid: true, value };
}

module.exports = {
  MAX_SEARCH_LENGTH,
  VALID_QUESTION_TYPES,
  escapeRegex,
  isPlainString,
  validateObjectId,
  validateInteger,
  validateSearch,
  validateQuestionType,
  VALID_PRIORITY_MIN,
  VALID_PRIORITY_MAX,
  VALID_YEAR_MIN,
  VALID_YEAR_MAX,
};