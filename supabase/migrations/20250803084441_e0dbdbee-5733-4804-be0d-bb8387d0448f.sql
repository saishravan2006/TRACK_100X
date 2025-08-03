-- Clean up existing triggers and recreate them properly

-- Drop all existing triggers
DROP TRIGGER IF EXISTS on_student_created ON public.students;
DROP TRIGGER IF EXISTS update_student_balance_trigger ON public.payments;
DROP TRIGGER IF EXISTS create_balance_for_new_student ON public.students;
DROP TRIGGER IF EXISTS update_balance_on_payment ON public.payments;
DROP TRIGGER IF EXISTS update_student_balance_status ON public.student_balances;

-- Create the correct triggers to restore functionality

-- Trigger to create student balance when a new student is added
CREATE TRIGGER create_student_balance_trigger
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.create_student_balance();

-- Trigger to update student balance when a payment is made
CREATE TRIGGER update_student_balance_trigger
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_balance();

-- Trigger to update balance status when balance is modified
CREATE TRIGGER update_balance_status_trigger
  BEFORE UPDATE ON public.student_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_balance_status();