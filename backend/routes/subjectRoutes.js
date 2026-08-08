const express = require("express");
const router = express.Router();

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
router.post("/", createSubject);

// Update subject
router.put("/:id", updateSubject);

// Delete subject
router.delete("/:id", deleteSubject);

module.exports = router;