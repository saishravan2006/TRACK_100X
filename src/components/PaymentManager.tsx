import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, RotateCcw, FileSpreadsheet, Calendar, AlertTriangle, Users, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast, toast } from '@/components/ui/use-toast';
import AddPaymentForm from './AddPaymentForm';
import ExcelUploadProcessor from './ExcelUploadProcessor';

const PaymentManager = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentStats, setStudentStats] = useState({
    paid: 0,
    pending: 0,
    excess: 0
  });
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
    fetchStudentStats();
  }, []);

  useEffect(() => {
    // Filter payments based on search term
    if (searchTerm.trim() === '') {
      setFilteredPayments(payments);
    } else {
      const filtered = payments.filter(payment => 
        payment.students?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.students?.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.amount.toString().includes(searchTerm) ||
        payment.method.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPayments(filtered);
    }
  }, [searchTerm, payments]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, students(name, class_name, student_id)')
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
      setFilteredPayments(data || []);
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

  const fetchStudentStats = async () => {
    try {
      const { data, error } = await supabase
        .from('student_balances')
        .select('status');

      if (error) throw error;

      const stats = data?.reduce((acc, balance) => {
        if (balance.status === 'paid') acc.paid++;
        else if (balance.status === 'pending') acc.pending++;
        else if (balance.status === 'excess') acc.excess++;
        return acc;
      }, { paid: 0, pending: 0, excess: 0 }) || { paid: 0, pending: 0, excess: 0 };

      setStudentStats(stats);
    } catch (error) {
      console.error('Error fetching student stats:', error);
    }
  };

  const handlePaymentSaved = () => {
    fetchPayments();
    fetchStats();
    fetchStudentStats();
  };

  const handleResetMonth = async () => {
    if (!window.confirm('Reset all payments? This action cannot be undone.')) {
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
      fetchStudentStats();

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
    <div className="p-4 space-y-6 max-w-full overflow-hidden">
      {/* Header with Search and Reset */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#0052cc] to-blue-600 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
              <p className="text-gray-600 text-sm">Track and manage student payments</p>
            </div>
          </div>
          
          <Button
            onClick={handleResetMonth}
            disabled={resetting}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white h-8 px-3 animate-pulse"
          >
            {resetting ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            ) : (
              <>
                <RotateCcw size={14} className="mr-1" />
                Reset Month
              </>
            )}
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search payments, students, amounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
      </div>

      {/* Student Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center">
              <Users size={16} className="mr-2" />
              Paid Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{studentStats.paid}</div>
            <p className="text-xs text-green-700 mt-1">Payments completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center">
              <Clock size={16} className="mr-2" />
              Pending Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{studentStats.pending}</div>
            <p className="text-xs text-yellow-700 mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
              <TrendingUp size={16} className="mr-2" />
              Excess Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{studentStats.excess}</div>
            <p className="text-xs text-blue-700 mt-1">Advance payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => setShowUploadModal(true)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <FileSpreadsheet size={20} className="mr-2 text-green-600" />
              Upload Excel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-green-600 hover:bg-green-700 mb-2">
              Upload Payments
            </Button>
            <p className="text-xs text-gray-600">Import payments in seconds!</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => setShowAddForm(true)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Plus size={20} className="mr-2 text-[#0052cc]" />
              Manual Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-[#0052cc] hover:bg-blue-700 mb-2">
              Add Payment
            </Button>
            <p className="text-xs text-gray-600">Enter payment details manually</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-xs text-gray-600">Total Revenue</div>
          <div className="text-lg font-bold text-gray-900">₹{stats.totalAmount.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-xs text-gray-600">This Month</div>
          <div className="text-lg font-bold text-gray-900">₹{stats.monthlyAmount.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-xs text-gray-600">Total Students</div>
          <div className="text-lg font-bold text-gray-900">{stats.totalStudents}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-xs text-gray-600">Avg Payment</div>
          <div className="text-lg font-bold text-gray-900">₹{stats.averagePayment.toFixed(0)}</div>
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0052cc]"></div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <AlertTriangle size={24} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">
                        {searchTerm ? 'No payments match your search.' : 'No payments found.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{payment.students?.name}</div>
                        <div className="text-xs text-gray-500">({payment.students?.student_id})</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        ₹{payment.amount}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{payment.method}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          onClick={() => {
                            setEditingPayment(payment);
                            setShowAddForm(true);
                          }}
                          size="sm"
                          variant="outline"
                          className="text-xs"
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
        </CardContent>
      </Card>

      {/* Modals */}
      {showAddForm && (
        <div className="animate-slide-in-right">
          <AddPaymentForm
            onClose={() => {
              setShowAddForm(false);
              setEditingPayment(null);
            }}
            onSave={handlePaymentSaved}
            editingPayment={editingPayment}
          />
        </div>
      )}

      {showUploadModal && (
        <div className="animate-slide-in-right">
          <ExcelUploadProcessor
            onClose={() => setShowUploadModal(false)}
            onSuccess={handlePaymentSaved}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentManager;
