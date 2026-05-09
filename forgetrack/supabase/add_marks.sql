-- Add marks columns to attendance table
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS knowledge_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS skill_score DECIMAL(5,2);

-- Update RLS policies to ensure students can see their marks
-- (The existing "students_read_own_attendance" policy already covers this as it selects all columns)
