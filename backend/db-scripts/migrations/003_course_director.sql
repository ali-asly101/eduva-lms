-- Add director_id column to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS director_id UUID REFERENCES instructors(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_courses_director_id ON courses(director_id);

-- Migrate existing data (try to match director names to instructor records)
UPDATE courses 
SET director_id = (
    SELECT i.id 
    FROM instructors i 
    WHERE i.first_name = courses.director_first_name 
    AND i.last_name = courses.director_last_name
    LIMIT 1
)
WHERE director_first_name IS NOT NULL 
AND director_last_name IS NOT NULL;

-- For courses that couldn't find a matching instructor, create a default one
INSERT INTO instructors (email, title, first_name, last_name, password_hash)
VALUES ('system@eduva.com', 'System', 'System', 'Administrator', 'unused')
ON CONFLICT (email) DO NOTHING;

-- Update remaining courses to use system director
UPDATE courses 
SET director_id = (
    SELECT id FROM instructors WHERE email = 'system@eduva.com'
)
WHERE director_id IS NULL;

-- Make director_id required
ALTER TABLE courses 
ALTER COLUMN director_id SET NOT NULL;