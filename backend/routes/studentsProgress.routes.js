// routes/studentsProgress.routes.js
import { Router } from "express";
import { getStudentProgressSummary } from "../controllers/studentsProgress.controller.js";

const r = Router();

// GET /api/students/:studentId/progress-summary
r.get("/:studentId/progress-summary", getStudentProgressSummary);

export default r;
