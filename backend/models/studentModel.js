// data access layer for student-related queries
// data access layer means to talk to the database.
import { q } from '../db.js';

// Only students can self-sign up; instructor/admin are not allowed to do self-sign up.

/**
 * Returns true if the email belongs to an instructor or admin.
 * Used to block non-student self-signups.
 */
export async function isEmailInstructorOrAdmin(email){
    const { rows } = await q(
        `SELECT
            EXISTS (SELECT 1 FROM instructors WHERE email = $1) AS in_instructors,
            EXISTS (SELECT 1 FROM admins WHERE email = $1) AS in_admins
        `,
        [email]
    );
    return Boolean(rows?.[0]?.in_instructors || rows?.[0]?.in_admins);
}

/**
 * Fetch a student by email (or null if none) - (fetch a student row)
 */
export async function getStudentByEmail(email){
    const { rows } = await q(
        `SELECT id, student_id, email, first_name, last_name,
        title, password_hash, google_id
        FROM students
        WHERE email = $1`,
        [email]
    );
    return rows[0] || null;
}

/**
 * Inserts a new student with a password hash.
 * (self-signup path; caller enforces role === 'student')
 */
export async function createStudentWithPassword({email, tittle, first_name, 
last_name, password_hash}) {
    const { rows } = await q(
        `INSERT INTO students (email, title, first_name, last_name,
        password_hash)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, student_id, email, first_name, last_name, 
        title`,
        [email, title, first_name, last_name, password_hash]
    );
    return rows[0] || null;
}

/**
 * set/attach a password for an existing student; optionally update title.
 * useful when a Google-only student adds a password later.
 */
export async function setStudentPasswordAndMaybeTitle(id, password_hash, title=null){
    const { rows } = await q(
        `UPDATE student
            SET password_hash = $1,
            title = COALESCE($2, title)
        WHERE id = $3
        RETURNING id, student_id, email, first_name, lastname, title
        `,
        [password_hash, title, id]
    );
    return rows[0] || null;
}
