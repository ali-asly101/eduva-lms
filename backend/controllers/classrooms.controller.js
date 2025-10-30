// controllers/classrooms.controller.js
import { q } from "../db.js";

export async function listClassroomsForLesson(req, res, next) {
  try {
    const { lessonId } = req.params;

    const result = await q(
      `SELECT
        c.*,
        COUNT(ce.student_id)::int AS current_capacity
      FROM
        classrooms c
      LEFT JOIN
        classroom_enrolments ce ON c.id = ce.classroom_id
      WHERE
        c.lesson_id = $1
      GROUP BY
        c.id
      ORDER BY
        c.created_at DESC`,
      [lessonId]
    );

    return res.json(result.rows);
  } catch (e) {
    console.error("Error in listClassroomsForLesson:", e);
    next(e);
  }
}

// ✅ NEW: list all classrooms across all courses with supervisors & creator names
export async function listAllClassrooms(req, res, next) {
  try {
    const result = await q(
      `
      SELECT
        cr.id,
        cr.classroom_id,
        cr.course_id,
        cr.lesson_id,
        cr.duration_weeks,
        cr.max_capacity,
        cr.status,
        cr.created_at,
        cr.created_by,

        -- creator name (instructor)
        COALESCE(
          NULLIF(TRIM(CONCAT(ci.title, ' ', ci.first_name, ' ', ci.last_name)), ''),
          NULLIF(TRIM(CONCAT(ci.first_name, ' ', ci.last_name)), '')
        ) AS created_by_name,

        -- course title (nice to have for context)
        c.title AS course_title,

        -- supervisors (array of names)
        COALESCE(
          ARRAY_REMOVE(ARRAY_AGG(
            DISTINCT
              CASE 
                WHEN si.id IS NULL THEN NULL
                ELSE TRIM(CONCAT(si.title, ' ', si.first_name, ' ', si.last_name))
              END
          ), NULL),
          '{}'
        ) AS supervisors
      FROM classrooms cr
      LEFT JOIN instructors ci
        ON ci.id = cr.created_by
      LEFT JOIN courses c
        ON c.id = cr.course_id
      LEFT JOIN classroom_supervisors cs
        ON cs.classroom_id = cr.id
      LEFT JOIN instructors si
        ON si.id = cs.instructor_id
      GROUP BY
        cr.id, cr.classroom_id, cr.course_id, cr.lesson_id, cr.duration_weeks, cr.max_capacity,
        cr.status, cr.created_at, cr.created_by, created_by_name, c.title
      ORDER BY cr.created_at DESC
      `
    );

    return res.json(result.rows);
  } catch (e) {
    console.error("Error in listAllClassrooms:", e);
    next(e);
  }
}

export async function createClassroomForLesson(req, res, next) {
  try {
    const {
      classroom_id,
      course_id,
      lesson_id,
      duration_weeks,
      max_capacity,
      status,
      created_by,
    } = req.body;

    if (!lesson_id) {
      return res.status(400).json({ message: "lesson_id is required" });
    }

    // Optional: generate classroom_id if not provided
    const classroomId = classroom_id || `cls-${Date.now()}`;

    // Ensure numbers
    const duration = Number(duration_weeks) || 12;
    const capacity = Number(max_capacity) || 30;

    const result = await q(
      `INSERT INTO classrooms 
      (classroom_id, course_id, lesson_id, duration_weeks, max_capacity, status, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        classroomId,
        course_id,
        lesson_id,
        duration,
        capacity,
        status || "active",
        created_by,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error in createClassroomForLesson:", err);
    if (err.code === "23505") {
      // unique_violation
      return res
        .status(409)
        .json({ message: "A classroom with this ID already exists." });
    }
    if (err.code === "23503") {
      // foreign_key_violation
      return res
        .status(400)
        .json({ message: "Invalid course_id or lesson_id." });
    }
    next(err);
  }
}

export async function updateClassroom(req, res, next) {
  try {
    const { id } = req.params;
    const {
      classroom_id,
      course_id,
      lesson_id,
      duration_weeks,
      max_capacity,
      status,
      modified_by,
    } = req.body;

    const result = await q(
      `UPDATE classrooms
       SET classroom_id   = COALESCE($1, classroom_id),
           course_id      = COALESCE($2, course_id),
           lesson_id      = COALESCE($3, lesson_id),
           duration_weeks = COALESCE($4, duration_weeks),
           max_capacity   = COALESCE($5, max_capacity),
           status         = COALESCE($6, status),
           modified_at    = now(),
           modified_by    = $7
       WHERE id = $8
       RETURNING *`,
      [
        classroom_id || null,
        course_id || null,
        lesson_id || null,
        duration_weeks ?? null,
        max_capacity ?? null,
        status || null,
        modified_by ?? null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    return res.json(result.rows[0]);
  } catch (e) {
    console.error("Error in updateClassroom:", e);
    if (e.code === "23505") {
      return res
        .status(409)
        .json({ message: "A classroom with this ID already exists." });
    }
    next(e);
  }
}

export async function deleteClassroom(req, res, next) {
  try {
    const { id } = req.params;

    const result = await q(
      `DELETE FROM classrooms
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    return res.json({
      message: "Classroom deleted successfully",
      classroom: result.rows[0],
    });
  } catch (e) {
    console.error("Error in deleteClassroom:", e);
    next(e);
  }
}

export async function enrollClassroom(req, res, next) {
  try {
    const { student_id, classroom_id, lesson_id } = req.body;

    if (!student_id || !classroom_id) {
      return res
        .status(400)
        .json({ message: "student_id and classroom_id are required" });
    }

    const result = await q(
      `INSERT INTO classroom_enrolments (student_id, classroom_id, lesson_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [student_id, classroom_id, lesson_id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error("Error in enrollClassroom:", e);
    if (e.code === "23505") {
      return res
        .status(409)
        .json({ message: "Student is already enrolled in this classroom." });
    }
    if (e.code === "23503") {
      return res
        .status(400)
        .json({ message: "Invalid student_id or classroom_id." });
    }
    next(e);
  }
}

export async function listClassroomByStudent(req, res, next) {
  const { studentId, lessonId } = req.params;

  try {
    const result = await q(
      `
      SELECT
        cr.id,
        cr.classroom_id,
        cr.duration_weeks,
        cr.max_capacity,
        cr.status
      FROM 
        classroom_enrolments ce
      JOIN
        classrooms cr ON ce.classroom_id = cr.id
      WHERE
        ce.student_id = $1 AND ce.lesson_id = $2  
      `,
      [studentId, lessonId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "No classrooms found for this student.",
      });
    }

    return res.status(200).json(result.rows);
  } catch (e) {
    console.error("Error in listClassroomByStudent:", e);
    next(e);
  }
}

/* ===========================
   ✅ NEW: Classroom details
=========================== */
export async function getClassroomById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await q(
      `
      SELECT
        cr.id,
        cr.classroom_id,
        cr.course_id,
        cr.lesson_id,
        cr.duration_weeks,
        cr.max_capacity,
        cr.status,
        cr.created_at,
        cr.created_by,
        c.title AS course_title,
        COALESCE(
          NULLIF(TRIM(CONCAT(ci.title, ' ', ci.first_name, ' ', ci.last_name)), ''),
          NULLIF(TRIM(CONCAT(ci.first_name, ' ', ci.last_name)), '')
        ) AS created_by_name
      FROM classrooms cr
      LEFT JOIN courses c ON c.id = cr.course_id
      LEFT JOIN instructors ci ON ci.id = cr.created_by
      WHERE cr.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Classroom not found" });
    }
    return res.json(result.rows[0]);
  } catch (e) {
    console.error("Error in getClassroomById:", e);
    next(e);
  }
}

/* ========================================
   ✅ NEW: Students in a given classroom
======================================== */
export async function listStudentsByClassroom(req, res, next) {
  try {
    const { id } = req.params; // classroom id (UUID)
    const result = await q(
      `
      SELECT 
        s.id,
        s.student_id,
        s.title,
        s.first_name,
        s.last_name,
        s.email,
        ce.created_at AS date_enrolled
      FROM classroom_enrolments ce
      JOIN students s ON s.id = ce.student_id
      WHERE ce.classroom_id = $1
      ORDER BY ce.created_at DESC
      `,
      [id]
    );

    // Return an array; if empty, return empty array (frontend handles "no students" UI)
    return res.json(result.rows);
  } catch (e) {
    console.error("Error in listStudentsByClassroom:", e);
    next(e);
  }
}
