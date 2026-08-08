import Semester from "../models/Semester.js";

// Get all semesters
export const getSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ number: 1 });

    res.status(200).json({
      success: true,
      data: semesters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new semester
export const createSemester = async (req, res) => {
  try {
    const { number, name } = req.body;

    const semester = await Semester.create({
      number,
      name,
    });

    res.status(201).json({
      success: true,
      data: semester,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};