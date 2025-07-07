
-- Create a trigger to automatically create student balance entries when a new student is added
CREATE OR REPLACE FUNCTION public.create_student_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a new student balance entry with current_balance = 0
  INSERT INTO public.student_balances (
    student_id,
    current_balance,
    total_paid,
    total_fees,
    status
  ) VALUES (
    NEW.id,
    0.00,
    0.00,
    COALESCE(NEW.fees, 0.00),
    'pending'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after a new student is inserted
CREATE TRIGGER on_student_created
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.create_student_balance();
