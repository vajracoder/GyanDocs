const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getUnitsBySubject,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
} = require("../controllers/unitController");

// Get Units of a Subject
router.get("/", getUnitsBySubject);

// Get Single Unit
router.get("/:id", getUnitById);

// Create Unit
router.post("/", authMiddleware, adminMiddleware, createUnit);

// Update Unit
router.put("/:id", authMiddleware, adminMiddleware, updateUnit);

// Delete Unit
router.delete("/:id", authMiddleware, adminMiddleware, deleteUnit);

module.exports = router;