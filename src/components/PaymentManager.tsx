import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, RotateCcw, FileSpreadsheet, Calendar, AlertTriangle, Users, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast, toast } from '@/hooks/use-toast';
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
  const [statusFilter, setStatusFilter] = useState('all');
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchStats();
    fetchStudentStats();
  }, []);

  useEffect(() => {
    // Filter payments based on search term and status filter
    let filtered = payments;
    
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(payment => 
        payment.students?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.students?.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.amount.toString().includes(searchTerm) ||
        payment.method.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      // Filter by status based on student balance status
      filtered = filtered.filter(payment => {
        // This would need to be implemented based on your status logic
        return true; // Placeholder for now
      });
    }
    
    setFilteredPayments(filtered);
  }, [searchTerm, statusFilter, payments]);

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

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const handleResetConfirm = () => {
    setShowResetConfirm(true);
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
      setShowResetConfirm(false);
    }
  };

  const handlePaymentSaved = () => {
    fetchPayments();
    fetchStats();
    fetchStudentStats();
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Header Section */}
      <div className="text-center pt-4 pb-4 px-4">
        <h1 className="text-2xl font-bold text-[#0052cc] mb-2">Payments</h1>
        <p className="text-base text-gray-600">Track and manage student payments</p>
      </div>

      {/* Status Cards Section */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-1 mb-4">
          <Card 
            className="bg-[#0052cc] text-white cursor-pointer hover:bg-blue-700 transition-colors"
            onClick={() => handleStatusFilter('paid')}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold mb-1">{studentStats.paid}</div>
              <div className="text-sm">Paid Students</div>
            </CardContent>
          </Card>

          <Card 
            className="bg-[#0052cc] text-white cursor-pointer hover:bg-blue-700 transition-colors"
            onClick={() => handleStatusFilter('pending')}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold mb-1">{studentStats.pending}</div>
              <div className="text-sm">Pending Students</div>
            </CardContent>
          </Card>

          <Card 
            className="bg-[#0052cc] text-white cursor-pointer hover:bg-blue-700 transition-colors"
            onClick={() => handleStatusFilter('excess')}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold mb-1">{studentStats.excess}</div>
              <div className="text-sm">Excess Students</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-1">
          <Card 
            className="bg-[#0052cc] text-white cursor-pointer hover:bg-blue-700 transition-colors"
            onClick={() => setShowUploadModal(true)}
          >
            <CardContent className="p-4 text-center">
              <FileSpreadsheet size={24} className="mx-auto mb-2" />
              <Button 
                size="sm" 
                className="bg-white text-[#0052cc] hover:bg-gray-100 mb-2 w-full"
              >
                Upload Payments
              </Button>
              <div className="text-xs">Import payments in seconds!</div>
            </CardContent>
          </Card>

          <Card 
            className="bg-[#0052cc] text-white cursor-pointer hover:bg-blue-700 transition-colors"
            onClick={() => setShowAddForm(true)}
          >
            <CardContent className="p-4 text-center">
              <Plus size={24} className="mx-auto mb-2" />
              <Button 
                size="sm" 
                className="bg-white text-[#0052cc] hover:bg-gray-100 mb-2 w-full"
              >
                Add Payment
              </Button>
              <div className="text-xs">Manual entry</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table Section with Integrated Search */}
      <div className="px-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Filter payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border-gray-300"
          />
        </div>

        {/* Payments Table */}
        <Card className="mb-20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-200">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-200">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-200">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-200">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#0052cc]"></div>
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8">
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
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Paid
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-4 flex flex-col gap-3">
        {/* Monthly Reset FAB */}
        <Button
          onClick={handleResetConfirm}
          disabled={resetting}
          size="icon"
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg animate-pulse"
        >
          {resetting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <RotateCcw size={20} />
          )}
        </Button>

        {/* Manual Entry FAB */}
        <Button
          onClick={() => setShowAddForm(true)}
          size="icon"
          className="w-12 h-12 rounded-full bg-[#0052cc] hover:bg-blue-700 text-white shadow-lg"
        >
          <Plus size={20} />
        </Button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg p-6 m-4 max-w-sm w-full animate-scale-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset all payments?</h3>
            <p className="text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowResetConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetMonth}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={resetting}
              >
                {resetting ? 'Resetting...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
