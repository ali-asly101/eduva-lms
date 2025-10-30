// controllers/courses.controller.js
import pool, { q } from "../db.js";

/**
 * Get all courses with director info
 */
// In courses.controller.js - update listCourses function
export async function listCourses(_req, res, next) {
  try {
    const response = await q(`
      SELECT 
        c.*,
        i.first_name as director_first_name,
        i.last_name as director_last_name,
        i.title as director_title,
        i.email as director_email,
        COUNT(DISTINCT cl.lesson_id) as lesson_count,
        COUNT(DISTINCT classroom.id) FILTER (WHERE classroom.status = 'active') as active_classrooms
      FROM courses c
      LEFT JOIN instructors i ON c.director_id = i.id
      LEFT JOIN course_lessons cl ON c.id = cl.course_id
      LEFT JOIN classrooms classroom ON c.id = classroom.course_id
      GROUP BY c.id, i.id, i.first_name, i.last_name, i.title, i.email
      ORDER BY c.created_at DESC
    `);
    return res.status(200).json(response.rows);
  } catch (e) {
    console.error("Error in listCourses:", e);
    next(e);
  }
}
/**
 * Create a new course
 */
export async function createCourse(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      course_id,
      title,
      description,
      director_id,
      status,
      lessons, // Array of lesson titles
      instructorId,
    } = req.body;

    const created_by = req.user?.id ?? instructorId ?? null;
    const modified_by = created_by;

    const courseResponse = await client.query(
      `INSERT INTO courses
         (course_id, title, description, director_id, total_credits, total_lessons, status, created_by,
         modified_by, modified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
       RETURNING *`,
      [
        course_id,
        title,
        description,
        director_id,
        30,
        lessons?.length || 0,
        status || "draft",
        created_by,
        modified_by,
      ]
    );

    const newCourse = courseResponse.rows[0];

    if (lessons && lessons.length > 0) {
      for (const lessonTitle of lessons) {
        const lessonId = lessonTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        const lessonResponse = await client.query(
          `INSERT INTO lessons (lesson_id, title, designer_id, created_by)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [lessonId, lessonTitle, created_by, created_by]
        );
        const newLessonId = lessonResponse.rows[0].id;

        await client.query(
          `INSERT INTO course_lessons (course_id, lesson_id, created_by)
           VALUES ($1, $2, $3)`,
          [newCourse.id, newLessonId, created_by]
        );
      }
    }

    await client.query("COMMIT");
    return res.status(201).json(newCourse);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error in createCourse:", e);
    if (e.code === "23505") {
      return res.status(409).json({ message: "Course ID already exists" });
    }
    if (e.code === "23503") {
      return res.status(400).json({ message: "Invalid director_id." });
    }
    next(e);
  } finally {
    client.release();
  }
}

/**
 * Update an existing course
 */
export async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const {
      course_id,
      title,
      description,
      director_id,
      status,
      total_credits,
      total_lessons,
      // Remove modified_by from destructuring
    } = req.body;
    const modified_by =
      req.user?.id ?? req.body.instructorId ?? req.body.modified_by ?? null;
    console.log("Updating course:", id, "with data:", req.body);

    // If director_id is being updated, verify it exists
    if (director_id) {
      const directorCheck = await q(
        "SELECT id FROM instructors WHERE id = $1",
        [director_id]
      );
      if (directorCheck.rows.length === 0) {
        return res
          .status(400)
          .json({ message: "Invalid director_id: instructor not found" });
      }
    }

    const response = await q(
      `UPDATE courses
       SET course_id = COALESCE($1, course_id),
           title = COALESCE($2, title),
           description = COALESCE($3, description),
           director_id = COALESCE($4, director_id),
           status = COALESCE($5, status),
           total_credits = COALESCE($6, total_credits),
           total_lessons = COALESCE($7, total_lessons),
           modified_by = COALESCE($8, modified_by),
           modified_at = now()
       WHERE id = $9
       RETURNING *`,
      [
        course_id,
        title,
        description,
        director_id,
        status,
        total_credits,
        total_lessons,
        modified_by,
        id,
      ]
    );

    if (response.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    console.log("Course updated successfully:", response.rows[0]);
    return res.json(response.rows[0]);
  } catch (e) {
    console.error("Error in updateCourse:", e);
    if (e.code === "23505") {
      return res
        .status(409)
        .json({ message: "A course with this ID already exists." });
    }
    if (e.code === "23503") {
      return res.status(400).json({ message: "Invalid director_id." });
    }
    next(e);
  }
}

/**
 * Delete a course
 */
export async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;

    // Check if course has any enrollments before deleting
    const enrollmentCheck = await q(
      "SELECT COUNT(*) as count FROM student_enrolments WHERE course_id = $1",
      [id]
    );

    if (parseInt(enrollmentCheck.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Cannot delete course with existing enrollments",
      });
    }

    const response = await q("DELETE FROM courses WHERE id=$1 RETURNING id", [
      id,
    ]);

    if (response.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.status(204).end();
  } catch (e) {
    console.error("Error in deleteCourse:", e);
    next(e);
  }
}

/**
 * Get all instructors (for dropdown)
 */
export async function getInstructors(req, res, next) {
  try {
    const { rows } = await q(`
      SELECT id, first_name, last_name, email, title
      FROM instructors 
      ORDER BY first_name, last_name
    `);

    return res.json(rows);
  } catch (e) {
    console.error("Error in getInstructors:", e);
    next(e);
  }
}

/**
 * Get classrooms for a course
 */
export async function getClassroomsForCourse(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await q(
      `
      SELECT 
        cl.*,
        COUNT(se.student_id) as enrolled_count,
        COALESCE(
          json_agg(
            json_build_object(
              'id', i.id,
              'first_name', i.first_name, 
              'last_name', i.last_name,
              'email', i.email
            )
          ) FILTER (WHERE i.id IS NOT NULL), 
          '[]'
        ) as supervisors
      FROM classrooms cl
      LEFT JOIN classroom_supervisors cs ON cl.id = cs.classroom_id
      LEFT JOIN instructors i ON cs.instructor_id = i.id
      LEFT JOIN student_enrolments se ON cl.id = se.classroom_id
      WHERE cl.course_id = $1 AND cl.status = 'active'
      GROUP BY cl.id
      ORDER BY cl.created_at DESC
    `,
      [id]
    );

    return res.json(rows);
  } catch (e) {
    console.error("Error in getClassroomsForCourse:", e);
    next(e);
  }
}

/**
 * Get course prerequisites
 */
export async function getCoursePrerequisites(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await q(
      `
      SELECT 
        cp.id,
        cp.prerequisite_course_id,
        c.title as prerequisite_title,
        c.course_id as prerequisite_course_code
      FROM course_prerequisites cp
      JOIN courses c ON cp.prerequisite_course_id = c.id
      WHERE cp.course_id = $1
      ORDER BY c.title
    `,
      [id]
    );

    return res.json(rows);
  } catch (e) {
    console.error("Error in getCoursePrerequisites:", e);
    next(e);
  }
}

/**
 * Add course prerequisite
 */
export async function addCoursePrerequisite(req, res, next) {
  try {
    const { id } = req.params; // course_id
    const { prerequisite_course_id, created_by } = req.body;

    if (!prerequisite_course_id) {
      return res
        .status(400)
        .json({ message: "prerequisite_course_id is required" });
    }

    const { rows } = await q(
      `
      INSERT INTO course_prerequisites (course_id, prerequisite_course_id, created_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
      [id, prerequisite_course_id, created_by]
    );

    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error("Error in addCoursePrerequisite:", e);
    if (e.code === "23505") {
      return res
        .status(409)
        .json({ message: "Prerequisite relationship already exists" });
    }
    if (e.code === "23503") {
      return res
        .status(400)
        .json({ message: "Invalid course_id or prerequisite_course_id." });
    }
    if (e.code === "23514") {
      return res
        .status(400)
        .json({ message: "Course cannot be a prerequisite for itself" });
    }
    next(e);
  }
}

/**
 * Remove course prerequisite
 */
export async function removeCoursePrerequisite(req, res, next) {
  try {
    const { id, prerequisiteId } = req.params;

    const { rows } = await q(
      "DELETE FROM course_prerequisites WHERE course_id = $1 AND id = $2 RETURNING id",
      [id, prerequisiteId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Prerequisite not found" });
    }

    return res.status(204).end();
  } catch (e) {
    console.error("Error in removeCoursePrerequisite:", e);
    next(e);
  }
}

// Add this function to your existing courses.controller.js file

/**
 * Get lessons for a specific course
 */
export async function getCourseLessons(req, res, next) {
  try {
    const { id } = req.params; // course id

    const { rows } = await q(
      `
      SELECT l.*, 
             i.first_name as designer_first_name, 
             i.last_name as designer_last_name,
             cl.created_at as attached_at
      FROM course_lessons cl
      JOIN lessons l ON cl.lesson_id = l.id
      LEFT JOIN instructors i ON l.designer_id = i.id
      WHERE cl.course_id = $1
      ORDER BY cl.created_at DESC
    `,
      [id]
    );

    return res.json(rows);
  } catch (e) {
    console.error("Error in getCourseLessons:", e);
    next(e);
  }
}

export async function getCourseById(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await q(
      `
      SELECT 
        c.*,
        i.first_name as director_first_name,
        i.last_name as director_last_name,
        i.title as director_title,
        i.email as director_email
      FROM courses c
      LEFT JOIN instructors i ON c.director_id = i.id
      WHERE c.id = $1
    `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json(rows[0]);
  } catch (e) {
    console.error("Error in getCourseById:", e);
    next(e);
  }
}

// ==================== Instructor Dashboard (Legacy) ====================
// Note: These functions are kept for backward compatibility but should use the new authentication

export async function listInstructorCourses(_req, res, next) {
  try {
    const response = await q(
      `
      SELECT ic.course_id, ic.title, ic.status,
             COALESCE(json_agg(ci.instructor_name) FILTER (WHERE ci.instructor_name IS NOT NULL), '[]') AS instructors
      FROM instructor_courses ic
      LEFT JOIN course_instructors ci ON ic.course_id = ci.course_id
      GROUP BY ic.course_id, ic.title, ic.status
      ORDER BY ic.course_id;
      `
    );

    return res.status(200).json(response.rows);
  } catch (e) {
    next(e);
  }
}

export async function createInstructorCourse(req, res, next) {
  const client = await pool.connect();
  try {
    const { course_id, title, status, instructors } = req.body;

    // Auto-generate course_id if not provided
    const finalCourseId = course_id || `COURSE_${Date.now()}`;

    await client.query("BEGIN");

    await client.query(
      `INSERT INTO instructor_courses (course_id, title, status)
       VALUES ($1, $2, $3)`,
      [finalCourseId, title, status]
    );

    if (instructors && instructors.length > 0) {
      for (const name of instructors) {
        await client.query(
          `INSERT INTO course_instructors (course_id, instructor_name)
           VALUES ($1, $2)`,
          [finalCourseId, name]
        );
      }
    }

    await client.query("COMMIT");
    return res
      .status(201)
      .json({ message: "Instructor course created successfully" });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
}

export async function updateInstructorCourse(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params; // course_id
    const { title, status, instructors } = req.body;

    await client.query("BEGIN");

    await client.query(
      `UPDATE instructor_courses
       SET title=$1, status=$2
       WHERE course_id=$3`,
      [title, status, id]
    );

    await client.query(`DELETE FROM course_instructors WHERE course_id=$1`, [
      id,
    ]);

    if (instructors && instructors.length > 0) {
      for (const name of instructors) {
        await client.query(
          `INSERT INTO course_instructors (course_id, instructor_name)
           VALUES ($1, $2)`,
          [id, name]
        );
      }
    }

    await client.query("COMMIT");
    return res.json({ message: "Instructor course updated successfully" });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
}

export async function deleteInstructorCourse(req, res, next) {
  try {
    const { id } = req.params; // course_id
    await q("DELETE FROM instructor_courses WHERE course_id=$1", [id]);
    return res.status(204).end();
  } catch (e) {
    next(e);
  }
}
