-- Remove any existing unique constraint on student_id alone
-- and create a composite unique constraint on (user_id, student_id)

-- First, let's add a composite unique constraint
ALTER TABLE public.students 
ADD CONSTRAINT unique_student_id_per_user 
UNIQUE (user_id, student_id);

-- If there was a global unique constraint on student_id, it would be removed by the above
-- This allows each user to have their own sequence: User A can have student IDs 1,2,3 and User B can also have 1,2,3