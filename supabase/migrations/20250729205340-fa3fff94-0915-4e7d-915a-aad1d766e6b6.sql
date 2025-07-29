-- Add user_id columns to all tables for user data isolation
-- 1. Add user_id to students table
ALTER TABLE public.students 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add user_id to classes table  
ALTER TABLE public.classes 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Add user_id to payments table
ALTER TABLE public.payments 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Add user_id to student_balances table
ALTER TABLE public.student_balances 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Add user_id to payment_uploads table
ALTER TABLE public.payment_uploads 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Add user_id to payment_errors table  
ALTER TABLE public.payment_errors 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing data to assign to the first user (if any exists)
-- This is for development purposes - in production, you'd need to handle this differently
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first user ID
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    -- Only update if we found a user
    IF first_user_id IS NOT NULL THEN
        UPDATE public.students SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE public.classes SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE public.payments SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE public.student_balances SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE public.payment_uploads SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE public.payment_errors SET user_id = first_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- Make user_id NOT NULL after updating existing data
ALTER TABLE public.students ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.classes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.student_balances ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.payment_uploads ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.payment_errors ALTER COLUMN user_id SET NOT NULL;

-- Drop existing overly permissive RLS policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.students;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.student_balances;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.payment_uploads;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.payment_errors;

-- Create user-specific RLS policies for students table
CREATE POLICY "Users can view their own students" 
ON public.students FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students" 
ON public.students FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students" 
ON public.students FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students" 
ON public.students FOR DELETE 
USING (auth.uid() = user_id);

-- Create user-specific RLS policies for classes table
CREATE POLICY "Users can view their own classes" 
ON public.classes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own classes" 
ON public.classes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classes" 
ON public.classes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classes" 
ON public.classes FOR DELETE 
USING (auth.uid() = user_id);

-- Create user-specific RLS policies for payments table
CREATE POLICY "Users can view their own payments" 
ON public.payments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" 
ON public.payments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" 
ON public.payments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments" 
ON public.payments FOR DELETE 
USING (auth.uid() = user_id);

-- Create user-specific RLS policies for student_balances table
CREATE POLICY "Users can view their own student balances" 
ON public.student_balances FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own student balances" 
ON public.student_balances FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own student balances" 
ON public.student_balances FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own student balances" 
ON public.student_balances FOR DELETE 
USING (auth.uid() = user_id);

-- Create user-specific RLS policies for payment_uploads table
CREATE POLICY "Users can view their own payment uploads" 
ON public.payment_uploads FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment uploads" 
ON public.payment_uploads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment uploads" 
ON public.payment_uploads FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment uploads" 
ON public.payment_uploads FOR DELETE 
USING (auth.uid() = user_id);

-- Create user-specific RLS policies for payment_errors table
CREATE POLICY "Users can view their own payment errors" 
ON public.payment_errors FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment errors" 
ON public.payment_errors FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment errors" 
ON public.payment_errors FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment errors" 
ON public.payment_errors FOR DELETE 
USING (auth.uid() = user_id);

-- Update triggers to include user_id
-- Drop the existing trigger function and recreate with user_id support
DROP TRIGGER IF EXISTS update_student_balance_trigger ON public.payments;
DROP FUNCTION IF EXISTS public.update_student_balance();

CREATE OR REPLACE FUNCTION public.update_student_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Get student fees
  DECLARE
    student_fees DECIMAL(10,2);
  BEGIN
    SELECT fees INTO student_fees FROM public.students WHERE id = NEW.student_id AND user_id = NEW.user_id;
    
    -- Insert or update student balance (without status as it's auto-calculated)
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
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER update_student_balance_trigger
AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_student_balance();

-- Update create_student_balance function to include user_id
DROP TRIGGER IF EXISTS create_student_balance_trigger ON public.students;
DROP FUNCTION IF EXISTS public.create_student_balance();

CREATE OR REPLACE FUNCTION public.create_student_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Insert a new student balance entry with current_balance = 0
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
    0.00,
    0.00,
    COALESCE(NEW.fees, 0.00),
    'pending'
  );
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER create_student_balance_trigger
AFTER INSERT ON public.students
FOR EACH ROW EXECUTE FUNCTION public.create_student_balance();

-- Update other functions to include user_id context
CREATE OR REPLACE FUNCTION public.recalculate_payment_status(student_uuid uuid, user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  balance DECIMAL(10,2);
BEGIN
  -- Get current balance for the specific user's student
  SELECT current_balance INTO balance 
  FROM public.student_balances 
  WHERE student_id = student_uuid AND user_id = user_uuid;
  
  -- Update payment status based on balance for the specific user
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