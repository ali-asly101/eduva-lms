// controllers/enrolments.controller.js
import { q } from "../db.js";

export async function createEnrolment(req, res, next) {
  try {
    const { student_id, course_id, progress, credits, status } = req.body;

    const response = await q(
      ` INSERT INTO student_enrolments 
        (student_id, course_id, progress, credits, status) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *
        `,
      [student_id, course_id, progress, credits, status]
    );

    return res.status(201).json(response.rows[0]);
  } catch (e) {
    console.error("Error in createEnrolment:", e);
    if (e.code === "23505") {
      return res
        .status(409)
        .json({ message: "Student is already enrolled in this course." });
    }
    if (e.code === "23503") {
      return res
        .status(400)
        .json({ message: "Invalid student_id or course_id." });
    }
    next(e);
  }
}

export async function listEnrolmentsByStudent(req, res, next) {
  const { id } = req.params;
  try {
    const result = await q(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        c.status,
        c.total_credits,
        c.total_lessons,
        se.progress,
        se.credits,
        se.status as enrolment_status
      FROM
        student_enrolments se
      JOIN
        courses c ON se.course_id = c.id
      WHERE
        se.student_id = $1;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "No courses found for this student.",
      });
    }
    return res.status(200).json(result.rows);
  } catch (e) {
    console.error("Error in listEnrolmentsByStudent:", e);
    next(e);
  }
}

export async function updateEnrolmentByStudentCourse(req, res, next) {
  const { studentId, courseId } = req.params;
  const { progress, credits, status } = req.body;

  try {
    const result = await q(
      `
      UPDATE student_enrolments
      SET 
        progress = COALESCE($1, progress),
        credits  = COALESCE($2, credits),
        status   = COALESCE($3, status)
      WHERE student_id = $4 AND course_id = $5
      RETURNING *;
      `,
      [progress, credits, status, studentId, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Enrolment not found." });
    }

    return res.status(200).json(result.rows[0]);
  } catch (e) {
    console.error("Error in updateEnrolmentByStudentCourse:", e);
    next(e);
  }
}
export async function listStudentsByCourse(req, res, next) {
  const { courseId } = req.params;
  try {
    const result = await q(
      `
      SELECT 
        s.id, 
        s.student_id, 
        s.title, 
        s.first_name, 
        s.last_name, 
        s.email, 
        se.progress, 
        se.credits, 
        se.date_enrolled, 
        se.status AS enrolment_status 
      FROM 
        student_enrolments se 
      JOIN 
        students s ON se.student_id = s.id 
      WHERE 
        se.course_id = $1;
      `,
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: `No students found for course ${courseId}.`,
      });
    }
    return res.status(200).json(result.rows);
  } catch (e) {
    console.error("Error in listStudentsByCourse:", e);
    next(e);
  }
}
