
-- ==========================================
-- CLASSROOMS TABLE (Required for Sprint 1)
-- ==========================================

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    director_first_name TEXT,
    director_last_name TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by UUID,        -- instructor who first created
    modified_at TIMESTAMP,
    modified_by UUID,        -- instructor who last modified
    total_credits INTEGER DEFAULT 30,
    total_lessons INTEGER DEFAULT 0 -- Then progress could be calculated: completed_lessons / total_lessons * 100
);
CREATE TABLE IF NOT EXISTS classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id TEXT UNIQUE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    duration_weeks INTEGER NOT NULL CHECK (duration_weeks IN (2, 3, 4)),
    max_capacity INTEGER DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by UUID REFERENCES instructors(id),
    modified_at TIMESTAMP,
    modified_by UUID REFERENCES instructors(id)
);


CREATE TABLE IF NOT EXISTS student_enrolments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    date_enrolled TIMESTAMP DEFAULT now(),
    classroom_id UUID REFERENCES classrooms(id),
    progress INTEGER NOT NULL,
    status TEXT NOT NULL,
    credits INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (student_id, course_id)
);

CREATE TABLE IF NOT EXISTS instructor_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
-- ==========================================
-- SPRINT 1 DATABASE SCHEMA - ESSENTIAL TABLES
-- ==========================================

-- ==========================================
-- LESSONS TABLE (Required for Sprint 1)
-- ==========================================
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id TEXT UNIQUE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    objectives TEXT,
    reading_list TEXT,
    effort_estimate INTEGER, -- in minutes
    prerequisites TEXT,
    designer_id UUID REFERENCES instructors(id),
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'archived'
    assignments TEXT,
    credit_value INTEGER DEFAULT 0,
    content_type TEXT, -- 'article', 'video'
    content_url TEXT, -- for videos or external links
    content_body TEXT, -- for articles/text content
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by UUID REFERENCES instructors(id),
    modified_at TIMESTAMP,
    modified_by UUID REFERENCES instructors(id)
);

-- ==========================================
-- CLASSROOM SUPERVISORS (Many-to-Many)
-- ==========================================
CREATE TABLE IF NOT EXISTS classroom_supervisors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(classroom_id, instructor_id)
);
-- ==========================================
-- COURSE PREREQUISITES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS course_prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    prerequisite_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by UUID REFERENCES instructors(id),
    
    -- Ensure a course can't be a prerequisite for itself
    CONSTRAINT chk_no_self_prerequisite CHECK (course_id != prerequisite_course_id),
    
    -- Ensure each prerequisite relationship is unique
    UNIQUE(course_id, prerequisite_course_id)
);

-- ==========================================
-- LESSON COMPLETIONS (Student Progress)
-- ==========================================
CREATE TABLE IF NOT EXISTS lesson_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMP NOT NULL DEFAULT now(),
    credits_earned INTEGER DEFAULT 0,
    UNIQUE(student_id, lesson_id)
);

-- ==========================================
-- COURSE COMPLETIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS course_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completed_at TIMESTAMP NOT NULL DEFAULT now(),
    final_grade DECIMAL(5,2), -- e.g., 85.50 for 85.5%
    completion_status TEXT NOT NULL DEFAULT 'completed' CHECK (completion_status IN ('completed', 'failed', 'incomplete')),
    total_credits_earned INTEGER DEFAULT 0,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_number TEXT,
    
    -- Ensure each student can only complete a course once
    UNIQUE(student_id, course_id)
);
-- Add this table to your database
CREATE TABLE IF NOT EXISTS course_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    created_by UUID REFERENCES instructors(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(course_id, lesson_id)
);



-- ==========================================
-- UPDATE EXISTING TABLES FOR SPRINT 1
-- ==========================================


-- Fix the courses table status to match user stories (Active/Inactive/Draft)
-- Update any existing 'published' status to 'active'
UPDATE courses SET status = 'active' WHERE status = 'published';
ALTER TABLE courses ADD CONSTRAINT chk_status 
CHECK (status IN ('active', 'inactive', 'draft'));

ALTER TABLE lessons ADD CONSTRAINT chk_lesson_status 
CHECK (status IN ('draft', 'published', 'archived'));

ALTER TABLE lessons ADD CONSTRAINT chk_content_type 
CHECK (content_type IN ('article', 'video'));

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
-- Add these for better query performance
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_course_id ON course_prerequisites(course_id);
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_prerequisite_id ON course_prerequisites(prerequisite_course_id);

CREATE INDEX IF NOT EXISTS idx_course_completions_student_id ON course_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_course_completions_course_id ON course_completions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_completions_completed_at ON course_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_course_completions_status ON course_completions(completion_status);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_lesson_id ON course_lessons(lesson_id);

CREATE INDEX idx_student_enrolments_status ON student_enrolments(status);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_lessons_designer_id ON lessons(designer_id);
CREATE INDEX idx_student_enrolments_date_enrolled ON student_enrolments(date_enrolled);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_classrooms_course_id ON classrooms(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_student_id ON lesson_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson_id ON lesson_completions(lesson_id);

-- ==========================================
-- AUTO-GENERATE IDs
-- ==========================================

-- Lesson ID sequence
CREATE SEQUENCE IF NOT EXISTS lesson_id_seq START 1000;

CREATE OR REPLACE FUNCTION generate_lesson_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lesson_id IS NULL OR NEW.lesson_id = '' THEN
    NEW.lesson_id := 'LESSON_' || lpad(nextval('lesson_id_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_lesson_id ON lessons;
CREATE TRIGGER trg_generate_lesson_id
  BEFORE INSERT ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION generate_lesson_id();

-- Classroom ID sequence
CREATE SEQUENCE IF NOT EXISTS classroom_id_seq START 1000;

CREATE OR REPLACE FUNCTION generate_classroom_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.classroom_id IS NULL OR NEW.classroom_id = '' THEN
    NEW.classroom_id := 'CLASSROOM_' || lpad(nextval('classroom_id_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_classroom_id ON classrooms;
CREATE TRIGGER trg_generate_classroom_id
  BEFORE INSERT ON classrooms
  FOR EACH ROW
  EXECUTE FUNCTION generate_classroom_id();

-- ==========================================
-- COURSE CATALOG VIEW (For Sprint 1 enrollment)
-- ==========================================
CREATE OR REPLACE VIEW course_catalog AS
SELECT 
    c.id,
    c.course_id,
    c.title,
    c.description,
    c.director_first_name,
    c.director_last_name,
    c.status,
    c.total_credits,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'published') as lesson_count,
    COUNT(DISTINCT cl.id) FILTER (WHERE cl.status = 'active') as active_classrooms
FROM courses c
LEFT JOIN lessons l ON c.id = l.course_id
LEFT JOIN classrooms cl ON c.id = cl.course_id
GROUP BY c.id, c.course_id, c.title, c.description, c.director_first_name, c.director_last_name, c.status, c.total_credits;


CREATE OR REPLACE VIEW student_prerequisite_status AS
SELECT 
    s.id as student_id,
    c.id as course_id,
    c.title as course_title,
    cp.prerequisite_course_id,
    prereq.title as prerequisite_title,
    CASE 
        WHEN cc.student_id IS NOT NULL THEN true 
        ELSE false 
    END as prerequisite_completed
FROM students s
CROSS JOIN courses c
LEFT JOIN course_prerequisites cp ON c.id = cp.course_id
LEFT JOIN courses prereq ON cp.prerequisite_course_id = prereq.id
LEFT JOIN course_completions cc ON s.id = cc.student_id 
    AND cp.prerequisite_course_id = cc.course_id 
    AND cc.completion_status = 'completed';
