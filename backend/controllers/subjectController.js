const Subject = require("../models/Subject");
const Unit = require("../models/Unit");
const Question = require("../models/Question");
const { normalizeError } = require("../middleware/errorHandler");

// ==============================
// GET ALL SUBJECTS
// ==============================
exports.getAllSubjects = async (req, res) => {
  try {
    const { semester } = req.query;

    const filter = {};

    if (semester) {
      filter.semester = Number(semester);
    }

    const subjects = await Subject.find(filter).sort({
      semester: 1,
      name: 1,
    });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
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
// GET SUBJECT BY ID
// ==============================
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.status(200).json({
      success: true,
      data: subject,
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
// CREATE SUBJECT
// ==============================
exports.createSubject = async (req, res) => {
  try {
    const {
      semester,
      name,
      shortName,
      code,
      slug,
      description,
    } = req.body;

    const subject = await Subject.create({
      semester,
      name,
      shortName,
      code,
      slug,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
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
// UPDATE SUBJECT
// ==============================
// Explicit allowlist of fields the admin UI may edit.
// System/derived fields (_id, isActive, counters, timestamps) are never accepted.
const SUBJECT_UPDATE_ALLOWLIST = [
  "semester",
  "name",
  "shortName",
  "code",
  "slug",
  "description",
];

exports.updateSubject = async (req, res) => {
  try {
    // Build a sanitized update object: only allowlisted fields are read from req.body.
    // Undefined optional fields are skipped so partial updates keep working.
    const updates = {};
    for (const field of SUBJECT_UPDATE_ALLOWLIST) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: subject,
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
// DELETE SUBJECT
// ==============================
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // A subject is permanently deleted, so remove its dependent academic data
    // first to avoid leaving Units or Questions without a parent subject.
    const [questionsResult, unitsResult] = await Promise.all([
      Question.deleteMany({ subjectId: subject._id }),
      Unit.deleteMany({ subjectId: subject._id }),
    ]);

    await Subject.deleteOne({ _id: subject._id });

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
      deleted: {
        questions: questionsResult.deletedCount,
        units: unitsResult.deletedCount,
      },
    });
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({
      success: false,
      message,
    });
  }
};
