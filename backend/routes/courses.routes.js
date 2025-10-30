import { Router } from "express";
import * as courses from "../controllers/courses.controller.js";

const r = Router();

// Basic CRUD operations
r.get("/", courses.listCourses);
r.post("/", courses.createCourse);
r.put("/:id", courses.updateCourse);
r.delete("/:id", courses.deleteCourse);

// MOVE THIS BEFORE /:id
r.get("/instructors", courses.getInstructors);

// Course-related endpoints
r.get("/:id/classrooms", courses.getClassroomsForCourse);
r.get("/:id/lessons", courses.getCourseLessons);
r.get("/:id/prerequisites", courses.getCoursePrerequisites);
r.post("/:id/prerequisites", courses.addCoursePrerequisite);
r.delete("/:id/prerequisites/:prerequisiteId", courses.removeCoursePrerequisite);

// PUT THIS LAST
r.get("/:id", courses.getCourseById);

export default r;