
import React, { useState, useEffect } from 'react';
import { X, User, IndianRupee, Calendar, CreditCard, FileText, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AddPaymentFormProps {
  onClose: () => void;
  onSave: () => void;
  editingPayment?: any;
}

const AddPaymentForm: React.FC<AddPaymentFormProps> = ({ onClose, onSave, editingPayment }) => {
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'Manual Entry',
    remarks: '',
    transactionRef: ''
  });

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const paymentMethods = ['Manual Entry', 'Cash', 'Online', 'Excel Upload'];

  useEffect(() => {
    fetchStudents();
    if (editingPayment) {
      setFormData({
        studentId: editingPayment.student_id || '',
        amount: editingPayment.amount?.toString() || '',
        paymentDate: editingPayment.payment_date || new Date().toISOString().split('T')[0],
        method: editingPayment.method || 'Manual Entry',
        remarks: editingPayment.remarks || '',
        transactionRef: editingPayment.transaction_ref || ''
      });
    }
  }, [editingPayment]);

  const fetchStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('students')
        .select('id, student_id, name, class_name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const filtered = students.filter((student: any) =>
      student.name.toLowerCase().includes(value.toLowerCase()) ||
      student.student_id.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.studentId) newErrors.studentId = 'Student is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!formData.paymentDate) newErrors.paymentDate = 'Payment date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const paymentData = {
        student_id: formData.studentId,
        amount: parseFloat(formData.amount),
        payment_date: formData.paymentDate,
        method: formData.method,
        remarks: formData.remarks || null,
        transaction_ref: formData.transactionRef || null,
        user_id: user.id,
      };

      if (editingPayment) {
        const { error } = await supabase
          .from('payments')
          .update(paymentData)
          .eq('id', editingPayment.id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Payment updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('payments')
          .insert(paymentData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Payment added successfully",
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast({
        title: "Error",
        description: "Failed to save payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-2xl shadow-xl animate-slide-in-bottom pb-safe-area-pb">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#0052cc] to-blue-600 rounded-full flex items-center justify-center">
              <IndianRupee size={16} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingPayment ? 'Edit Payment' : 'Add Payment'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Student Selection with Search */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="text-[#0052cc]" />
                <span>Student *</span>
              </label>
              
              {/* Search Input */}
              <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by name or student ID..."
                  className="pl-10 h-10 border-blue-200 focus:border-[#0052cc]"
                />
              </div>
              
              {/* Student Selection */}
              <select
                value={formData.studentId}
                onChange={(e) => handleInputChange('studentId', e.target.value)}
                className={`w-full h-12 px-3 border rounded-md bg-white ${errors.studentId ? 'border-red-500' : 'border-blue-200'} focus:border-[#0052cc] focus:outline-none`}
              >
                <option value="">Select a student</option>
                {filteredStudents.map((student: any) => (
                  <option key={student.id} value={student.id}>
                    {student.student_id} - {student.name} ({student.class_name})
                  </option>
                ))}
              </select>
              {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
            </div>

            {/* Amount Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <IndianRupee size={16} className="text-[#0052cc]" />
                <span>Amount *</span>
              </label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`h-12 ${errors.amount ? 'border-red-500' : 'border-blue-200 focus:border-[#0052cc]'}`}
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>

            {/* Payment Date Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="text-[#0052cc]" />
                <span>Payment Date *</span>
              </label>
              <Input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                className={`h-12 ${errors.paymentDate ? 'border-red-500' : 'border-blue-200 focus:border-[#0052cc]'}`}
              />
              {errors.paymentDate && <p className="text-red-500 text-xs mt-1">{errors.paymentDate}</p>}
            </div>

            {/* Payment Method */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <CreditCard size={16} className="text-[#0052cc]" />
                <span>Payment Method</span>
              </label>
              <select
                value={formData.method}
                onChange={(e) => handleInputChange('method', e.target.value)}
                className="w-full h-12 px-3 border border-blue-200 rounded-md bg-white focus:border-[#0052cc] focus:outline-none"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Transaction Reference */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="text-[#0052cc]" />
                <span>Transaction Reference</span>
              </label>
              <Input
                value={formData.transactionRef}
                onChange={(e) => handleInputChange('transactionRef', e.target.value)}
                placeholder="Transaction ID or UPI reference number"
                className="h-12 border-blue-200 focus:border-[#0052cc]"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="text-[#0052cc]" />
                <span>Remarks</span>
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                placeholder="Any additional notes..."
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-[#0052cc] focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.remarks.length}/200 characters</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 flex space-x-3 bg-white">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-12 border-gray-300 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 h-12 bg-gradient-to-r from-[#0052cc] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white"
            disabled={loading}
          >
            {loading ? 'Saving...' : (
              <>
                <Check size={16} className="mr-2" />
                {editingPayment ? 'Update Payment' : 'Save Payment'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentForm;
