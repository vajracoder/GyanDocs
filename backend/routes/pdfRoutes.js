const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { parsePdf, importPdf } = require("../controllers/pdfController");

// ────────────────────────────────────────────────────────────
// Upload directory (temporary processing files only)
// ────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ────────────────────────────────────────────────────────────
// File size limit (configurable via env, default 10 MB)
// ────────────────────────────────────────────────────────────
const pdfMaxSizeMb = Number(process.env.PDF_MAX_SIZE_MB) || 10;
const pdfMaxSizeBytes = pdfMaxSizeMb * 1024 * 1024;

// ────────────────────────────────────────────────────────────
// Disk storage: always generate a safe server-side filename.
// The user-provided original filename is NEVER used as a path.
// ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Random 16-byte hex + fixed .pdf extension.
    // No user input, no path separators, no shell characters.
    const randomName = crypto.randomBytes(16).toString("hex");
    cb(null, `pdf-${randomName}.pdf`);
  },
});

// ────────────────────────────────────────────────────────────
// First-pass filter: reject obvious non-PDF uploads.
// This is NOT the sole validation — the actual PDF signature is
// verified in the controller before parsing.
// ────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExt = file.originalname.toLowerCase().endsWith(".pdf");

  // Accept if MIME or extension indicates PDF. The signature check
  // in the controller is the authoritative validation.
  if (isPdfMime || isPdfExt) {
    cb(null, true);
  } else {
    const err = new Error("Invalid PDF file.");
    err.code = "INVALID_FILE_TYPE";
    cb(err, false);
  }
};

// ────────────────────────────────────────────────────────────
// Multer upload config: field name "pdf"
// ────────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: pdfMaxSizeBytes,
    files: 1,
  },
}).single("pdf");

// ────────────────────────────────────────────────────────────
// POST /api/pdf/parse?subjectId=<id>
// The optional subjectId query param enables automatic
// unit/sub-unit classification of each extracted question.
// ────────────────────────────────────────────────────────────
router.post(
  "/parse",
  authMiddleware,
  adminMiddleware,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        // Clean multer error handling — no stack traces exposed.
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            success: false,
            message: "PDF file is too large.",
          });
        }
        if (err.code === "INVALID_FILE_TYPE") {
          return res.status(400).json({
            success: false,
            message: "Invalid PDF file.",
          });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            success: false,
            message: "Unexpected file field.",
          });
        }
        return res.status(400).json({
          success: false,
          message: "File upload failed.",
        });
      }
      next();
    });
  },
  parsePdf
);

// ────────────────────────────────────────────────────────────
// POST /api/pdf/import
// ────────────────────────────────────────────────────────────
router.post("/import", authMiddleware, adminMiddleware, importPdf);

module.exports = router;