-- Complete Database Reset Migration
-- This migration drops all existing tables and recreates them with the correct structure
-- based on the actual application requirements

-- Drop all existing tables and their dependencies
DROP TABLE IF EXISTS public.payment_errors CASCADE;
DROP TABLE IF EXISTS public.payment_uploads CASCADE;
DROP TABLE IF EXISTS public.student_balances CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.payments_archive CASCADE;

-- Drop all existing functions and triggers
DROP TRIGGER IF EXISTS update_student_balance_trigger ON public.payments;
DROP FUNCTION IF EXISTS public.update_student_balance() CASCADE;
DROP FUNCTION IF EXISTS public.recalculate_payment_status(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.reset_monthly_data() CASCADE;

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  class_name TEXT NOT NULL,
  fees DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL,
  location TEXT NOT NULL,
  fees DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  start_time TIME,
  end_time TIME,
  date DATE,
  notes TEXT,
  repeat_days TEXT[], -- Array to store days like ['monday', 'wednesday', 'friday']
  class_type TEXT NOT NULL CHECK (class_type IN ('single', 'recurring')) DEFAULT 'single',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('PAID', 'PENDING', 'EXCESS')) DEFAULT 'PAID',
  method TEXT NOT NULL CHECK (method IN ('Excel Upload', 'Manual Entry', 'Cash', 'Online', 'Bank Transfer')) DEFAULT 'Manual Entry',
  remarks TEXT,
  transaction_ref TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_balances table
CREATE TABLE public.student_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
  current_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_fees DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  last_payment_date DATE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_uploads table
CREATE TABLE public.payment_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_records INTEGER NOT NULL DEFAULT 0,
  processed_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')) DEFAULT 'PROCESSING',
  error_log JSONB,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_errors table
CREATE TABLE public.payment_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES public.payment_uploads(id) ON DELETE CASCADE,
  row_number INTEGER,
  student_reference TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  raw_data JSONB,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments archive table for monthly resets
CREATE TABLE public.payments_archive (
  LIKE public.payments INCLUDING ALL
);

-- Enable Row Level Security on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments_archive ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for students table
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

-- Create RLS policies for classes table
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

-- Create RLS policies for payments table
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

-- Create RLS policies for student_balances table
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

-- Create RLS policies for payment_uploads table
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

-- Create RLS policies for payment_errors table
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

-- Create RLS policies for payments_archive table
CREATE POLICY "Users can view their own archived payments" 
ON public.payments_archive FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own archived payments" 
ON public.payments_archive FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update student balance when payment is inserted
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
END;
$function$;

-- Create trigger for payment balance updates
CREATE TRIGGER update_student_balance_trigger
AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_student_balance();

-- Create function to recalculate payment status based on balance
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

-- Create function to reset monthly data (payments and balances)
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

-- Create indexes for better performance
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_students_student_id ON public.students(student_id);
CREATE INDEX idx_classes_user_id ON public.classes(user_id);
CREATE INDEX idx_classes_date ON public.classes(date);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_student_id ON public.payments(student_id);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX idx_student_balances_user_id ON public.student_balances(user_id);
CREATE INDEX idx_payment_uploads_user_id ON public.payment_uploads(user_id);
CREATE INDEX idx_payment_errors_user_id ON public.payment_errors(user_id);

-- Add comments for documentation
COMMENT ON TABLE public.students IS 'Stores student information with user isolation';
COMMENT ON TABLE public.classes IS 'Stores class schedules and information';
COMMENT ON TABLE public.payments IS 'Stores all payment transactions';
COMMENT ON TABLE public.student_balances IS 'Tracks current balance for each student';
COMMENT ON TABLE public.payment_uploads IS 'Tracks Excel upload sessions';
COMMENT ON TABLE public.payment_errors IS 'Stores errors from failed payment uploads';
COMMENT ON TABLE public.payments_archive IS 'Archive table for monthly payment resets';

COMMENT ON COLUMN public.students.user_id IS 'References auth.users for data isolation';
COMMENT ON COLUMN public.students.fees IS 'Monthly fees for the student';
COMMENT ON COLUMN public.classes.repeat_days IS 'Array of weekday names for recurring classes';
COMMENT ON COLUMN public.payments.status IS 'Payment status: PAID, PENDING, or EXCESS';
COMMENT ON COLUMN public.payments.method IS 'Payment method used';