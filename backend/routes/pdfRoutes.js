const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { parsePdf, importPdf } = require("../controllers/pdfController");

// Ensure temporary uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage for temporary file processing
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `pdf-${uniqueSuffix}${ext}`);
  },
});

// Filter to accept only PDF files
const fileFilter = (req, file, cb) => {
  const isPdf =
    file.mimetype === "application/pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    cb(null, true);
  } else {
    const err = new Error("Only PDF files are allowed.");
    err.code = "INVALID_FILE_TYPE";
    cb(err, false);
  }
};

// Multer upload config: 20 MB max file size, field name "pdf"
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB limit
  },
}).single("pdf");

// POST /api/pdf/parse
router.post(
  "/parse",
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File size exceeds the 20 MB limit.",
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed.",
        });
      }
      next();
    });
  },
  parsePdf
);

// POST /api/pdf/import
router.post("/import", importPdf);

module.exports = router;
