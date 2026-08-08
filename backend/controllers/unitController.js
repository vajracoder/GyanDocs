const Unit = require("../models/Unit");

// ==============================
// GET Units by Subject
// ==============================
exports.getUnitsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.query;

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "subjectId is required",
      });
    }

    const units = await Unit.find({
      subjectId,
      isActive: true,
    }).sort({
      unitNumber: 1,
    });

    res.status(200).json({
      success: true,
      count: units.length,
      data: units,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// GET Unit by ID
// ==============================
exports.getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id).populate("subjectId");

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    res.status(200).json({
      success: true,
      data: unit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// CREATE UNIT
// ==============================
exports.createUnit = async (req, res) => {
  try {
    const unit = await Unit.create(req.body);

    res.status(201).json({
      success: true,
      message: "Unit created successfully",
      data: unit,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Unit number already exists for this subject.",
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// UPDATE UNIT
// ==============================
exports.updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Unit updated successfully",
      data: unit,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Unit number already exists for this subject.",
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// DELETE UNIT
// ==============================
exports.deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Unit deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};