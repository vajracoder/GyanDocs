const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");

// Get all subjects
router.get("/", getAllSubjects);

// Get one subject
router.get("/:id", getSubjectById);

// Create subject
router.post("/", authMiddleware, adminMiddleware, createSubject);

// Update subject
router.put("/:id", authMiddleware, adminMiddleware, updateSubject);

// Delete subject
router.delete("/:id", authMiddleware, adminMiddleware, deleteSubject);

module.exports = router;