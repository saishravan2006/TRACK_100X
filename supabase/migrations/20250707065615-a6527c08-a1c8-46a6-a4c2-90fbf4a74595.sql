
-- Add fees column to students table
ALTER TABLE public.students ADD COLUMN fees DECIMAL(10,2) DEFAULT 0.00;

-- Create classes table to store class information with fees
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on classes table
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for classes table
CREATE POLICY "Allow all operations for authenticated users" ON public.classes
  FOR ALL USING (true);

-- Update student_balances to properly calculate total_fees based on student fees
CREATE OR REPLACE FUNCTION update_student_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Get student fees
  DECLARE
    student_fees DECIMAL(10,2);
  BEGIN
    SELECT fees INTO student_fees FROM public.students WHERE id = NEW.student_id;
    
    -- Insert or update student balance
    INSERT INTO public.student_balances (student_id, current_balance, total_paid, total_fees, last_payment_date)
    VALUES (
      NEW.student_id,
      CASE 
        WHEN NEW.status = 'PAID' THEN student_fees - NEW.amount
        WHEN NEW.status = 'EXCESS' THEN NEW.amount - student_fees
        ELSE student_fees
      END,
      CASE WHEN NEW.status = 'PAID' THEN NEW.amount ELSE 0 END,
      student_fees,
      CASE WHEN NEW.status = 'PAID' THEN NEW.payment_date ELSE NULL END
    )
    ON CONFLICT (student_id) DO UPDATE SET
      total_paid = student_balances.total_paid + CASE WHEN NEW.status = 'PAID' THEN NEW.amount ELSE 0 END,
      total_fees = student_fees,
      current_balance = student_fees - (student_balances.total_paid + CASE WHEN NEW.status = 'PAID' THEN NEW.amount ELSE 0 END),
      last_payment_date = CASE WHEN NEW.status = 'PAID' THEN NEW.payment_date ELSE student_balances.last_payment_date END,
      updated_at = now();
      
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly data (payments and balances)
CREATE OR REPLACE FUNCTION reset_monthly_data()
RETURNS VOID AS $$
BEGIN
  -- Archive current month's payments to a backup table (optional)
  CREATE TABLE IF NOT EXISTS public.payments_archive (LIKE public.payments INCLUDING ALL);
  
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
$$ LANGUAGE plpgsql;
