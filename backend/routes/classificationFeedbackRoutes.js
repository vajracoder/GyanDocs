const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  createFeedback,
  getFeedback,
  deleteFeedback,
} = require("../controllers/classificationFeedbackController");

// POST /api/feedback — record an admin correction
router.post("/", authMiddleware, adminMiddleware, createFeedback);

// GET /api/feedback — list recorded feedback (admin)
router.get("/", authMiddleware, adminMiddleware, getFeedback);

// DELETE /api/feedback/:id
router.delete("/:id", authMiddleware, adminMiddleware, deleteFeedback);

module.exports = router;