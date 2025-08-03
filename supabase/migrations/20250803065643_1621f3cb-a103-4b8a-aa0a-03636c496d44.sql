-- Fix the create_student_balance function to set correct current_balance
CREATE OR REPLACE FUNCTION public.create_student_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert a new student balance entry with current_balance = fees (what they owe)
  INSERT INTO public.student_balances (
    student_id,
    user_id,
    current_balance,
    total_paid,
    total_fees,
    status
  ) VALUES (
    NEW.id,
    NEW.user_id,
    COALESCE(NEW.fees, 0.00), -- Current balance should be what they owe (their fees)
    0.00,
    COALESCE(NEW.fees, 0.00),
    CASE 
      WHEN COALESCE(NEW.fees, 0.00) = 0 THEN 'paid'
      ELSE 'pending'
    END
  );
  
  RETURN NEW;
END;
$function$;

-- Fix the update_balance_status function to handle the case where total_fees = 0
CREATE OR REPLACE FUNCTION public.update_balance_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update status based on current_balance and total_fees
  IF NEW.current_balance = 0 AND NEW.total_fees > 0 THEN
    NEW.status = 'paid';
  ELSIF NEW.current_balance = 0 AND NEW.total_fees = 0 THEN
    NEW.status = 'paid'; -- No fees to pay
  ELSIF NEW.current_balance > 0 THEN
    NEW.status = 'pending';
  ELSE
    NEW.status = 'excess';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically update status when student_balances is updated
DROP TRIGGER IF EXISTS update_student_balance_status ON public.student_balances;
CREATE TRIGGER update_student_balance_status
  BEFORE UPDATE ON public.student_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_balance_status();

-- Create trigger to automatically create balance when student is created
DROP TRIGGER IF EXISTS create_balance_for_new_student ON public.students;
CREATE TRIGGER create_balance_for_new_student
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.create_student_balance();