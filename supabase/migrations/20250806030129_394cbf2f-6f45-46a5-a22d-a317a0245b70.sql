-- Add status column to students table to track active/exited students
ALTER TABLE public.students 
ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- Create a check constraint to ensure status is either 'active' or 'exited'
ALTER TABLE public.students 
ADD CONSTRAINT students_status_check 
CHECK (status IN ('active', 'exited'));