-- ==========================================
-- ROLLBACK FILE 1 - USERS AND BASE TABLES
-- ==========================================
-- This rollbacks migration file 1 (users.sql)
-- Execute in reverse order of creation
-- ==========================================

-- Drop trigger and function for student_id generation
DROP TRIGGER IF EXISTS trg_generate_student_id ON students;
DROP TRIGGER IF EXISTS trg_generate_instructor_id ON instructors;

DROP FUNCTION IF EXISTS generate_student_id();
DROP FUNCTION IF EXISTS generate_instructor_id();

DROP SEQUENCE IF EXISTS student_id_seq;
DROP SEQUENCE IF EXISTS instructor_id_seq;


-- Drop indexes
DROP INDEX IF EXISTS idx_students_student_id;
DROP INDEX IF EXISTS idx_admins_email;
DROP INDEX IF EXISTS idx_instructors_email;
DROP INDEX IF EXISTS idx_students_email;

-- Drop users view
DROP VIEW IF EXISTS users;

-- Drop role-specific tables
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS instructors;
DROP TABLE IF EXISTS students;

-- Drop extension (optional - only if not used elsewhere)
-- DROP EXTENSION IF EXISTS "pgcrypto";