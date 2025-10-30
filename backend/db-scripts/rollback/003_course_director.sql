-- ==========================================
-- ROLLBACK DDL: Revert director_id migration
-- ==========================================

-- 1. Make director_id nullable (in case it's already set NOT NULL)
ALTER TABLE courses 
ALTER COLUMN director_id DROP NOT NULL;

-- 2. Clear migrated data (optional, but ensures clean state)
UPDATE courses 
SET director_id = NULL;

-- 3. Drop index
DROP INDEX IF EXISTS idx_courses_director_id;

-- 4. Drop column
ALTER TABLE courses 
DROP COLUMN IF EXISTS director_id;

-- 5. (Optional) Remove the default system instructor if it exists
DELETE FROM instructors 
WHERE email = 'system@eduva.com';
