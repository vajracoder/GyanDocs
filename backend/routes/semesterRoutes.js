import express from "express";
import {
  getSemesters,
  createSemester,
} from "../controllers/semesterController.js";

const router = express.Router();

// GET all semesters
router.get("/", getSemesters);

// CREATE semester
router.post("/", createSemester);

export default router;