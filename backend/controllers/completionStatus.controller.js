// controllers/completionStatus.controller.js
import { q } from "../db.js";

export async function createCompletionStatus(req, res, next) {
  try {
    const { student_id, course_id, final_grade, completion_status, total_credits_earned, certificate_issued, certificate_number } = req.body;

    const response = await q(
      ` INSERT INTO course_completions
        (student_id, course_id, final_grade, completion_status, total_credits_earned, certificate_issued, certificate_number) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `,
      [student_id, course_id, final_grade, completion_status, total_credits_earned, certificate_issued, certificate_number]
    );

    return res.status(201).json(response.rows[0]);
  } catch (e) {
    next(e);
  }
}

export async function listCompletionStatusByStudent(req, res, next) {
  const { id } = req.params;
  try {
    const result = await q(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        se.progress
      FROM
        course_completions se
      JOIN
        courses c ON se.course_id = c.id
      WHERE
        se.student_id = $1;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "No completion status found for this student.",
      });
    }
    return res.status(200).json(result.rows);
  } catch (e) {
    next(e);
  }
}
