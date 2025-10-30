ALTER TABLE classrooms
DROP CONSTRAINT IF EXISTS classrooms_lesson_id_fkey;

ALTER TABLE classrooms
DROP COLUMN IF EXISTS lesson_id;