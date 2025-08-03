import React, { useState, useEffect } from 'react';
import { Search, Upload, DollarSign, RotateCcw, Edit, Trash2, Save, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import AddPaymentForm from './AddPaymentForm';
import ExcelUploadProcessor from './ExcelUploadProcessor';

const PaymentManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentBalances, setStudentBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedCard, setSelectedCard] = useState('all');
  const [showStudentList, setShowStudentList] = useState(false);
  const { toast } = useToast();

  const fetchPayments = async () => {
    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          students (
            name,
            student_id,
            class_name,
            phone
          )
        `)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (studentsError) throw studentsError;

      const { data: balancesData, error: balancesError } = await supabase
        .from('student_balances')
        .select(`
          *,
          students (
            name,
            student_id,
            phone
          )
        `)
        .order('students(name)');

      if (balancesError) throw balancesError;

      setPayments(paymentsData || []);
      setStudents(studentsData || []);
      setStudentBalances(balancesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.students?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.students?.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.amount.toString().includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || payment.method === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    paid: studentBalances.filter(b => b.current_balance <= 0).length,
    pending: studentBalances.filter(b => b.current_balance > 0).length,
    excess: studentBalances.filter(b => b.current_balance < 0).length
  };

  const handleCardClick = (cardType: string) => {
    setSelectedCard(cardType);
    setShowStudentList(true);
  };

  const getFilteredStudentBalances = () => {
    if (selectedCard === 'all') return studentBalances;
    if (selectedCard === 'paid') return studentBalances.filter(balance => balance.current_balance <= 0);
    if (selectedCard === 'pending') return studentBalances.filter(balance => balance.current_balance > 0);
    if (selectedCard === 'excess') return studentBalances.filter(balance => balance.current_balance < 0);
    return studentBalances;
  };

  const sendWhatsAppReminder = (student: any, amount: number) => {
    const message = `Hello ${student.students.name}, this is a gentle reminder that you have a pending payment of ₹${amount} for your classes. Please make the payment at your earliest convenience. Thank you!`;
    const phoneNumber = student.students.phone?.replace(/\D/g, ''); // Remove non-numeric characters
    
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Phone number not found for this student",
        variant: "destructive",
      });
      return;
    }
    
    const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePaymentSaved = async () => {
    await fetchPayments();
    setShowAddForm(false);
  };

  const handleUpdatePayment = async (paymentId: string, updatedData: any) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update(updatedData)
        .eq('id', paymentId);

      if (error) throw error;

      await fetchPayments();
      setEditingPayment(null);
      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive",
      });
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        const { error } = await supabase
          .from('payments')
          .delete()
          .eq('id', paymentId);

        if (error) throw error;

        await fetchPayments();
        toast({
          title: "Success",
          description: "Payment deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting payment:', error);
        toast({
          title: "Error",
          description: "Failed to delete payment",
          variant: "destructive",
        });
      }
    }
  };

  const handleMonthlyReset = async () => {
    try {
      setLoading(true);
      
      // Step 1: Get all current student balances with user filter
      const { data: studentBalances, error: fetchError } = await supabase
        .from('student_balances')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (fetchError) throw fetchError;

      // Step 2: Archive current month's payments before processing
      const { data: currentPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (currentPayments && currentPayments.length > 0) {
        await supabase
          .from('payments_archive')
          .insert(currentPayments);
      }

      // Step 3: Process each student according to the flowchart logic
      for (const balance of studentBalances) {
        const currentBalance = balance.current_balance;
        const monthlyFee = balance.total_fees;
        let newCurrentBalance = 0;
        let newTotalPaid = 0;

        // Determine current status and apply flowchart logic
        if (currentBalance === 0) {
          // PAID: Set to PENDING, Balance = full fee
          newCurrentBalance = monthlyFee;
          newTotalPaid = 0;
        } else if (currentBalance > 0) {
          // PENDING: Add new fee, Status remains PENDING
          newCurrentBalance = currentBalance + monthlyFee;
          newTotalPaid = 0;
        } else if (currentBalance < 0) {
          // EXCESS: Apply excess to new fee
          const excessAmount = Math.abs(currentBalance);
          
          if (excessAmount >= monthlyFee) {
            // Excess >= fee: Mark PAID, Carry forward remainder
            newCurrentBalance = -(excessAmount - monthlyFee);
            newTotalPaid = monthlyFee;
          } else {
            // Excess < fee: Mark PENDING, Balance = fee - excess
            newCurrentBalance = monthlyFee - excessAmount;
            newTotalPaid = 0;
          }
        }

        // Step 4: Update the student balance
        const { error: updateError } = await supabase
          .from('student_balances')
          .update({
            current_balance: newCurrentBalance,
            total_paid: newTotalPaid,
            last_payment_date: newTotalPaid > 0 ? new Date().toISOString().split('T')[0] : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', balance.id);

        if (updateError) throw updateError;
      }

      // Step 5: Delete all payments for current user
      const { error: deleteError } = await supabase
        .from('payments')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (deleteError) throw deleteError;

      await fetchPayments();
      setShowResetConfirm(false);
      
      // Step 6: Display success message
      toast({
        title: "Monthly Reset Complete",
        description: "Student balances have been reset according to their payment status as per the flowchart logic.",
      });
    } catch (error) {
      console.error('Error resetting monthly data:', error);
      toast({
        title: "Error",
        description: "Failed to reset monthly data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const EditablePaymentRow = ({ payment }: any) => {
    const [editData, setEditData] = useState({
      amount: payment.amount,
      payment_date: payment.payment_date,
      method: payment.method,
      remarks: payment.remarks || '',
      transaction_ref: payment.transaction_ref || ''
    });

    return (
      <tr className="border-b border-gray-100">
        <td className="py-3 px-2 text-sm">{payment.students?.name}</td>
        <td className="py-3 px-2">
          <Input
            type="number"
            value={editData.amount}
            onChange={(e) => setEditData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
            className="h-8 text-sm"
          />
        </td>
        <td className="py-3 px-2">
          <Input
            type="date"
            value={editData.payment_date}
            onChange={(e) => setEditData(prev => ({ ...prev, payment_date: e.target.value }))}
            className="h-8 text-sm"
          />
        </td>
        <td className="py-3 px-2">
          <select
            value={editData.method}
            onChange={(e) => setEditData(prev => ({ ...prev, method: e.target.value }))}
            className="h-8 text-sm border border-gray-300 rounded px-2"
          >
            <option value="Excel Upload">Excel Upload</option>
            <option value="Manual Entry">Manual Entry</option>
            <option value="Cash">Cash</option>
            <option value="Online">Online</option>
          </select>
        </td>
        <td className="py-3 px-2">
          <Input
            value={editData.transaction_ref}
            onChange={(e) => setEditData(prev => ({ ...prev, transaction_ref: e.target.value }))}
            placeholder="Transaction Ref"
            className="h-8 text-sm"
          />
        </td>
        <td className="py-3 px-2">
          <div className="flex space-x-1">
            <Button
              size="sm"
              onClick={() => handleUpdatePayment(payment.id, editData)}
              className="h-6 w-6 p-0"
            >
              <Save size={12} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingPayment(null)}
              className="h-6 w-6 p-0"
            >
              <X size={12} />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  const PaymentRow = ({ payment }: any) => (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-2 text-sm font-medium">{payment.students?.name}</td>
      <td className="py-3 px-2 text-sm">₹{payment.amount}</td>
      <td className="py-3 px-2 text-sm">{new Date(payment.payment_date).toLocaleDateString()}</td>
      <td className="py-3 px-2 text-sm">{payment.method}</td>
      <td className="py-3 px-2 text-sm">{payment.transaction_ref || '-'}</td>
      <td className="py-3 px-2">
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditingPayment(payment.id)}
            className="h-6 w-6 p-0"
          >
            <Edit size={12} />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDeletePayment(payment.id)}
            className="h-6 w-6 p-0"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="pb-20 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052cc] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header - Updated to match other pages */}
      <div className="bg-gradient-to-r from-white to-blue-50 px-4 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#0052cc] to-blue-600 rounded-full flex items-center justify-center">
                <DollarSign size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-black">Payment Manager</h1>
            </div>
            <p className="text-gray-600 text-sm pl-11">Track and manage student payments</p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div 
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-3 text-center cursor-pointer hover:shadow-md transition-all"
            onClick={() => handleCardClick('paid')}
          >
            <div className="text-xl font-bold">{stats.paid}</div>
            <div className="text-xs text-green-100">Paid Students</div>
          </div>
          <div 
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-3 text-center cursor-pointer hover:shadow-md transition-all"
            onClick={() => handleCardClick('pending')}
          >
            <div className="text-xl font-bold">{stats.pending}</div>
            <div className="text-xs text-orange-100">Pending Students</div>
          </div>
          <div 
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-3 text-center cursor-pointer hover:shadow-md transition-all"
            onClick={() => handleCardClick('excess')}
          >
            <div className="text-xl font-bold">{stats.excess}</div>
            <div className="text-xs text-purple-100">Excess Students</div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div 
            className="bg-gradient-to-br from-[#0052cc] to-blue-600 text-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setShowUploadForm(true)}
          >
            <div className="flex items-center justify-center mb-2">
              <Upload size={24} />
            </div>
            <Button className="w-full mb-2 bg-white text-[#0052cc] hover:bg-gray-100">
              Upload Payments
            </Button>
            <p className="text-xs text-blue-100 text-center">Import Paytm statements!</p>
          </div>
          <div 
            className="bg-gradient-to-br from-[#0052cc] to-blue-600 text-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setShowAddForm(true)}
          >
            <div className="flex items-center justify-center mb-2">
              <DollarSign size={24} />
            </div>
            <Button className="w-full mb-2 bg-white text-[#0052cc] hover:bg-gray-100">
              Add Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Filter payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 border-gray-200 focus:border-[#0052cc]"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="px-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
                  <th className="py-3 px-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  editingPayment === payment.id ? 
                    <EditablePaymentRow key={payment.id} payment={payment} /> :
                    <PaymentRow key={payment.id} payment={payment} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Reset Button */}
      <Button 
        onClick={() => setShowResetConfirm(true)}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 shadow-lg z-10 animate-pulse"
      >
        <RotateCcw size={20} />
      </Button>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 m-4 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Are you sure you want to reset?</h3>
            <p className="text-gray-600 mb-6">This will reset all monthly payments and update student balances based on their current status. This action cannot be undone.</p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowResetConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMonthlyReset}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Confirm Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Form */}
      {showAddForm && (
        <AddPaymentForm 
          onClose={() => setShowAddForm(false)}
          onSave={() => {
            fetchPayments();
            setShowAddForm(false);
          }}
        />
      )}

      {/* Excel Upload Form */}
      {showUploadForm && (
        <ExcelUploadProcessor 
          onClose={() => setShowUploadForm(false)}
          onComplete={() => {
            setShowUploadForm(false);
            fetchPayments();
          }}
        />
      )}

      {/* Student List Modal */}
      {showStudentList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full max-h-96 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {selectedCard} Students
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStudentList(false)}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>
            <div className="overflow-y-auto max-h-64">
              {getFilteredStudentBalances().map((balance) => (
                <div key={balance.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{balance.students?.name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedCard === 'paid' && `Paid: ₹${balance.total_paid}`}
                      {selectedCard === 'pending' && `Pending: ₹${balance.current_balance}`}
                      {selectedCard === 'excess' && `Excess: ₹${Math.abs(balance.current_balance)}`}
                    </p>
                  </div>
                  {selectedCard === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => sendWhatsAppReminder(balance, balance.current_balance)}
                      className="ml-3 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <MessageCircle size={14} className="mr-1" />
                      Send Reminder
                    </Button>
                  )}
                </div>
              ))}
              {getFilteredStudentBalances().length === 0 && (
                <p className="text-center text-gray-500 py-4">No {selectedCard} students found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManager;
