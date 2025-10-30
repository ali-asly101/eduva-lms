// controllers/lessons.controller.js
import { q } from "../db.js";

export async function listLessonsForCourse(req, res, next) {
  try {
    const { courseId } = req.params;
    const { rows } = await q(
      `
      SELECT
        l.*,
        i.first_name AS designer_first_name,
        i.last_name  AS designer_last_name,
        i.email      AS designer_email
      FROM course_lessons cl
      JOIN lessons l        ON l.id = cl.lesson_id
      LEFT JOIN instructors i ON i.id = l.designer_id
      WHERE cl.course_id = $1
      ORDER BY cl.created_at DESC
    `,
      [courseId]
    );

    return res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function createLesson(req, res, next) {
  try {
    const {
      lesson_id,
      title,
      description,
      objectives,
      reading_list,
      effort_estimate,
      prerequisites,
      assignments,
      credit_value,
      content_type,
      content_url,
      content_body,
      designer_id,
      status,
      course_id,
    } = req.body;
    const created_by = req.user?.id;

    if (!title || !course_id) {
      return res
        .status(400)
        .json({ message: "Title and course_id are required" });
    }

    const lessonResponse = await q(
      `INSERT INTO lessons (lesson_id, title, description, objectives, reading_list, effort_estimate, prerequisites, assignments, credit_value, content_type, content_url, content_body, designer_id, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        lesson_id,
        title,
        description,
        objectives,
        reading_list,
        effort_estimate,
        prerequisites,
        assignments,
        credit_value,
        content_type,
        content_url,
        content_body,
        designer_id,
        status,
        created_by,
      ]
    );
    const newLesson = lessonResponse.rows[0];

    await q(
      `INSERT INTO course_lessons (course_id, lesson_id, created_by)
       VALUES ($1, $2, $3)`,
      [course_id, newLesson.id, created_by]
    );

    await q(
      `UPDATE courses SET total_lessons = (SELECT COUNT(*) FROM course_lessons WHERE course_id = $1) WHERE id = $1`,
      [course_id]
    );

    res.status(201).json(newLesson);
  } catch (e) {
    console.error("Error in createLesson:", e);
    if (e.code === "23505" && e.constraint === "lessons_lesson_id_key") {
      return res.status(409).json({ message: "Lesson ID already exists." });
    }
    if (e.code === "23503") {
      return res
        .status(400)
        .json({ message: "Invalid course_id or designer_id." });
    }
    next(e);
  }
}

export async function createLessonForCourse(req, res, next) {
  try {
    const { courseId } = req.params;
    const {
      lesson_id,
      title,
      description,
      objectives,
      reading_list,
      effort_estimate,
      prerequisites,
      assignments,
      credit_value,
      content_type,
      content_url,
      content_body,
      designer_id,
      created_by,
    } = req.body;

    if (!lesson_id || !lesson_id.trim()) {
      return res.status(400).json({ message: "Lesson ID is required" });
    }
    if (!title || !content_type) {
      return res
        .status(400)
        .json({ message: "Title and content_type are required" });
    }

    // Verify course exists
    const courseCheck = await q("SELECT id FROM courses WHERE id = $1", [
      courseId,
    ]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Create lesson
    const { rows } = await q(
      `
      INSERT INTO lessons (
        lesson_id, course_id, title, description, objectives, reading_list, effort_estimate,
        prerequisites, assignments, credit_value, content_type, content_url, 
        content_body, designer_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10,0), $11, $12, $13, $14, COALESCE($15,$14))
      RETURNING *
    `,
      [
        lesson_id.trim(),
        courseId,
        title,
        description,
        objectives,
        reading_list,
        effort_estimate,
        prerequisites,
        assignments,
        credit_value || 0,
        content_type,
        content_url,
        content_body,
        designer_id,
        created_by || designer_id,
      ]
    );

    // Update course total_lessons count
    await q(
      `
      UPDATE courses 
      SET total_lessons = (
        SELECT COUNT(*) FROM lessons WHERE course_id = $1
      )
      WHERE id = $1
    `,
      [courseId]
    );

    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error("Error in createLessonForCourse:", e);
    if (e.code === "23505" && e.constraint === "lessons_lesson_id_key") {
      return res.status(409).json({ message: "Lesson ID already exists." });
    }
    if (e.code === "23503") {
      return res
        .status(400)
        .json({ message: "Invalid course_id or designer_id." });
    }
    next(e);
  }
}

export async function updateLesson(req, res, next) {
  try {
    const { lessonId } = req.params;
    const {
      title,
      description,
      objectives,
      reading_list,
      effort_estimate,
      prerequisites,
      status,
      assignments,
      credit_value,
      content_type,
      content_url,
      content_body,
      modified_by,
    } = req.body;

    const { rows } = await q(
      `
      UPDATE lessons 
      SET title = COALESCE($1, title), 
          description = COALESCE($2, description), 
          objectives = COALESCE($3, objectives), 
          reading_list = COALESCE($4, reading_list),
          effort_estimate = COALESCE($5, effort_estimate), 
          prerequisites = COALESCE($6, prerequisites), 
          status = COALESCE($7, status), 
          assignments = COALESCE($8, assignments),
          credit_value = COALESCE($9, credit_value), 
          content_type = COALESCE($10, content_type), 
          content_url = COALESCE($11, content_url), 
          content_body = COALESCE($12, content_body),
          modified_by = $13, 
          modified_at = now()
      WHERE id = $14
      RETURNING *
    `,
      [
        title,
        description,
        objectives,
        reading_list,
        effort_estimate,
        prerequisites,
        status,
        assignments,
        credit_value,
        content_type,
        content_url,
        content_body,
        modified_by,
        lessonId,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    return res.json(rows[0]);
  } catch (e) {
    console.error("Error in updateLesson:", e);
    if (e.code === "23505" && e.constraint === "lessons_lesson_id_key") {
      return res
        .status(409)
        .json({ message: "A lesson with this ID already exists." });
    }
    next(e);
  }
}

export async function deleteLesson(req, res, next) {
  try {
    const { lessonId } = req.params;

    // Get course_id before deleting
    const lessonResult = await q(
      "SELECT course_id FROM lessons WHERE id = $1",
      [lessonId]
    );
    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const courseId = lessonResult.rows[0].course_id;

    // Delete lesson
    const { rows } = await q("DELETE FROM lessons WHERE id = $1 RETURNING id", [
      lessonId,
    ]);

    // Update course total_lessons count if lesson was assigned to a course
    if (courseId) {
      await q(
        `
        UPDATE courses 
        SET total_lessons = (
          SELECT COUNT(*) FROM lessons WHERE course_id = $1
        )
        WHERE id = $1
      `,
        [courseId]
      );
    }

    return res.status(204).end();
  } catch (e) {
    next(e);
  }
}

// Get lesson details for students (only published lessons visible)
export async function getLessonForStudent(req, res, next) {
  try {
    const { lessonId } = req.params;
    const { student_id } = req.query;

    if (!student_id) {
      return res.status(400).json({ message: "student_id is required" });
    }

    const { rows } = await q(
      `
      SELECT 
        l.*,
        i.first_name as designer_first_name, 
        i.last_name as designer_last_name,
        CASE WHEN lc.id IS NOT NULL THEN true ELSE false END as completed,
        lc.completed_at,
        lc.credits_earned
      FROM lessons l
      LEFT JOIN instructors i ON l.designer_id = i.id
      LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id AND lc.student_id = $2
      WHERE l.id = $1 AND l.status IN ('published', 'archived')
    `,
      [lessonId, student_id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Lesson not found or not available" });
    }

    // Check if student is enrolled in the course and has selected a classroom
    const enrollmentCheck = await q(
      `
      SELECT se.classroom_id 
      FROM student_enrolments se
      WHERE se.student_id = $1 AND se.course_id = $2
    `,
      [student_id, rows[0].course_id]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({ message: "Not enrolled in this course" });
    }

    if (!enrollmentCheck.rows[0].classroom_id) {
      return res.status(403).json({
        message: "Must select a classroom before accessing lesson materials",
        requiresClassroomSelection: true,
      });
    }

    // Check prerequisites before allowing access
    const { prerequisites } = rows[0];
    if (prerequisites && prerequisites.trim()) {
      // Parse prerequisites - handle both JSON array format and comma-separated format
      let prerequisiteIds = [];
      try {
        // Try parsing as JSON first (new format)
        const parsed = JSON.parse(prerequisites);
        if (Array.isArray(parsed)) {
          prerequisiteIds = parsed.filter(
            (id) => id && typeof id === "string" && id.trim().length > 0
          );
        }
      } catch (e) {
        // Fall back to comma/newline separated format (legacy format)
        prerequisiteIds = prerequisites
          .split(/[,\n\r;]+/)
          .map((id) => id.trim())
          .filter((id) => id.length > 0);
      }

      if (prerequisiteIds.length > 0) {
        // Get prerequisite lessons and check completion status
        // Handle both UUID format (new) and lesson_id format (legacy)
        const prerequisiteResults = await q(
          `SELECT l.id, l.lesson_id, l.title,
                  CASE WHEN lc.student_id IS NOT NULL THEN true ELSE false END as completed
           FROM lessons l
           LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id AND lc.student_id = $1
           WHERE l.id::text = ANY($2::text[]) OR l.lesson_id = ANY($2::text[])
           ORDER BY l.title`,
          [student_id, prerequisiteIds]
        );

        const unmetPrerequisites = prerequisiteResults.rows.filter(
          (req) => !req.completed
        );

        if (unmetPrerequisites.length > 0) {
          return res.status(403).json({
            message: "Prerequisites not met for this lesson",
            prerequisitesNotMet: true,
            unmetPrerequisites: unmetPrerequisites.map((req) => ({
              id: req.id,
              lesson_id: req.lesson_id,
              title: req.title,
            })),
            allPrerequisites: prerequisiteResults.rows.map((req) => ({
              id: req.id,
              lesson_id: req.lesson_id,
              title: req.title,
              completed: req.completed,
            })),
          });
        }
      }
    }

    return res.json(rows[0]);
  } catch (e) {
    next(e);
  }
}

/**
 * Get unassigned lessons (lessons without a course)
 */
// In lessons.controller.js - update to show all lessons regardless of attachment
export async function getUnassignedLessons(req, res, next) {
  try {
    const { course_id } = req.query; // Optional course filter

    let query = `
      SELECT l.*, 
             i.first_name as designer_first_name, 
             i.last_name as designer_last_name,
             CASE WHEN cl.lesson_id IS NOT NULL THEN true ELSE false END as attached_to_course
      FROM lessons l
      LEFT JOIN instructors i ON l.designer_id = i.id
      LEFT JOIN course_lessons cl ON l.id = cl.lesson_id AND cl.course_id = $1
      ORDER BY l.created_at DESC
    `;

    const { rows } = await q(query, [course_id]);
    return res.json(rows);
  } catch (e) {
    console.error("Error in getUnassignedLessons:", e);
    next(e);
  }
}

/**
 * Attach lesson to course
 */
export async function attachLessonToCourse(req, res, next) {
  try {
    const { lessonId } = req.params;
    const { course_id } = req.body;
    const modified_by = req.user?.id;

    if (!course_id) {
      return res.status(400).json({ message: "course_id is required" });
    }

    // Verify course exists
    const courseCheck = await q("SELECT id FROM courses WHERE id = $1", [
      course_id,
    ]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify lesson exists
    const lessonCheck = await q("SELECT id FROM lessons WHERE id = $1", [
      lessonId,
    ]);
    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Check if lesson is already attached to this specific course
    const existingAttachment = await q(
      "SELECT id FROM course_lessons WHERE course_id = $1 AND lesson_id = $2",
      [course_id, lessonId]
    );

    if (existingAttachment.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Lesson is already attached to this course" });
    }

    // Create attachment record instead of updating lesson directly
    const { rows } = await q(
      `
      INSERT INTO course_lessons (course_id, lesson_id, created_by, created_at)
      VALUES ($1, $2, $3, now())
      RETURNING *
    `,
      [course_id, lessonId, modified_by]
    );

    return res.json({
      message: "Lesson attached successfully",
      attachment: rows[0],
    });
  } catch (e) {
    console.error("Error in attachLessonToCourse:", e);
    next(e);
  }
}

/**
 * Detach lesson from course
 */
// In lessons.controller.js - update detachLessonFromCourse
export async function detachLessonFromCourse(req, res, next) {
  try {
    const { lessonId } = req.params;
    const { course_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ message: "course_id is required" });
    }

    // Remove the attachment record
    const { rows } = await q(
      `
      DELETE FROM course_lessons 
      WHERE course_id = $1 AND lesson_id = $2
      RETURNING *
    `,
      [course_id, lessonId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Lesson attachment not found" });
    }

    return res.json({
      message: "Lesson detached successfully",
    });
  } catch (e) {
    console.error("Error in detachLessonFromCourse:", e);
    next(e);
  }
}
// Add these functions to your lessons.controller.js

/**
 * Get all lessons (both assigned and unassigned)
 */
export async function getAllLessons(req, res, next) {
  try {
    const { rows } = await q(`
      SELECT l.*, 
             i.first_name as designer_first_name, 
             i.last_name as designer_last_name,
             COUNT(cl.course_id) as attached_courses_count
      FROM lessons l
      LEFT JOIN instructors i ON l.designer_id = i.id
      LEFT JOIN course_lessons cl ON l.id = cl.lesson_id
      GROUP BY l.id, i.id, i.first_name, i.last_name
      ORDER BY l.created_at DESC
    `);

    return res.json(rows);
  } catch (e) {
    console.error("Error in getAllLessons:", e);
    next(e);
  }
}

// Add this to your lessons.controller.js
export async function getAllLessonsWithCourseStatus(req, res, next) {
  try {
    const { course_id } = req.query;

    const { rows } = await q(
      `
      SELECT l.*, 
             i.first_name as designer_first_name, 
             i.last_name as designer_last_name,
             CASE WHEN cl.lesson_id IS NOT NULL THEN true ELSE false END as attached_to_course
      FROM lessons l
      LEFT JOIN instructors i ON l.designer_id = i.id
      LEFT JOIN course_lessons cl ON l.id = cl.lesson_id AND cl.course_id = $1
      ORDER BY l.created_at DESC
    `,
      [course_id]
    );

    return res.json(rows);
  } catch (e) {
    console.error("Error in getAllLessonsWithCourseStatus:", e);
    next(e);
  }
}
/**
 * Create a standalone lesson (not attached to any course)
 */
export async function createStandaloneLesson(req, res, next) {
  try {
    const {
      lesson_id, // << REQUIRED (manual)
      title,
      description,
      objectives,
      reading_list,
      effort_estimate,
      prerequisites,
      assignments,
      credit_value,
      content_type,
      content_url,
      content_body,
      designer_id,
      status,
    } = req.body;

    if (!lesson_id || !lesson_id.trim()) {
      return res.status(400).json({ message: "lesson_id is required" });
    }
    if (!title || !content_type) {
      return res
        .status(400)
        .json({ message: "title and content_type are required" });
    }

    const created_by = req.user?.id;

    const { rows } = await q(
      `
      INSERT INTO lessons (
        lesson_id, title, description, objectives, reading_list, effort_estimate,
        prerequisites, assignments, credit_value, content_type, content_url,
        content_body, designer_id, status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, COALESCE($9,0), $10, $11,
        $12, $13, COALESCE($14,'draft'), $15
      )
      RETURNING *
    `,
      [
        lesson_id.trim(),
        title,
        description,
        objectives,
        reading_list,
        effort_estimate,
        prerequisites,
        assignments,
        credit_value,
        content_type,
        content_url,
        content_body,
        designer_id,
        status,
        created_by,
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error("Error in createStandaloneLesson:", e);
    if (e.code === "23505" && e.constraint === "lessons_lesson_id_key") {
      return res.status(409).json({ message: "Lesson ID already exists." });
    }
    if (e.code === "23503") {
      return res.status(400).json({ message: "Invalid designer_id." });
    }
    next(e);
  }
}

/**
 * Delete a lesson by ID
 */
export async function deleteLessonById(req, res, next) {
  try {
    const { id } = req.params;

    // Get course_id before deleting for lesson count update
    const lessonResult = await q(
      "SELECT course_id FROM lessons WHERE id = $1",
      [id]
    );
    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const courseId = lessonResult.rows[0].course_id;

    // Delete lesson
    const { rows } = await q("DELETE FROM lessons WHERE id = $1 RETURNING id", [
      id,
    ]);

    // Update course total_lessons count if lesson was assigned to a course
    if (courseId) {
      await q(
        `
        UPDATE courses 
        SET total_lessons = (
          SELECT COUNT(*) FROM lessons WHERE course_id = $1
        )
        WHERE id = $1
      `,
        [courseId]
      );
    }

    return res.status(204).end();
  } catch (e) {
    console.error("Error in deleteLessonById:", e);
    next(e);
  }
}

/**
 * Update a lesson by ID
 */
export async function updateLessonById(req, res, next) {
  try {
    const { id } = req.params;
    const {
      lesson_id,
      title,
      description,
      objectives,
      reading_list,
      effort_estimate,
      prerequisites,
      assignments,
      credit_value,
      content_type,
      content_url,
      content_body,
      designer_id,
      status,
    } = req.body;
    const modified_by = req.user?.id;

    const { rows } = await q(
      `
      UPDATE lessons 
      SET lesson_id = $1,
          title = $2, 
          description = $3, 
          objectives = $4, 
          reading_list = $5,
          effort_estimate = $6, 
          prerequisites = $7, 
          assignments = $8,
          credit_value = $9, 
          content_type = $10, 
          content_url = $11, 
          content_body = $12,
          designer_id = $13,
          status = $14,
          modified_by = $15, 
          modified_at = now()
      WHERE id = $16
      RETURNING *
    `,
      [
        lesson_id,
        title,
        description,
        objectives,
        reading_list,
        effort_estimate,
        prerequisites,
        assignments,
        credit_value,
        content_type,
        content_url,
        content_body,
        designer_id,
        status,
        modified_by,
        id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    return res.json(rows[0]);
  } catch (e) {
    console.error("Error in updateLessonById:", e);
    if (e.code === "23505" && e.constraint === "lessons_lesson_id_key") {
      return res
        .status(409)
        .json({ message: "A lesson with this ID already exists." });
    }
    if (e.code === "23503") {
      return res.status(400).json({ message: "Invalid designer_id." });
    }
    next(e);
  }
}

// Mark lesson as complete for student and update course progress
// Mark lesson as complete for student and update course progress
export async function markLessonComplete(req, res, next) {
  console.log("markLessonComplete called:", {
    lessonId: req.params.lessonId,
    student_id: req.body.student_id,
    method: req.method,
    path: req.path,
  });

  try {
    const { lessonId } = req.params;
    const { student_id } = req.body;

    if (!student_id) {
      console.log("Missing student_id");
      return res.status(400).json({ message: "student_id is required" });
    }

    console.log("Looking for lesson:", lessonId);

    // Get lesson details including course_id and credit_value
    const lessonResult = await q(
      `
      SELECT l.credit_value, cl.course_id, l.title, l.status
      FROM lessons l
      LEFT JOIN course_lessons cl ON l.id = cl.lesson_id
      WHERE l.id = $1
    `,
      [lessonId]
    );

    console.log("Lesson query result:", lessonResult.rows);

    if (lessonResult.rows.length === 0) {
      console.log("Lesson not found");
      return res.status(404).json({ message: "Lesson not found" });
    }

    const { credit_value, course_id, title, status } = lessonResult.rows[0];

    console.log("Lesson details:", {
      credit_value,
      course_id,
      title,
      status,
    });

    if (!course_id) {
      console.log("Lesson not attached to course");
      return res
        .status(400)
        .json({ message: "Lesson is not attached to any course" });
    }

    // Check lesson status (remove the published requirement for now to debug)
    if (status !== "published") {
      console.log(`Lesson status is '${status}', not 'published'`);
      // Don't return error yet, let's see what happens
    }

    console.log("Checking student enrollment for:", {
      student_id,
      course_id,
    });

    // Verify student is enrolled in this course
    const enrollmentResult = await q(
      `
      SELECT id, credits, progress FROM student_enrolments 
      WHERE student_id = $1 AND course_id = $2
    `,
      [student_id, course_id]
    );

    console.log("Enrollment result:", enrollmentResult.rows);

    if (enrollmentResult.rows.length === 0) {
      console.log("Student not enrolled in course");
      return res
        .status(403)
        .json({ message: "Student not enrolled in this course" });
    }

    // Check if lesson is already completed
    const existingCompletion = await q(
      `
      SELECT id FROM lesson_completions 
      WHERE student_id = $1 AND lesson_id = $2
    `,
      [student_id, lessonId]
    );

    if (existingCompletion.rows.length > 0) {
      console.log("Lesson already completed");
      return res.status(400).json({ message: "Lesson already completed" });
    }

    console.log("Creating lesson completion record...");

    // Mark lesson as complete
    const completionResult = await q(
      `
      INSERT INTO lesson_completions (student_id, lesson_id, credits_earned)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
      [student_id, lessonId, credit_value || 0]
    );

    console.log("Completion record created:", completionResult.rows[0]);

    // Update student enrollment with new credits and progress
    const currentEnrollment = enrollmentResult.rows[0];
    const newCredits = (currentEnrollment.credits || 0) + (credit_value || 0);
    const newProgress = Math.min(Math.round((newCredits / 30) * 100), 100);

    console.log("Updating enrollment:", {
      currentCredits: currentEnrollment.credits,
      creditValue: credit_value,
      newCredits,
      newProgress,
    });

    await q(
      `
      UPDATE student_enrolments
      SET credits = $1, progress = $2
      WHERE student_id = $3 AND course_id = $4
    `,
      [newCredits, newProgress, student_id, course_id]
    );

    // If course is completed (30 credits), create course completion record
    if (newCredits >= 30) {
      console.log("Course completed! Creating completion record...");

      // Check if course completion record already exists
      const existingCourseCompletion = await q(
        `
        SELECT id FROM course_completions 
        WHERE student_id = $1 AND course_id = $2
      `,
        [student_id, course_id]
      );

      if (existingCourseCompletion.rows.length === 0) {
        await q(
          `
          INSERT INTO course_completions (student_id, course_id, total_credits_earned, completion_status)
          VALUES ($1, $2, $3, 'completed')
        `,
          [student_id, course_id, newCredits]
        );
      }

      // Update enrollment status to completed
      await q(
        `
        UPDATE student_enrolments
        SET status = 'completed'
        WHERE student_id = $1 AND course_id = $2
      `,
        [student_id, course_id]
      );
    }

    const response = {
      message: "Lesson completed successfully",
      completion: completionResult.rows[0],
      newCredits,
      newProgress,
      courseCompleted: newCredits >= 30,
      lessonTitle: title,
    };

    console.log("Sending success response:", response);
    return res.json(response);
  } catch (e) {
    console.error("Error in markLessonComplete:", e);
    console.error("Stack trace:", e.stack);
    return res.status(500).json({
      message: "Internal server error",
      error: e.message,
    });
  }
}
// Check if a lesson is completed by a student
export async function checkLessonCompletion(req, res, next) {
  try {
    const { lessonId, studentId } = req.params;

    const result = await q(
      `SELECT id, completed_at, credits_earned 
       FROM lesson_completions 
       WHERE student_id = $1 AND lesson_id = $2`,
      [studentId, lessonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        completed: false,
        message: "Lesson not completed",
      });
    }

    return res.json({
      completed: true,
      completion: result.rows[0],
    });
  } catch (e) {
    console.error("Error checking lesson completion:", e);
    next(e);
  }
}

// Check if student meets lesson prerequisites
export async function checkLessonPrerequisites(req, res, next) {
  try {
    const { lessonId, studentId } = req.params;

    // Get lesson details including prerequisites
    const lessonResult = await q(
      `SELECT l.prerequisites, l.title, cl.course_id 
       FROM lessons l
       LEFT JOIN course_lessons cl ON l.id = cl.lesson_id
       WHERE l.id = $1 AND l.status IN ('published', 'archived')`,
      [lessonId]
    );

    if (lessonResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Lesson not found or not available" });
    }

    const { prerequisites, title, course_id } = lessonResult.rows[0];

    // If no prerequisites, access is allowed
    if (!prerequisites || prerequisites.trim() === "") {
      return res.json({
        accessAllowed: true,
        unmetPrerequisites: [],
        lessonTitle: title,
      });
    }

    // Parse prerequisites - handle both JSON array format and comma-separated format
    let prerequisiteIds = [];
    try {
      // Try parsing as JSON first (new format)
      const parsed = JSON.parse(prerequisites);
      if (Array.isArray(parsed)) {
        prerequisiteIds = parsed.filter(
          (id) => id && typeof id === "string" && id.trim().length > 0
        );
      }
    } catch (e) {
      // Fall back to comma/newline separated format (legacy format)
      prerequisiteIds = prerequisites
        .split(/[,\n\r;]+/)
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
    }

    if (prerequisiteIds.length === 0) {
      return res.json({
        accessAllowed: true,
        unmetPrerequisites: [],
        lessonTitle: title,
      });
    }

    // Get prerequisite lessons details and check completion status
    // Handle both UUID format (new) and lesson_id format (legacy)
    const prerequisiteResults = await q(
      `SELECT l.id, l.lesson_id, l.title,
              CASE WHEN lc.student_id IS NOT NULL THEN true ELSE false END as completed
       FROM lessons l
       LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id AND lc.student_id = $1
       WHERE l.id::text = ANY($2::text[]) OR l.lesson_id = ANY($2::text[])
       ORDER BY l.title`,
      [studentId, prerequisiteIds]
    );

    const unmetPrerequisites = prerequisiteResults.rows.filter(
      (req) => !req.completed
    );
    const accessAllowed = unmetPrerequisites.length === 0;

    return res.json({
      accessAllowed,
      unmetPrerequisites: unmetPrerequisites.map((req) => ({
        id: req.id,
        lesson_id: req.lesson_id,
        title: req.title,
      })),
      allPrerequisites: prerequisiteResults.rows.map((req) => ({
        id: req.id,
        lesson_id: req.lesson_id,
        title: req.title,
        completed: req.completed,
      })),
      lessonTitle: title,
    });
  } catch (e) {
    console.error("Error checking lesson prerequisites:", e);
    next(e);
  }
}
