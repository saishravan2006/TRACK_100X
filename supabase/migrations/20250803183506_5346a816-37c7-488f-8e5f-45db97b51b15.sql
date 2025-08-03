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
  repeat_days TEXT[],
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

-- Create payments archive table
CREATE TABLE public.payments_archive (
  LIKE public.payments INCLUDING ALL
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments_archive ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for students
CREATE POLICY "Users can manage their own students" ON public.students
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for classes
CREATE POLICY "Users can manage their own classes" ON public.classes
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for payments
CREATE POLICY "Users can manage their own payments" ON public.payments
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for student_balances
CREATE POLICY "Users can manage their own student balances" ON public.student_balances
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for payment_uploads
CREATE POLICY "Users can manage their own payment uploads" ON public.payment_uploads
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for payment_errors
CREATE POLICY "Users can manage their own payment errors" ON public.payment_errors
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for payments_archive
CREATE POLICY "Users can manage their own archived payments" ON public.payments_archive
FOR ALL USING (auth.uid() = user_id);

-- Create indexes
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