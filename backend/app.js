const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const {
  generalLimiter,
  searchLimiter,
  pdfLimiter,
} = require("./middleware/rateLimiters");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// Trust proxy - the backend runs behind a hosting reverse proxy
app.set("trust proxy", 1);

// Security headers (Helmet defaults).
// HSTS is environment-aware: enabled in production, disabled in development
// so plain-HTTP local development is not broken.
app.use(
  helmet({
    hsts:
      process.env.NODE_ENV === "production"
        ? { maxAge: 15552000, includeSubDomains: false, preload: false }
        : false,
  })
);

// Production frontend origin + development localhost origins
const allowedOrigins = [
  "https://gyandocs.ishandevp.in", // production
  "http://localhost:5173", // Vite dev
  "http://localhost:5174", // Vite dev (alternate)
  process.env.FRONTEND_URL, // overridable production origin
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Reject requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, false);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Reject unknown origins with a clean 403 (no stack trace exposed)
      const err = new Error("Origin not allowed");
      err.status = 403;
      callback(err);
    },
    credentials: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "gyandoc-server" });
});

// General API rate limit: 100 requests / 15 minutes / IP
app.use("/api", generalLimiter);

// Stricter limit for expensive search/question reads
app.use("/api/questions", searchLimiter);
app.use("/api/search", searchLimiter);

// Very strict limit for PDF parse/import (additional layer on top of Firebase auth)
app.use("/api/pdf", pdfLimiter);

app.use("/api/subjects", require("./routes/subjectRoutes"));
app.use('/api/units', require('./routes/unitRoutes'));
app.use('/api/topics', require('./routes/topicRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/pdf', require('./routes/pdfRoutes'));

// 404 handler for unknown API routes.
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// Global error handler: maps known errors to safe messages and logs
// diagnostic detail server-side only. Never exposes stack traces,
// credentials, MongoDB internals, or filesystem paths to clients.
app.use(errorHandler);

module.exports = app;
