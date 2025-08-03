-- Create helper functions for automatic balance calculations

-- Function to automatically update student balance when payment is inserted
CREATE OR REPLACE FUNCTION public.update_student_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  student_fees DECIMAL(10,2);
BEGIN
  -- Get student fees
  SELECT fees INTO student_fees FROM public.students WHERE id = NEW.student_id AND user_id = NEW.user_id;
  
  -- Insert or update student balance
  INSERT INTO public.student_balances (student_id, user_id, current_balance, total_paid, total_fees, last_payment_date)
  VALUES (
    NEW.student_id,
    NEW.user_id,
    student_fees - NEW.amount,
    NEW.amount,
    student_fees,
    NEW.payment_date
  )
  ON CONFLICT (student_id) DO UPDATE SET
    total_paid = student_balances.total_paid + NEW.amount,
    total_fees = student_fees,
    current_balance = student_fees - (student_balances.total_paid + NEW.amount),
    last_payment_date = NEW.payment_date,
    updated_at = now();
    
  RETURN NEW;
END;
$function$;

-- Create trigger for payment balance updates
CREATE TRIGGER update_student_balance_trigger
AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_student_balance();

-- Function to recalculate payment status based on balance
CREATE OR REPLACE FUNCTION public.recalculate_payment_status(student_uuid uuid, user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  balance DECIMAL(10,2);
BEGIN
  -- Get current balance
  SELECT current_balance INTO balance 
  FROM public.student_balances 
  WHERE student_id = student_uuid AND user_id = user_uuid;
  
  -- Update payment status based on balance
  IF balance > 0 THEN
    -- Student has excess payment
    UPDATE public.payments 
    SET status = 'EXCESS' 
    WHERE student_id = student_uuid AND user_id = user_uuid AND status != 'PAID';
  ELSIF balance < 0 THEN
    -- Student has pending payment
    UPDATE public.payments 
    SET status = 'PENDING' 
    WHERE student_id = student_uuid AND user_id = user_uuid AND status != 'PAID';
  END IF;
END;
$function$;

-- Function to reset monthly data (payments and balances)
CREATE OR REPLACE FUNCTION public.reset_monthly_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Archive current month's payments to backup table
  INSERT INTO public.payments_archive 
  SELECT * FROM public.payments 
  WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Delete current month's payments
  DELETE FROM public.payments 
  WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Reset student balances to only show fees (no payments)
  UPDATE public.student_balances 
  SET 
    current_balance = total_fees,
    total_paid = 0.00,
    last_payment_date = NULL,
    updated_at = now();
    
  -- Clear upload records for current month
  DELETE FROM public.payment_uploads 
  WHERE EXTRACT(MONTH FROM upload_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM upload_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
  -- Clear error records for current month  
  DELETE FROM public.payment_errors 
  WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
END;
$function$;