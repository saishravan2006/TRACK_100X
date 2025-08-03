-- Remove the duplicate trigger that's causing constraint violation
DROP TRIGGER IF EXISTS create_balance_for_new_student ON public.students;