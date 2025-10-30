-- 004_lessons_manual_id.sql
-- Switch from auto-generated lesson_id to manual, required lesson_id

-- 1) Drop the trigger that auto-generates lesson_id (if it exists)
DROP TRIGGER IF EXISTS trg_generate_lesson_id ON lessons;

-- 2) Drop the generating function (safe if it doesn't exist)
DROP FUNCTION IF EXISTS generate_lesson_id();

-- 3) Enforce NOT NULL is already on lesson_id; add "not blank" constraint
--    (prevents empty string, spaces-only, etc.)
ALTER TABLE lessons
  DROP CONSTRAINT IF EXISTS chk_lessons_lesson_id_not_blank;

ALTER TABLE lessons
  ADD CONSTRAINT chk_lessons_lesson_id_not_blank
  CHECK (btrim(lesson_id) <> '');

-- 4) (Optional, but helpful) add an index for fast lookups if you frequently search by lesson_id
--    The column is already UNIQUE, so a unique index exists; skip creating a separate one.
--    If you *don’t* have UNIQUE (you do in your DDL), uncomment below.
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_lesson_id ON lessons(lesson_id);

-- No data rewrite needed: existing auto-generated IDs remain valid.
-- From now on, inserts must provide a non-empty lesson_id.
