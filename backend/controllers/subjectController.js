const Subject = require("../models/Subject");

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
    res.status(500).json({
      success: false,
      message: error.message,
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
    res.status(500).json({
      success: false,
      message: error.message,
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
    // Duplicate key (unique index)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];

      return res.status(400).json({
        success: false,
        message: `${field} already exists.`,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// UPDATE SUBJECT
// ==============================
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
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
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];

      return res.status(400).json({
        success: false,
        message: `${field} already exists.`,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// DELETE SUBJECT
// ==============================
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};