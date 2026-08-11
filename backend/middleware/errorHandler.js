/**
 * Centralized error handler.
 * Maps known error types to safe client messages while logging useful
 * diagnostic detail server-side only.
 */

const isObjectIdError = (err) =>
  err && (err.name === "CastError" || err.kind === "ObjectId");

const isValidationError = (err) =>
  err && err.name === "ValidationError";

const isDuplicateKeyError = (err) =>
  err && err.code === 11000;

/**
 * Derive a safe HTTP status + message from a thrown error.
 * Returns { status, message }.
 */
const normalizeError = (err) => {
  if (err && typeof err.status === "number") {
    // Preserve explicit status codes (403 CORS, 401/403 auth, 429 rate-limit, 413 too large)
    return { status: err.status, message: err.message || "Request failed." };
  }

  if (isDuplicateKeyError(err)) {
    return { status: 409, message: "Resource already exists." };
  }

  if (isValidationError(err)) {
    return { status: 400, message: "Invalid request data." };
  }

  if (isObjectIdError(err)) {
    return { status: 400, message: "Invalid resource ID." };
  }

  return { status: 500, message: "Something went wrong. Please try again later." };
};

/**
 * Express error middleware. Must be the last middleware in the chain.
 */
const errorHandler = (err, req, res, next) => {
  // Log safe diagnostic detail server-side only. Never log credentials,
  // tokens, passwords, Authorization headers, or full request bodies.
  if (err) {
    console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err.message);
  }

  const { status, message } = normalizeError(err);

  res.status(status).json({
    success: false,
    message,
  });
};

module.exports = {
  errorHandler,
  normalizeError,
};