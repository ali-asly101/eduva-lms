import { q } from "../db.js";

// List all supervisors for a given classroom
export async function listSupervisorsForClassroom(req, res, next) {
  try {
    const { classroomId } = req.params;

    const result = await q(
      `SELECT cs.*, i.first_name, i.last_name, i.email
       FROM classroom_supervisors cs
       LEFT JOIN instructors i ON cs.instructor_id = i.id
       WHERE cs.classroom_id = $1
       ORDER BY cs.created_at DESC`,
      [classroomId]
    );

    return res.json(result.rows);
  } catch (e) {
    next(e);
  }
}

// Assign a supervisor to a classroom
export async function createClassroomSupervisor(req, res, next) {
  try {
    const { classroom_id, instructor_id } = req.body;

    if (!classroom_id || !instructor_id) {
      return res
        .status(400)
        .json({ message: "classroom_id and instructor_id are required" });
    }

    const result = await q(
      `INSERT INTO classroom_supervisors (classroom_id, instructor_id)
       VALUES ($1, $2)
       ON CONFLICT (classroom_id, instructor_id) DO NOTHING
       RETURNING *`,
      [classroom_id, instructor_id]
    );

    if (result.rows.length === 0) {
      return res
        .status(409)
        .json({ message: "Supervisor already assigned to this classroom" });
    }

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error in createClassroomSupervisor:", err);
    res.status(500).json({ message: err.message });
  }
}

// Update a classroom supervisor
export async function updateClassroomSupervisor(req, res, next) {
  try {
    const { id } = req.params;
    const { instructor_id } = req.body;

    const result = await q(
      `UPDATE classroom_supervisors
       SET instructor_id = COALESCE($1, instructor_id),
           modified_at = now()
       WHERE id = $2
       RETURNING *`,
      [instructor_id, id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Classroom supervisor not found" });
    }

    return res.json(result.rows[0]);
  } catch (e) {
    next(e);
  }
}

// Remove a supervisor from a classroom
export async function deleteClassroomSupervisor(req, res, next) {
  try {
    const { id } = req.params;

    const result = await q(
      `DELETE FROM classroom_supervisors
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Classroom supervisor not found" });
    }

    return res.json({
      message: "Supervisor removed successfully",
      supervisor: result.rows[0],
    });
  } catch (e) {
    next(e);
  }
}
