// controllers/studentsProgress.controller.js
import { q } from "../db.js";

/**
 * GET /api/students/:studentId/progress-summary
 * Returns:
 * [
 *   {
 *     course_id, course_title,
 *     lessons: [
 *       { lesson_id, lesson_title, classroom_id, classroom_code, status: 'done' | 'undone' }
 *     ]
 *   }, ...
 * ]
 */
export async function getStudentProgressSummary(req, res, next) {
  try {
    const { studentId } = req.params;

    const { rows } = await q(
      `
      SELECT
        c.id             AS course_id,
        c.title          AS course_title,
        l.id             AS lesson_id,
        l.title          AS lesson_title,
        cr.id            AS classroom_id,
        cr.classroom_id  AS classroom_code,
        CASE WHEN lc.id IS NULL THEN false ELSE true END AS completed
      FROM student_enrolments se
      JOIN courses c
        ON c.id = se.course_id
      JOIN course_lessons cl
        ON cl.course_id = c.id
      JOIN lessons l
        ON l.id = cl.lesson_id
      LEFT JOIN classroom_enrolments ce
        ON ce.student_id = se.student_id
       AND ce.lesson_id  = l.id
      LEFT JOIN classrooms cr
        ON cr.id = ce.classroom_id
      LEFT JOIN lesson_completions lc
        ON lc.student_id = se.student_id
       AND lc.lesson_id  = l.id
      WHERE se.student_id = $1
      ORDER BY c.title, l.title
      `,
      [studentId]
    );

    // group by course
    const byCourse = new Map();
    for (const r of rows) {
      if (!byCourse.has(r.course_id)) {
        byCourse.set(r.course_id, {
          course_id: r.course_id,
          course_title: r.course_title,
          lessons: [],
        });
      }
      byCourse.get(r.course_id).lessons.push({
        lesson_id: r.lesson_id,
        lesson_title: r.lesson_title,
        classroom_id: r.classroom_id,
        classroom_code: r.classroom_code,
        status: r.completed ? "Complete" : "Incomplete",
      });
    }

    return res.json(Array.from(byCourse.values()));
  } catch (e) {
    next(e);
  }
}
