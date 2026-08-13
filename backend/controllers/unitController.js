const Unit = require("../models/Unit");
const Topic = require("../models/Topic");
const { normalizeError } = require("../middleware/errorHandler");

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

    // Attach topics (sub-units) to each unit so the admin UI can
    // offer sub-unit selection during PDF import review.
    const unitIds = units.map((u) => u._id);
    const topics = await Topic.find({ unitId: { $in: unitIds }, isActive: true }).sort({ name: 1 });

    const unitsWithTopics = units.map((u) => ({
      ...u.toObject(),
      topics: topics.filter((t) => t.unitId.toString() === u._id.toString()),
    }));

    res.status(200).json({
      success: true,
      count: unitsWithTopics.length,
      data: unitsWithTopics,
    });
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({
      success: false,
      message,
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
    const { status, message } = normalizeError(error);
    res.status(status).json({
      success: false,
      message,
    });
  }
};

// ==============================
// CREATE UNIT
// ==============================
// Explicit allowlist for create. subjectId is required at creation time
// (the admin UI selects the parent subject); system/derived fields are
// never accepted from the client.
const UNIT_CREATE_ALLOWLIST = [
  "subjectId",
  "unitNumber",
  "name",
  "slug",
  "description",
];

// ==============================
// UPDATE UNIT
// ==============================
// The admin UI deliberately does NOT expose subjectId on edit, so it is
// excluded here. Only unitNumber, name, slug, and description are editable.
const UNIT_UPDATE_ALLOWLIST = ["unitNumber", "name", "slug", "description"];

exports.createUnit = async (req, res) => {
  try {
    const unitData = {};
    for (const field of UNIT_CREATE_ALLOWLIST) {
      if (req.body[field] !== undefined) {
        unitData[field] = req.body[field];
      }
    }

    const unit = await Unit.create(unitData);

    res.status(201).json({
      success: true,
      message: "Unit created successfully",
      data: unit,
    });
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({
      success: false,
      message,
    });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const updates = {};
    for (const field of UNIT_UPDATE_ALLOWLIST) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      updates,
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
    const { status, message } = normalizeError(error);
    res.status(status).json({
      success: false,
      message,
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
    const { status, message } = normalizeError(error);
    res.status(status).json({
      success: false,
      message,
    });
  }
};
