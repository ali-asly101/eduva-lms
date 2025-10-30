ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS lesson_id UUID;

ALTER TABLE classrooms
ADD CONSTRAINT classrooms_lesson_id_fkey
FOREIGN KEY (lesson_id)
REFERENCES lessons(id)
ON DELETE CASCADE;
