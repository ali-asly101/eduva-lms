import express from "express";
import bcrypt from "bcryptjs";
import { q } from "../db.js";

const router = express.Router();

const ROLE_TABLE = {
  student: {
    table: "students",
    select:
      "id, student_id, email, password_hash, title, first_name, last_name",
    normalize: (row) => ({
      id: row.id,
      email: row.email,
      role: "student",
      student_id: row.student_id,
      title: row.title,
      first_name: row.first_name,
      last_name: row.last_name,
    }),
  },
  instructor: {
    table: "instructors",
    select: "id, email, password_hash, title, first_name, last_name",
    normalize: (row) => ({
      id: row.id,
      email: row.email,
      role: "instructor",
      title: row.title,
      first_name: row.first_name,
      last_name: row.last_name,
    }),
  },
  admin: {
    table: "admins",
    select: "id, email, password_hash, title, first_name, last_name",
    normalize: (row) => ({
      id: row.id,
      email: row.email,
      role: "admin",
      title: row.title,
      first_name: row.first_name,
      last_name: row.last_name,
    }),
  },
};

router.post("/login", async (req, res) => {
  let { email, password, role } = req.body || {};
  if (!email || !password || !role) {
    return res.status(400).json({ error: "Email, password, and role are required" });
  }

  role = String(role).trim().toLowerCase();
  email = String(email).trim().toLowerCase();
  const cfg = ROLE_TABLE[role];
  if (!cfg) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const { rows } = await q(`SELECT ${cfg.select} FROM ${cfg.table} WHERE email = $1`, [email]);
    if (!rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const row = rows[0];
    const ok = await bcrypt.compare(password, row.password_hash || "");
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = cfg.normalize(row);
    
    // Create Passport session
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }
      return res.json({ user });
    });

  } catch (e) {
    console.error("Login failed:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;