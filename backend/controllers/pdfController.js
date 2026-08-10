const Question = require("../models/Question");
const Unit = require("../models/Unit");
const { calculatePriority } = require("../utils/priorityHelper");
const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const { parsePdfText } = require("../utils/questionParser");

// ────────────────────────────────────────────────────────────
// parsePdf  (Step 3/4 — extraction only, no MongoDB writes)
// ────────────────────────────────────────────────────────────
exports.parsePdf = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No PDF file provided. Please upload a PDF file.",
    });
  }

  const filePath = req.file.path;
  const originalname = req.file.originalname;

  try {
    const dataBuffer = fs.readFileSync(filePath);

    const parser = new PDFParse({ data: dataBuffer });
    await parser.load();
    const result = await parser.getText();

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const text = result.text || "";
    console.log("=== PDF IMPORT DIAGNOSTIC ===");
    console.log("Extracted text length:", text.length);
    console.log("First 1000 characters:");
    console.log(text.slice(0, 1000));
    console.log("=== END PDF IMPORT DIAGNOSTIC ===");
    const pages = result.total || 1;
    const { detectedYear, questions } = parsePdfText(text);

    return res.status(200).json({
      success: true,
      filename: originalname,
      pages,
      detectedYear,
      questions,
    });
  } catch (error) {
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
    console.error("PDF Parsing Error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to parse PDF document.",
    });
  }
};

// ────────────────────────────────────────────────────────────
// Normalize question text for duplicate comparison
// ────────────────────────────────────────────────────────────
const normalizeForComparison = (text) => {
  return (text || "")
    .toLowerCase()
    // remove leading question number patterns: "1.", "Q1.", "Q.1"
    .replace(/^(?:q(?:uestion)?[\.\s]*)?[0-9]{1,2}[\.\)\:]\s*/i, "")
    .replace(/[?!.,;:\-–]/g, " ")   // normalize punctuation to space
    .replace(/\b(the|a|an|of|in|is|are|was|were|to|and|or|for|with|by|on|at|from|that|this|it|be|as|which|what|how|explain|describe|discuss|define|write)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// ────────────────────────────────────────────────────────────
// Token-based similarity  (Jaccard on word tokens)
// Returns 0.0 – 1.0
// ────────────────────────────────────────────────────────────
const computeSimilarity = (a, b) => {
  const tokensA = new Set(normalizeForComparison(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeForComparison(b).split(" ").filter(Boolean));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = new Set([...tokensA].filter(t => tokensB.has(t)));
  const union = new Set([...tokensA, ...tokensB]);

  return intersection.size / union.size;
};

// ────────────────────────────────────────────────────────────
// Keep Unit.questionsCount accurate
// ────────────────────────────────────────────────────────────
const updateUnitQuestionCount = async (unitId) => {
  if (!unitId) return;
  try {
    const count = await Question.countDocuments({ unitId, isActive: true });
    await Unit.findByIdAndUpdate(unitId, { questionsCount: count });
  } catch (err) {
    console.error(`Failed to update questionsCount for unit ${unitId}:`, err.message);
  }
};

// ────────────────────────────────────────────────────────────
// Process years helper (dedup, sort, calculate priority)
// ────────────────────────────────────────────────────────────
const processYears = (rawYears) => {
  const clean = (Array.isArray(rawYears) ? rawYears : [rawYears])
    .map(Number)
    .filter(y => !isNaN(y) && y > 1900 && y < 2100);
  const unique = [...new Set(clean)].sort((a, b) => b - a);
  return { years: unique, priority: calculatePriority(unique) };
};

// ────────────────────────────────────────────────────────────
// importPdf  (Step 5 — save reviewed questions to MongoDB)
//
// Similarity thresholds:
//   >= 0.90  → EXACT_MATCH  (auto-merge years)
//   0.70-0.89 → POSSIBLE_DUPLICATE  (return for admin review, do NOT merge)
//   < 0.70   → NEW  (create)
// ────────────────────────────────────────────────────────────
exports.importPdf = async (req, res) => {
  try {
    const { subjectId, unitId, year, questions: incoming, filename } = req.body;

    // ── Validate required fields ──────────────────────────────
    if (!subjectId) {
      return res.status(400).json({ success: false, message: "subjectId is required." });
    }
    if (!unitId) {
      return res.status(400).json({ success: false, message: "unitId is required." });
    }
    if (!incoming || !Array.isArray(incoming) || incoming.length === 0) {
      return res.status(400).json({ success: false, message: "No questions provided." });
    }

    // ── Validate year ─────────────────────────────────────────
    const importYear = year ? Number(year) : null;
    if (!importYear || isNaN(importYear) || importYear < 2000 || importYear > 2100) {
      return res.status(400).json({
        success: false,
        message: "A valid exam year (e.g. 2025) is required before importing.",
      });
    }

    // ── Fetch all existing active questions for this unit ─────
    const existingQuestions = await Question.find({ unitId, isActive: true }).select(
      "_id questionText years marks source"
    );

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      possibleDuplicates: [],   // returned to frontend for admin review
      errors: [],
    };

    for (const incomingQ of incoming) {
      const rawText = (incomingQ.questionText || "").trim();
      if (!rawText) {
        results.skipped++;
        continue;
      }

      // ── Compute similarity against all existing unit questions ──
      let bestMatch = null;
      let bestScore = 0;

      for (const existing of existingQuestions) {
        const score = computeSimilarity(rawText, existing.questionText);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = existing;
        }
      }

      try {
        // ── EXACT MATCH (≥ 0.90) — merge year into existing ──────
        if (bestScore >= 0.90 && bestMatch) {
          const existingYears = bestMatch.years || [];

          if (existingYears.includes(importYear)) {
            // Same year already present — skip
            results.skipped++;
          } else {
            // Add new year and recalculate priority
            const mergedYears = [...new Set([importYear, ...existingYears])].sort((a, b) => b - a);
            const newPriority = calculatePriority(mergedYears);

            await Question.findByIdAndUpdate(bestMatch._id, {
              years: mergedYears,
              priority: newPriority,
            });
            results.updated++;

            // Keep existingQuestions list up-to-date for subsequent iterations
            bestMatch.years = mergedYears;
          }
        }

        // ── POSSIBLE DUPLICATE (0.70 – 0.89) — return for admin review ──
        else if (bestScore >= 0.70 && bestMatch) {
          results.possibleDuplicates.push({
            importedQuestion: rawText,
            importedYear: importYear,
            existingQuestion: bestMatch.questionText,
            existingYears: bestMatch.years,
            existingId: bestMatch._id,
            similarity: Math.round(bestScore * 100),
          });
        }

        // ── NEW QUESTION (< 0.70) — create ───────────────────────
        else {
          const { years, priority } = processYears([importYear]);

          const newQuestionData = {
            subjectId,
            unitId,
            questionText: rawText,
            years,
            priority,
            questionType: incomingQ.questionType || "theory",
            answer: incomingQ.answer || "",
            source: filename || incomingQ.source || "PDF",
            isActive: true,
          };

          if (incomingQ.marks != null && incomingQ.marks !== "") {
            newQuestionData.marks = Number(incomingQ.marks);
          }

          const created = await Question.create(newQuestionData);
          // Track new question so subsequent loops can detect it as an exact match
          existingQuestions.push({ _id: created._id, questionText: created.questionText, years: created.years });
          results.created++;
        }
      } catch (err) {
        results.errors.push({
          questionText: rawText,
          error: err.message,
        });
      }
    }

    // ── Refresh Unit.questionsCount ───────────────────────────
    await updateUnitQuestionCount(unitId);

    return res.status(200).json({
      success: true,
      created: results.created,
      updated: results.updated,
      skipped: results.skipped,
      possibleDuplicates: results.possibleDuplicates,
      errors: results.errors,
    });
  } catch (error) {
    console.error("PDF Import Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Import failed.",
    });
  }
};
