import express from "express";
import {
  listInstructorCourses,
  createInstructorCourse,
  updateInstructorCourse,
  deleteInstructorCourse,
} from "../controllers/courses.controller.js";

const router = express.Router();

router.get("/", listInstructorCourses);
router.post("/", createInstructorCourse);
router.put("/:id", updateInstructorCourse);
router.delete("/:id", deleteInstructorCourse);

export default router;
