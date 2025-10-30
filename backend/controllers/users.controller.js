// backend/controllers/users.controller.js
import bcrypt from "bcryptjs";
import { q } from "../db.js";

const ROLE_TABLE = {
  student: "students",
  instructor: "instructors",
  admin: "admins",
};

export async function createUser(req, res, next) {
  try {
    let { role, email, title, first_name, last_name, password } = req.body;

    if (!role || !ROLE_TABLE[role]) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (!email || !first_name || !last_name || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    email = String(email).trim().toLowerCase();
    title = (title ?? "").trim();
    first_name = String(first_name).trim();
    last_name = String(last_name).trim();

    const dup = await q("SELECT 1 FROM users WHERE email=$1 LIMIT 1", [email]);
    if (dup.rowCount)
      return res.status(409).json({ message: "Email already exists" });

    const password_hash = await bcrypt.hash(password, 10);
    const table = ROLE_TABLE[role];

    const insertSql = `
      INSERT INTO ${table} (email, password_hash, title, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const { rows: ins } = await q(insertSql, [
      email,
      password_hash,
      title,
      first_name,
      last_name,
    ]);
    const newId = ins[0].id;

    const { rows } = await q(
      `SELECT id, role, user_identifier, email, title, first_name, last_name, created_at
         FROM users
        WHERE id = $1`,
      [newId]
    );
    res.setHeader("Location", `/api/users/${newId}`);
    return res.status(201).json({ user: rows[0] });
  } catch (e) {
    console.error("Error in createUser:", e);
    if (e.code === "23505") {
      return res.status(409).json({ message: "Email already exists" });
    }
    next(e);
  }
}

export async function listUsers(_req, res, next) {
  try {
    const { rows } = await q(`
      SELECT 
        u.id,
        u.role,
        u.user_identifier,
        u.email,
        u.title,
        u.first_name,
        u.last_name,
        u.created_at,
        s.student_id
      FROM users u
      LEFT JOIN students s ON s.id = u.id
      ORDER BY u.created_at DESC
    `);
    return res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await q(
      `SELECT id, role, user_identifier, email, title, first_name, last_name, created_at
         FROM users
        WHERE id = $1`,
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ message: "User not found" });
    return res.json(rows[0]);
  } catch (e) {
    console.error("Error in getUserById:", e);
    next(e);
  }
}

// NEW: student profile summary
export async function getStudentProfile(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await q(
      `
      SELECT
        u.id,
        u.email,
        u.title,
        u.first_name,
        u.last_name,
        COALESCE((
          SELECT COUNT(*) FROM student_enrolments se WHERE se.student_id = u.id
        ), 0) AS courses_enrolled,
        COALESCE((
          SELECT COUNT(DISTINCT ce.classroom_id) FROM classroom_enrolments ce WHERE ce.student_id = u.id
        ), 0) AS classrooms_enrolled,
        COALESCE((
          SELECT COUNT(*) FROM lesson_completions lc WHERE lc.student_id = u.id
        ), 0) AS lessons_completed,
        COALESCE((
          SELECT SUM(se.credits) FROM student_enrolments se WHERE se.student_id = u.id
        ), 0) AS credits_total
      FROM users u
      WHERE u.id = $1 AND u.role = 'student'
      `,
      [id]
    );

    if (!rows.length)
      return res.status(404).json({ message: "Student not found" });

    return res.json(rows[0]);
  } catch (e) {
    console.error("Error in getStudentProfile:", e);
    next(e);
  }
}
