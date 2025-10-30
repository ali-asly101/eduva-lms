// routes/enrolments.routes.js
import { Router } from "express";
import {
  createEnrolment,
  listEnrolmentsByStudent,
  listStudentsByCourse,
  updateEnrolmentByStudentCourse
} from "../controllers/enrolments.controller.js";

const r = Router();

r.post("/", createEnrolment); // enrol student
r.get("/students/:id", listEnrolmentsByStudent);
r.put("/students/:studentId/courses/:courseId", updateEnrolmentByStudentCourse);
r.get("/:courseId/", listStudentsByCourse)

export default r;
