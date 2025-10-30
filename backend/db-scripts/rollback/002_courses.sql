-- ==========================================
-- ROLLBACK FILE 2 - COURSES AND DEPENDENCIES
-- ==========================================
-- This rollbacks migration file 2 (courses.sql)
-- ==========================================

-- Drop views first
DROP VIEW IF EXISTS student_prerequisite_status;
DROP VIEW IF EXISTS course_catalog;

-- Drop triggers
DROP TRIGGER IF EXISTS trg_generate_classroom_id ON classrooms;
DROP TRIGGER IF EXISTS trg_generate_lesson_id ON lessons;

-- Drop functions
DROP FUNCTION IF EXISTS generate_classroom_id();
DROP FUNCTION IF EXISTS generate_lesson_id();

-- Drop sequences
DROP SEQUENCE IF EXISTS classroom_id_seq;
DROP SEQUENCE IF EXISTS lesson_id_seq;

-- Drop indexes (all the new ones from your DDL)
DROP INDEX IF EXISTS idx_course_lessons_course_id;
DROP INDEX IF EXISTS idx_course_lessons_lesson_id;
DROP INDEX IF EXISTS idx_course_prerequisites_course_id;
DROP INDEX IF EXISTS idx_course_prerequisites_prerequisite_id;
DROP INDEX IF EXISTS idx_course_completions_student_id;
DROP INDEX IF EXISTS idx_course_completions_course_id;
DROP INDEX IF EXISTS idx_course_completions_completed_at;
DROP INDEX IF EXISTS idx_course_completions_status;
DROP INDEX IF EXISTS idx_student_enrolments_status;
DROP INDEX IF EXISTS idx_courses_status;
DROP INDEX IF EXISTS idx_lessons_designer_id;
DROP INDEX IF EXISTS idx_student_enrolments_date_enrolled;
DROP INDEX IF EXISTS idx_lesson_completions_lesson_id;
DROP INDEX IF EXISTS idx_lesson_completions_student_id;
DROP INDEX IF EXISTS idx_classrooms_course_id;
DROP INDEX IF EXISTS idx_lessons_status;
DROP INDEX IF EXISTS idx_lessons_course_id;

-- Drop tables in dependency order
-- 1. Drop tables that reference other tables first
DROP TABLE IF EXISTS course_completions;
DROP TABLE IF EXISTS lesson_completions;
DROP TABLE IF EXISTS course_prerequisites;
DROP TABLE IF EXISTS classroom_supervisors;
DROP TABLE IF EXISTS student_enrolments;
DROP TABLE IF EXISTS instructor_courses;
DROP TABLE IF EXISTS course_lessons;


-- 2. Drop tables that reference base tables
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS classrooms;

-- 3. Drop base tables
DROP TABLE IF EXISTS courses;