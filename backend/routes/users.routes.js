// routes/users.routes.js
import { Router } from "express";
import {
  listUsers,
  createUser,
  getUserById,
  getStudentProfile, // NEW
} from "../controllers/users.controller.js";

const r = Router();

r.get("/", listUsers);
r.get("/:id", getUserById);
r.post("/", createUser);

// NEW: Student profile/summary
r.get("/students/:id/profile", getStudentProfile);

export default r;
