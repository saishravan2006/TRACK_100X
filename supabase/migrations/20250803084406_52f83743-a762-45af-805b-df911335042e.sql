-- Add missing triggers to restore functionality

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