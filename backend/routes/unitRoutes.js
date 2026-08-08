const express = require("express");
const router = express.Router();

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
router.post("/", createUnit);

// Update Unit
router.put("/:id", updateUnit);

// Delete Unit
router.delete("/:id", deleteUnit);

module.exports = router;