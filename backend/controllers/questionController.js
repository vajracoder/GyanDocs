const Question = require("../models/Question");
const Unit = require("../models/Unit");
const { calculatePriority } = require("../utils/priorityHelper");
const { normalizeError } = require("../middleware/errorHandler");
const {
  escapeRegex,
  validateObjectId,
  validateInteger,
  validateSearch,
  validateQuestionType,
  VALID_PRIORITY_MIN,
  VALID_PRIORITY_MAX,
  VALID_YEAR_MIN,
  VALID_YEAR_MAX,
} = require("../utils/queryValidation");

// Helper to clean, deduplicate, sort years descending and calculate priority
const processYearsAndPriority = (rawYears) => {
  if (!rawYears) return { years: [], priority: 1 };
  if (!Array.isArray(rawYears)) {
    rawYears = [rawYears];
  }
  const cleanYears = rawYears
    .map((y) => Number(y))
    .filter((y) => !isNaN(y) && y > 1900 && y < 2100);

  const uniqueYears = Array.from(new Set(cleanYears)).sort((a, b) => b - a);
  const priority = calculatePriority(uniqueYears);
  return { years: uniqueYears, priority };
};

// Helper to keep Unit questionsCount updated
const updateUnitQuestionCount = async (unitId) => {
  if (!unitId) return;
  try {
    const count = await Question.countDocuments({ unitId, isActive: true });
    await Unit.findByIdAndUpdate(unitId, { questionsCount: count });
  } catch (err) {
    console.error(`Failed to update questionsCount for unit ${unitId}:`, err.message);
  }
};

// ==============================
// GET ALL QUESTIONS (With Query Filters)
// ==============================
exports.getQuestions = async (req, res) => {
  try {
    const { subjectId, unitId, topicId, year, priority, questionType, search, isActive } = req.query;

    // Explicitly validate every filter parameter. Never pass req.query into
    // Mongoose directly — this prevents query-object injection (?year[$ne]=...).
    const filter = {};

    if (isActive !== undefined) {
      if (typeof isActive !== "string" || !["true", "false"].includes(isActive)) {
        return res.status(400).json({ success: false, message: "Invalid isActive." });
      }
      filter.isActive = isActive === "true";
    } else {
      filter.isActive = true;
    }

    if (subjectId !== undefined) {
      const result = validateObjectId(subjectId, "subject ID");
      if (!result.valid) {
        return res.status(400).json({ success: false, message: result.error });
      }
      filter.subjectId = result.value;
    }

    if (unitId !== undefined) {
      const result = validateObjectId(unitId, "unit ID");
      if (!result.valid) {
        return res.status(400).json({ success: false, message: result.error });
      }
      filter.unitId = result.value;
    }

    if (topicId !== undefined) {
      const result = validateObjectId(topicId, "topic ID");
      if (!result.valid) {
        return res.status(400).json({ success: false, message: result.error });
      }
      filter.topicId = result.value;
    }

    if (year !== undefined) {
      const result = validateInteger(year, "year", VALID_YEAR_MIN, VALID_YEAR_MAX);
      if (!result.valid) {
        return res.status(400).json({ success: false, message: result.error });
      }
      filter.years = result.value;
    }

    if (priority !== undefined) {
      const result = validateInteger(priority, "priority", VALID_PRIORITY_MIN, VALID_PRIORITY_MAX);
      if (!result.valid) {
        return res.status(400).json({ success: false, message: result.error });
      }
      filter.priority = result.value;
    }

    if (questionType !== undefined) {
      const result = validateQuestionType(questionType);
      if (!result.valid) {
        return res.status(400).json({ success: false, message: result.error });
      }
      filter.questionType = result.value;
    }

    if (search !== undefined) {
      const result = validateSearch(search);
      if (!result.valid) {
        return res.status(400).json({ success: false, message: result.error });
      }
      if (result.value !== "") {
        // Escape the user input so it is treated as a literal substring,
        // never as an attacker-controlled regex pattern (ReDoS protection).
        filter.questionText = { $regex: escapeRegex(result.value), $options: "i" };
      }
    }

    const questions = await Question.find(filter)
      .populate("subjectId", "name code shortName slug semester")
      .populate("unitId", "name unitNumber slug")
      .populate("topicId", "name slug")
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
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
// GET QUESTION BY ID
// ==============================
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("subjectId", "name code shortName slug semester")
      .populate("unitId", "name unitNumber slug")
      .populate("topicId", "name slug");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.status(200).json({
      success: true,
      data: question,
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
// CREATE QUESTION
// ==============================
exports.createQuestion = async (req, res) => {
  try {
    const { subjectId, unitId, questionText, years: rawYears, marks, questionType, answer, source, isActive } = req.body;

    if (!questionText || questionText.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "questionText is required",
      });
    }

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "subjectId is required",
      });
    }

    if (!unitId) {
      return res.status(400).json({
        success: false,
        message: "unitId is required",
      });
    }

    const { years, priority } = processYearsAndPriority(rawYears);

    const questionData = {
      subjectId,
      unitId,
      questionText: questionText.trim(),
      years,
      priority, // Derived strictly from years.length
      questionType: questionType || "theory",
      answer: answer || "",
      source: source || "",
      isActive: isActive !== undefined ? isActive : true,
    };

    if (marks !== undefined && marks !== null && marks !== "") {
      questionData.marks = Number(marks);
    }

    const question = await Question.create(questionData);

    // Keep Unit questionsCount updated
    await updateUnitQuestionCount(question.unitId);

    const populatedQuestion = await Question.findById(question._id)
      .populate("subjectId", "name code shortName slug semester")
      .populate("unitId", "name unitNumber slug")
      .populate("topicId", "name slug");

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: populatedQuestion,
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
// UPDATE QUESTION
// ==============================
// Explicit allowlist of fields the admin may edit.
// System/derived fields (_id, isActive, priority, counters, timestamps)
// are never accepted from the client.
const QUESTION_UPDATE_ALLOWLIST = [
  "questionText",
  "subjectId",
  "unitId",
  "topicId",
  "years",
  "marks",
  "co",
  "level",
  "classificationConfidence",
  "questionType",
  "answer",
  "source",
];

exports.updateQuestion = async (req, res) => {
  try {
    const existingQuestion = await Question.findById(req.params.id);

    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Build a sanitized update object from the allowlist only.
    const updateData = {};
    for (const field of QUESTION_UPDATE_ALLOWLIST) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Validate required fields if passed
    if (updateData.questionText !== undefined) {
      if (!updateData.questionText || updateData.questionText.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "questionText cannot be empty",
        });
      }
      updateData.questionText = updateData.questionText.trim();
    }

    if (updateData.subjectId !== undefined && !updateData.subjectId) {
      return res.status(400).json({
        success: false,
        message: "subjectId cannot be empty",
      });
    }

    if (updateData.unitId !== undefined && !updateData.unitId) {
      return res.status(400).json({
        success: false,
        message: "unitId cannot be empty",
      });
    }

    // Process years and derive priority (do not trust frontend priority)
    const targetYears = updateData.years !== undefined ? updateData.years : existingQuestion.years;
    const { years, priority } = processYearsAndPriority(targetYears);
    updateData.years = years;
    updateData.priority = priority;

    const oldUnitId = existingQuestion.unitId.toString();

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("subjectId", "name code shortName slug semester")
      .populate("unitId", "name unitNumber slug")
      .populate("topicId", "name slug");

    // Update questionsCount for unit(s)
    const newUnitId = updatedQuestion.unitId._id
      ? updatedQuestion.unitId._id.toString()
      : updatedQuestion.unitId.toString();

    await updateUnitQuestionCount(newUnitId);
    if (oldUnitId !== newUnitId) {
      await updateUnitQuestionCount(oldUnitId);
    }

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: updatedQuestion,
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
// DELETE QUESTION
// ==============================
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Update questionsCount for unit
    await updateUnitQuestionCount(question.unitId);

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    const { status, message } = normalizeError(error);
    res.status(status).json({
      success: false,
      message,
    });
  }
};
