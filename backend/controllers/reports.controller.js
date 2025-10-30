// backend/controllers/reports.controller.js
import { q } from "../db.js";


/**
 * Get all courses owned/directed by an instructor with enrollment summary
 * GET /api/reports/instructor/:instructorId/courses
 */

export async function getInstructorCoursesReport(req, res, next) {
  try {
    const { rows } = await q(
      `
      SELECT 
        c.id,
        c.course_id,
        c.title,
        c.description,
        c.status,
        c.total_credits,
        c.total_lessons,
        c.director_first_name,
        c.director_last_name,
        COUNT(DISTINCT se.student_id) as total_students_enrolled,
        COALESCE(AVG(se.progress), 0) as average_progress,
        COALESCE(AVG(se.credits), 0) as average_credits
      FROM courses c
      LEFT JOIN student_enrolments se ON c.id = se.course_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
      `
    );

    return res.json(rows);
  } catch (e) {
    next(e)
  }
}

// ... rest of your functions remain the samey

/**
 * Get detailed report for a specific course
 * GET /api/reports/course/:courseId
 */
export async function getCourseDetailedReport(req, res, next) {
  try {
    const { courseId } = req.params;

    // Get course basic info
    const courseInfo = await q(
      `
      SELECT 
        c.id,
        c.course_id,
        c.title,
        c.description,
        c.total_credits,
        c.total_lessons,
        c.status
      FROM courses c
      WHERE c.id = $1
    `,
      [courseId]
    );

    if (courseInfo.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Get all students enrolled with their progress
    const students = await q(
    `
    SELECT 
        s.id,
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        se.progress,
        se.credits,
        se.status as enrollment_status,
        se.date_enrolled,
        cl.classroom_id,
        cl.duration_weeks
    FROM student_enrolments se
    JOIN students s ON se.student_id = s.id
    LEFT JOIN classrooms cl ON se.classroom_id = cl.id
    WHERE se.course_id = $1
        AND s.first_name != 'dr'
        AND s.last_name != 'dr'
    ORDER BY se.progress DESC, s.last_name, s.first_name
    `,
    [courseId]
    );
    // Get all lessons in the course with completion stats
    const lessons = await q(
      `
      SELECT 
        l.id,
        l.lesson_id,
        l.title,
        l.description,
        l.credit_value,
        l.status,
        l.effort_estimate,
        l.content_type,
        COUNT(DISTINCT lc.student_id) as students_completed,
        COUNT(DISTINCT se.student_id) as total_enrolled_students,
        CASE 
          WHEN COUNT(DISTINCT se.student_id) > 0 
          THEN (COUNT(DISTINCT lc.student_id)::DECIMAL / COUNT(DISTINCT se.student_id) * 100)
          ELSE 0 
        END as completion_percentage
      FROM course_lessons cl
      JOIN lessons l ON cl.lesson_id = l.id
      LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id
      LEFT JOIN student_enrolments se ON cl.course_id = se.course_id
      WHERE cl.course_id = $1
      GROUP BY l.id, l.lesson_id, l.title, l.description, l.credit_value, l.status, l.effort_estimate, l.content_type
      ORDER BY l.created_at
    `,
      [courseId]
    );

    // Calculate overall statistics
    const avgProgress =
      students.rows.length > 0
        ? students.rows.reduce((sum, s) => sum + (s.progress || 0), 0) /
          students.rows.length
        : 0;

    const avgCredits =
      students.rows.length > 0
        ? students.rows.reduce((sum, s) => sum + (s.credits || 0), 0) /
          students.rows.length
        : 0;

    return res.json({
      course: courseInfo.rows[0],
      statistics: {
        total_students: students.rows.length,
        average_progress: Math.round(avgProgress * 100) / 100,
        average_credits: Math.round(avgCredits * 100) / 100,
        total_lessons: lessons.rows.length,
      },
      students: students.rows,
      lessons: lessons.rows,
    });
  } catch (e) {
    next(e);
  }
}

/**
 * Get lesson details with classroom breakdown
 * GET /api/reports/lesson/:lessonId/classrooms
 */

export async function getLessonClassroomReport(req, res, next) {
  try {
    const { lessonId } = req.params;
    
    console.log("🔍 Getting classrooms for lesson:", lessonId);

    // Get lesson info
    const lessonInfo = await q(
      `
      SELECT 
        l.id,
        l.lesson_id,
        l.title,
        l.description,
        l.credit_value,
        l.course_id
      FROM lessons l
      WHERE l.id = $1
    `,
      [lessonId]
    );

    if (lessonInfo.rows.length === 0) {
      console.log("❌ Lesson not found");
      return res.status(404).json({ message: "Lesson not found" });
    }

    console.log("✅ Lesson found:", lessonInfo.rows[0]);
    const courseId = lessonInfo.rows[0].course_id;
    console.log("🔍 Course ID:", courseId);

    // Get classrooms linked to this specific lesson
    const classrooms = await q(
      `
      SELECT 
        cl.id,
        cl.classroom_id,
        cl.duration_weeks,
        cl.max_capacity,
        cl.status,
        cl.lesson_id,
        COUNT(DISTINCT se.student_id) as total_students,
        COUNT(DISTINCT CASE 
          WHEN lc.lesson_id = $1 AND lc.completed_at IS NOT NULL 
          THEN lc.student_id 
          ELSE NULL 
        END) as students_completed,
        CASE 
          WHEN COUNT(DISTINCT se.student_id) > 0 
          THEN (COUNT(DISTINCT CASE WHEN lc.lesson_id = $1 AND lc.completed_at IS NOT NULL THEN lc.student_id ELSE NULL END)::DECIMAL / COUNT(DISTINCT se.student_id) * 100)
          ELSE 0 
        END as completion_percentage,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', i.id,
            'first_name', i.first_name,
            'last_name', i.last_name,
            'email', i.email
          )
        ) FILTER (WHERE i.id IS NOT NULL) as supervisors
      FROM classrooms cl
      LEFT JOIN student_enrolments se ON cl.id = se.classroom_id
      LEFT JOIN lesson_completions lc ON lc.student_id = se.student_id
      LEFT JOIN classroom_supervisors cs ON cl.id = cs.classroom_id
      LEFT JOIN instructors i ON cs.instructor_id = i.id
      WHERE cl.lesson_id = $1
      GROUP BY cl.id, cl.classroom_id, cl.duration_weeks, cl.max_capacity, cl.status, cl.lesson_id
      ORDER BY cl.classroom_id
    `,
      [lessonId]
    );

    console.log("🔍 Found", classrooms.rows.length, "classrooms");
    console.log("🔍 Classrooms:", JSON.stringify(classrooms.rows, null, 2));

    return res.json({
      lesson: lessonInfo.rows[0],
      classrooms: classrooms.rows,
    });
  } catch (e) {
    console.error("❌ Error in getLessonClassroomReport:", e);
    next(e);
  }
}

/**
 * Get students in a specific classroom for a lesson
 * GET /api/reports/classroom/:classroomId/lesson/:lessonId/students
 */
export async function getClassroomLessonStudents(req, res, next) {
  try {
    const { classroomId, lessonId } = req.params;

    const { rows } = await q(
      `
      SELECT 
        s.id,
        s.student_id,
        s.first_name,
        s.last_name,
        s.email,
        CASE 
          WHEN lc.id IS NOT NULL THEN true 
          ELSE false 
        END as completed,
        lc.completed_at,
        lc.credits_earned
      FROM student_enrolments se
      JOIN students s ON se.student_id = s.id
      LEFT JOIN lesson_completions lc ON lc.student_id = s.id AND lc.lesson_id = $2
      WHERE se.classroom_id = $1
      ORDER BY s.last_name, s.first_name
    `,
      [classroomId, lessonId]
    );

    return res.json(rows);
  } catch (e) {
    next(e);
  }
}