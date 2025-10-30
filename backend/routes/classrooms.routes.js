// routes/classrooms.routes.js
import { Router } from "express";
import {
  createClassroomForLesson,
  deleteClassroom,
  enrollClassroom, // ✅ existing
  getClassroomById,
  listAllClassrooms,
  listClassroomByStudent,
  listClassroomsForLesson, // ✅ NEW
  listStudentsByClassroom,
  updateClassroom,
} from "../controllers/classrooms.controller.js";

const r = Router();

// ✅ list all classrooms across courses (for Instructor > Classroom page)
r.get("/all", listAllClassrooms);

r.get("/lessons/:lessonId/classrooms", listClassroomsForLesson);
r.post("/lessons/:lessonId/classrooms", createClassroomForLesson);

r.get("/student/:studentId/lesson/:lessonId", listClassroomByStudent);
r.post("/student", enrollClassroom);

// NOTE: keeping your existing paths untouched
r.put("/:id", updateClassroom);
r.delete("/:id", deleteClassroom);

/* ===========================
   ✅ NEW endpoints used by UI
   Paths assume this router is mounted at /api/classrooms
   so these resolve to:
   - GET /api/classrooms/:id
   - GET /api/classrooms/:id/students
=========================== */
r.get("/:id", getClassroomById);
r.get("/:id/students", listStudentsByClassroom);

export default r;
