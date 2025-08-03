-- Fix balance calculation logic

-- First, let's fix the create_student_balance function
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
    COALESCE(NEW.fees, 0.00), -- Current balance = what they owe
    0.00, -- No payments made yet
    COALESCE(NEW.fees, 0.00), -- Total fees = their fees
    CASE 
      WHEN COALESCE(NEW.fees, 0.00) = 0 THEN 'paid'
      ELSE 'pending'
    END
  );
  
  RETURN NEW;
END;
$function$;

-- Fix the update_student_balance function to correctly calculate balance
CREATE OR REPLACE FUNCTION public.update_student_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Get student fees
  DECLARE
    student_fees DECIMAL(10,2);
  BEGIN
    SELECT fees INTO student_fees FROM public.students WHERE id = NEW.student_id AND user_id = NEW.user_id;
    
    -- Insert or update student balance
    INSERT INTO public.student_balances (student_id, user_id, current_balance, total_paid, total_fees, last_payment_date)
    VALUES (
      NEW.student_id,
      NEW.user_id,
      student_fees - NEW.amount, -- Balance = fees owed minus payment
      NEW.amount,
      student_fees,
      NEW.payment_date
    )
    ON CONFLICT (student_id) DO UPDATE SET
      total_paid = student_balances.total_paid + NEW.amount,
      total_fees = student_fees,
      current_balance = student_fees - (student_balances.total_paid + NEW.amount), -- Recalculate: fees - total paid
      last_payment_date = NEW.payment_date,
      updated_at = now();
      
    RETURN NEW;
  END;
END;
$function$;

-- Fix the balance status update function
CREATE OR REPLACE FUNCTION public.update_balance_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update status based on current_balance
  IF NEW.current_balance = 0 THEN
    NEW.status = 'paid';
  ELSIF NEW.current_balance > 0 THEN
    NEW.status = 'pending'; -- They owe money
  ELSE
    NEW.status = 'excess'; -- They paid too much (negative balance)
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger for student balance creation (if it doesn't exist)
DROP TRIGGER IF EXISTS create_balance_for_new_student ON public.students;
CREATE TRIGGER create_balance_for_new_student
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.create_student_balance();

-- Create the trigger for payment updates (if it doesn't exist)
DROP TRIGGER IF EXISTS update_balance_on_payment ON public.payments;
CREATE TRIGGER update_balance_on_payment
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_balance();

-- Create the trigger for balance status updates (if it doesn't exist)
DROP TRIGGER IF EXISTS update_student_balance_status ON public.student_balances;
CREATE TRIGGER update_student_balance_status
  BEFORE INSERT OR UPDATE ON public.student_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_balance_status();

-- Clean up and recalculate all existing balances
-- Reset all balances based on current data
UPDATE public.student_balances 
SET 
  current_balance = (
    SELECT COALESCE(s.fees, 0) - COALESCE(
      (SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = student_balances.student_id AND p.user_id = student_balances.user_id), 
      0
    )
    FROM public.students s 
    WHERE s.id = student_balances.student_id AND s.user_id = student_balances.user_id
  ),
  total_paid = COALESCE(
    (SELECT SUM(p.amount) FROM public.payments p WHERE p.student_id = student_balances.student_id AND p.user_id = student_balances.user_id), 
    0
  ),
  total_fees = (
    SELECT COALESCE(s.fees, 0) 
    FROM public.students s 
    WHERE s.id = student_balances.student_id AND s.user_id = student_balances.user_id
  ),
  updated_at = now();