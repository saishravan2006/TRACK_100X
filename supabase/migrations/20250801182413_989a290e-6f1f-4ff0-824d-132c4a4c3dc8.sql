-- Drop the old unique constraint on student_id alone
ALTER TABLE public.students 
DROP CONSTRAINT IF EXISTS students_student_id_key;

-- The composite unique constraint (user_id, student_id) we added earlier should remain
-- This allows each user to have their own student ID sequence