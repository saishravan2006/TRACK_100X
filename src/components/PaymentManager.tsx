import React, { useState, useEffect } from 'react';
import { Search, Upload, DollarSign, RotateCcw, Edit, Trash2, Save, X } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState(null);
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
            class_name
          )
        `)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (studentsError) throw studentsError;

      setPayments(paymentsData || []);
      setStudents(studentsData || []);
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
    paid: payments.filter(p => p.method === 'Excel Upload' || p.method === 'Manual Entry').length,
    pending: payments.filter(p => p.method === 'Cash').length,
    excess: payments.filter(p => p.amount > 1000).length // Example logic
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
      // Alternative approach: Delete payments directly instead of using the RPC function
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { error } = await supabase
        .from('payments')
        .delete()
        .gte('payment_date', firstDayOfMonth.toISOString().split('T')[0])
        .lte('payment_date', lastDayOfMonth.toISOString().split('T')[0]);

      if (error) throw error;

      await fetchPayments();
      setShowResetConfirm(false);
      toast({
        title: "Success",
        description: "Monthly payments reset successfully",
      });
    } catch (error) {
      console.error('Error resetting monthly data:', error);
      toast({
        title: "Error",
        description: "Failed to reset monthly data",
        variant: "destructive",
      });
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
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50 px-4 py-6 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-[#0052cc] mb-2">Payments</h1>
        <p className="text-gray-600 text-sm">Track and manage student payments</p>
      </div>

      {/* Status Cards */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div 
            className="bg-gradient-to-br from-[#0052cc] to-blue-600 text-white rounded-lg p-3 text-center cursor-pointer hover:shadow-md transition-all"
            onClick={() => setFilterStatus('Excel Upload')}
          >
            <div className="text-xl font-bold">{stats.paid}</div>
            <div className="text-xs text-blue-100">Paid Students</div>
          </div>
          <div 
            className="bg-gradient-to-br from-[#0052cc] to-blue-600 text-white rounded-lg p-3 text-center cursor-pointer hover:shadow-md transition-all"
            onClick={() => setFilterStatus('Cash')}
          >
            <div className="text-xl font-bold">{stats.pending}</div>
            <div className="text-xs text-blue-100">Pending Students</div>
          </div>
          <div 
            className="bg-gradient-to-br from-[#0052cc] to-blue-600 text-white rounded-lg p-3 text-center cursor-pointer hover:shadow-md transition-all"
            onClick={() => setFilterStatus('all')}
          >
            <div className="text-xl font-bold">{stats.excess}</div>
            <div className="text-xs text-blue-100">Excess Students</div>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset this month's payments?</h3>
            <p className="text-gray-600 mb-6">This will delete all payment records for the current month. This action cannot be undone.</p>
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
          onSave={handlePaymentSaved}
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
    </div>
  );
};

export default PaymentManager;
