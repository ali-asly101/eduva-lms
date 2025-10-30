// routes/lessons.routes.js
import { Router } from "express";
import {
  attachLessonToCourse,
  checkLessonCompletion,
  checkLessonPrerequisites,
  createLesson,
  createLessonForCourse,
  createStandaloneLesson,
  deleteLesson,
  deleteLessonById,
  detachLessonFromCourse,
  getAllLessons,
  getLessonForStudent,
  getUnassignedLessons,
  listLessonsForCourse,
  markLessonComplete,
  updateLesson,
  updateLessonById,
} from "../controllers/lessons.controller.js";

const r = Router();

// Lesson CRUD operations for courses
r.post("/", createLesson);
r.get("/courses/:courseId/lessons", listLessonsForCourse);
r.post("/courses/:courseId/lessons", createLessonForCourse);

// Student lesson access - FIXED ROUTES
r.get("/:lessonId/student", getLessonForStudent);
r.post("/:lessonId/complete", markLessonComplete);
r.get("/:lessonId/completion/:studentId", checkLessonCompletion);
r.get("/:lessonId/prerequisites/:studentId", checkLessonPrerequisites);

// Lesson management for courses (attach/detach) - FIXED ROUTES
r.get("/unassigned", getUnassignedLessons);
r.put("/:lessonId/attach", attachLessonToCourse);
r.put("/:lessonId/detach", detachLessonFromCourse);

// Standalone lesson management
r.get("/all", getAllLessons);
r.post("/create", createStandaloneLesson);
r.put("/:id", updateLessonById);
r.delete("/:id", deleteLessonById);

export default r;
