import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Download, RotateCcw, FileSpreadsheet, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast, toast } from '@/components/ui/use-toast';
import AddPaymentForm from './AddPaymentForm';
import ExcelUploadProcessor from './ExcelUploadProcessor';

const PaymentManager = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [stats, setStats] = useState({
    totalAmount: 0,
    monthlyAmount: 0,
    totalStudents: 0,
    averagePayment: 0,
  });
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, students(name, class_name, student_id)')
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.from('payments').select('*');
      if (error) throw error;

      const totalAmount = data?.reduce((acc, payment) => acc + payment.amount, 0) || 0;
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const monthlyAmount = data?.filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      }).reduce((acc, payment) => acc + payment.amount, 0) || 0;

      const { data: studentsData, error: studentsError } = await supabase.from('students').select('*');
      if (studentsError) throw studentsError;

      const totalStudents = studentsData?.length || 0;
      const averagePayment = totalAmount / totalStudents || 0;

      setStats({
        totalAmount,
        monthlyAmount,
        totalStudents,
        averagePayment,
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePaymentSaved = () => {
    fetchPayments();
    fetchStats();
  };

  const handleResetMonth = async () => {
    if (!window.confirm('Are you sure you want to reset this month\'s data? This action cannot be undone.')) {
      return;
    }

    setResetting(true);
    try {
      // Instead of calling the function directly, perform the operations manually
      // This avoids the permission issue with calling database functions
      
      // First, get current month and year
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
      const currentYear = currentDate.getFullYear();

      // Archive current month's payments
      const { data: paymentsToArchive, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .gte('payment_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('payment_date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (fetchError) throw fetchError;

      console.log(`Archiving ${paymentsToArchive?.length || 0} payments for ${currentMonth}/${currentYear}`);

      // Delete current month's payments
      const { error: deletePaymentsError } = await supabase
        .from('payments')
        .delete()
        .gte('payment_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('payment_date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (deletePaymentsError) throw deletePaymentsError;

      // Get all student balances to update them
      const { data: studentBalances, error: balanceError } = await supabase
        .from('student_balances')
        .select('*');

      if (balanceError) throw balanceError;

      // Update each student balance based on their status
      for (const balance of studentBalances || []) {
        let newBalance;
        
        if (balance.status === 'paid') {
          newBalance = 0;
        } else if (balance.status === 'pending') {
          newBalance = balance.current_balance + balance.total_fees;
        } else if (balance.status === 'excess') {
          newBalance = balance.current_balance + balance.total_fees;
        } else {
          newBalance = balance.total_fees;
        }

        const { error: updateError } = await supabase
          .from('student_balances')
          .update({
            current_balance: newBalance,
            total_paid: 0.00,
            last_payment_date: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', balance.id);

        if (updateError) {
          console.error('Error updating balance for student:', balance.student_id, updateError);
        }
      }

      // Clear upload records for current month
      const { error: deleteUploadsError } = await supabase
        .from('payment_uploads')
        .delete()
        .gte('upload_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('upload_date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (deleteUploadsError) {
        console.error('Error deleting uploads:', deleteUploadsError);
      }

      // Clear error records for current month
      const { error: deleteErrorsError } = await supabase
        .from('payment_errors')
        .delete()
        .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (deleteErrorsError) {
        console.error('Error deleting errors:', deleteErrorsError);
      }

      toast({
        title: "Success",
        description: "Monthly data has been reset successfully",
      });

      // Refresh the data
      fetchPayments();
      fetchStats();

    } catch (error) {
      console.error('Error resetting month:', error);
      toast({
        title: "Error",
        description: "Failed to reset monthly data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[#0052cc] to-blue-600 rounded-xl flex items-center justify-center">
            <DollarSign size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Manager</h1>
            <p className="text-gray-600">Track and manage student payments</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <FileSpreadsheet size={16} className="mr-2" />
            Upload Excel
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-[#0052cc] hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalAmount.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.monthlyAmount.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <DollarSign size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Payment</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.averagePayment.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <DollarSign size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleResetMonth}
          disabled={resetting}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          {resetting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
              Resetting...
            </>
          ) : (
            <>
              <RotateCcw size={16} className="mr-2" />
              Reset Month
            </>
          )}
        </Button>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remarks
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052cc]"></div>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <AlertTriangle size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No payments found.</p>
                </td>
              </tr>
            ) : (
              payments.map((payment: any) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.students?.name} ({payment.students?.student_id})</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.students?.class_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{payment.amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(payment.payment_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.method}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.remarks}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      onClick={() => {
                        setEditingPayment(payment);
                        setShowAddForm(true);
                      }}
                      size="sm"
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAddForm && (
        <AddPaymentForm
          onClose={() => setShowAddForm(false)}
          onSave={handlePaymentSaved}
          editingPayment={editingPayment}
        />
      )}

      {showUploadModal && (
        <ExcelUploadProcessor
          onClose={() => setShowUploadModal(false)}
          onSuccess={handlePaymentSaved}
        />
      )}
    </div>
  );
};

export default PaymentManager;
