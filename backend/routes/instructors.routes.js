import { Router } from "express";
import { getInstructors } from "../controllers/courses.controller.js";

const r = Router();

// Get all instructors for dropdown
r.get("/", getInstructors);

export default r;