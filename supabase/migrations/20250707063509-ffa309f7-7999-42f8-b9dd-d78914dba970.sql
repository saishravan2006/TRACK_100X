
-- Create students table to store student information
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  class_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table to store all payment transactions
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('PAID', 'PENDING', 'EXCESS')),
  method TEXT NOT NULL CHECK (method IN ('Excel Upload', 'Manual Entry', 'Cash', 'Online')),
  remarks TEXT,
  transaction_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student_balances table to track current balance for each student
CREATE TABLE public.student_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_fees DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  last_payment_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_uploads table to track Excel upload sessions
CREATE TABLE public.payment_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_records INTEGER NOT NULL DEFAULT 0,
  processed_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
  error_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_errors table to track failed transactions during uploads
CREATE TABLE public.payment_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES public.payment_uploads(id) ON DELETE CASCADE,
  row_number INTEGER,
  student_reference TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_errors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for students table
CREATE POLICY "Allow all operations for authenticated users" ON public.students
  FOR ALL USING (true);

-- Create RLS policies for payments table
CREATE POLICY "Allow all operations for authenticated users" ON public.payments
  FOR ALL USING (true);

-- Create RLS policies for student_balances table
CREATE POLICY "Allow all operations for authenticated users" ON public.student_balances
  FOR ALL USING (true);

-- Create RLS policies for payment_uploads table
CREATE POLICY "Allow all operations for authenticated users" ON public.payment_uploads
  FOR ALL USING (true);

-- Create RLS policies for payment_errors table
CREATE POLICY "Allow all operations for authenticated users" ON public.payment_errors
  FOR ALL USING (true);

-- Create function to automatically update student balance when payment is inserted/updated
CREATE OR REPLACE FUNCTION update_student_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update student balance
  INSERT INTO public.student_balances (student_id, current_balance, total_paid, last_payment_date)
  VALUES (
    NEW.student_id,
    CASE 
      WHEN NEW.status = 'PAID' THEN -NEW.amount
      WHEN NEW.status = 'EXCESS' THEN NEW.amount
      ELSE 0
    END,
    CASE WHEN NEW.status = 'PAID' THEN NEW.amount ELSE 0 END,
    CASE WHEN NEW.status = 'PAID' THEN NEW.payment_date ELSE NULL END
  )
  ON CONFLICT (student_id) DO UPDATE SET
    total_paid = student_balances.total_paid + CASE WHEN NEW.status = 'PAID' THEN NEW.amount ELSE 0 END,
    current_balance = student_balances.current_balance + 
      CASE 
        WHEN NEW.status = 'PAID' THEN -NEW.amount
        WHEN NEW.status = 'EXCESS' THEN NEW.amount
        ELSE 0
      END,
    last_payment_date = CASE WHEN NEW.status = 'PAID' THEN NEW.payment_date ELSE student_balances.last_payment_date END,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update student balance
CREATE TRIGGER update_student_balance_trigger
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_student_balance();

-- Create function to recalculate payment status based on balance
CREATE OR REPLACE FUNCTION recalculate_payment_status(student_uuid UUID)
RETURNS VOID AS $$
DECLARE
  balance DECIMAL(10,2);
BEGIN
  -- Get current balance
  SELECT current_balance INTO balance 
  FROM public.student_balances 
  WHERE student_id = student_uuid;
  
  -- Update payment status based on balance
  IF balance > 0 THEN
    -- Student has excess payment
    UPDATE public.payments 
    SET status = 'EXCESS' 
    WHERE student_id = student_uuid AND status != 'PAID';
  ELSIF balance < 0 THEN
    -- Student has pending payment
    UPDATE public.payments 
    SET status = 'PENDING' 
    WHERE student_id = student_uuid AND status != 'PAID';
  END IF;
END;
$$ LANGUAGE plpgsql;
