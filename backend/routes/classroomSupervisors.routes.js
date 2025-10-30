import { Router } from "express";
import {
  listSupervisorsForClassroom,
  createClassroomSupervisor,
  updateClassroomSupervisor,
  deleteClassroomSupervisor,
} from "../controllers/classroomSupervisors.controller.js";

const r = Router();

// List all supervisors for a classroom
r.get("/:classroomId/supervisors", listSupervisorsForClassroom);

// Assign a new supervisor to a classroom
r.post("/:classroomId/supervisors", createClassroomSupervisor);

// Update a classroom supervisor
r.put("/:id", updateClassroomSupervisor);

// Remove a supervisor from a classroom
r.delete("/:id", deleteClassroomSupervisor);

export default r;
