-- 004_lessons_manual_id_rollback.sql
-- Restore auto-generated lesson_id behavior

-- 1) Remove "not blank" constraint
ALTER TABLE lessons
  DROP CONSTRAINT IF EXISTS chk_lessons_lesson_id_not_blank;

-- 2) Recreate the auto-generation function
CREATE OR REPLACE FUNCTION generate_lesson_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lesson_id IS NULL OR btrim(NEW.lesson_id) = '' THEN
    NEW.lesson_id := 'LESSON_' || lpad(nextval('lesson_id_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Recreate the trigger
DROP TRIGGER IF EXISTS trg_generate_lesson_id ON lessons;

CREATE TRIGGER trg_generate_lesson_id
  BEFORE INSERT ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION generate_lesson_id();
