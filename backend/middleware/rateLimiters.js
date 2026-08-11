const rateLimit = require("express-rate-limit");

// Shared handler for a clean 429 response.
const handler = (req, res) => {
  res.status(429).json({
    success: false,
    message: "Too many requests. Please try again later.",
  });
};

// General API limiter: 100 requests / 15 minutes / IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Stricter limiter for expensive search/question endpoints: 60 requests / 15 minutes / IP
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Very strict limiter for PDF parse/import: 10 requests / 15 minutes / IP
const pdfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

module.exports = {
  generalLimiter,
  searchLimiter,
  pdfLimiter,
};