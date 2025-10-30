// routes/completionStatus.routes.js
import { Router } from "express";
import {
  createCompletionStatus,
  listCompletionStatusByStudent,
} from "../controllers/completionStatus.controller.js";

const r = Router();

r.post("/", createCompletionStatus); // enrol student
r.get("/students/:id", listCompletionStatusByStudent);

export default r;
