// backend/routes/reports.routes.js
import express from "express";
import {
  getClassroomLessonStudents,
  getCourseDetailedReport,
  getInstructorCoursesReport,
  getLessonClassroomReport,
} from "../controllers/reports.controller.js";
import { requireAuth, requireInstructor } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication and instructor role
//router.use(requireAuth);
//router.use(requireInstructor);

// Get all courses for an instructor with summary stats
router.get("/courses", getInstructorCoursesReport);

// Get detailed report for a specific course
router.get("/course/:courseId", getCourseDetailedReport);

// Get lesson details with classroom breakdown
router.get("/lesson/:lessonId/classrooms", getLessonClassroomReport);

// Get students in a classroom for a specific lesson
router.get("/classroom/:classroomId/lesson/:lessonId/students", getClassroomLessonStudents);

export default router;