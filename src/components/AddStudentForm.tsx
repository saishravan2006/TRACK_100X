
import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, BookOpen, FileText, Check, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface AddStudentFormProps {
  onClose: () => void;
  onSave: (studentData: any) => void;
  editingStudent?: any;
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onClose, onSave, editingStudent }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    className: '',
    fees: '',
    notes: ''
  });

  const [errors, setErrors] = useState<any>({});
  const [classes, setClasses] = useState<string[]>([]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('class_name')
        .order('class_name');

      if (error) throw error;
      
      // Get unique class names
      const uniqueClasses = Array.from(new Set(data?.map(c => c.class_name) || []));
      setClasses(uniqueClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Fallback to default classes
      setClasses(['Dance Level 1', 'Dance Level 2', 'Math Tutoring', 'Salsa Beginners', 'Advanced Ballet']);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (editingStudent) {
      setFormData({
        name: editingStudent.name || '',
        email: editingStudent.email || '',
        phone: editingStudent.phone || '',
        className: editingStudent.class_name || '',
        fees: editingStudent.fees?.toString() || '',
        notes: editingStudent.notes || ''
      });
    }
  }, [editingStudent]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.className.trim()) newErrors.className = 'Class is required';
    if (!formData.fees.trim()) newErrors.fees = 'Fees is required';
    if (formData.fees && isNaN(parseFloat(formData.fees))) newErrors.fees = 'Please enter a valid amount';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        ...formData,
        fees: parseFloat(formData.fees)
      });
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-2xl shadow-xl animate-slide-in-bottom pb-safe-area-pb">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#0052cc] to-blue-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingStudent ? 'Edit Student' : 'Add New Student'}
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
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="text-[#0052cc]" />
                <span>Student Name *</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter student's full name"
                className={`h-12 ${errors.name ? 'border-red-500' : 'border-blue-200 focus:border-[#0052cc]'}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="text-[#0052cc]" />
                <span>Email Address</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="student@email.com"
                className="h-12 border-blue-200 focus:border-[#0052cc]"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="text-[#0052cc]" />
                <span>Phone Number</span>
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 234 567 8900"
                className="h-12 border-blue-200 focus:border-[#0052cc]"
              />
            </div>

            {/* Class Field - Now allows typing */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <BookOpen size={16} className="text-[#0052cc]" />
                <span>Class *</span>
              </label>
              <Input
                value={formData.className}
                onChange={(e) => handleInputChange('className', e.target.value)}
                placeholder="Enter class name"
                className={`h-12 ${errors.className ? 'border-red-500' : 'border-blue-200 focus:border-[#0052cc]'}`}
                list="classes-list"
              />
              <datalist id="classes-list">
                {classes.map((className) => (
                  <option key={className} value={className} />
                ))}
              </datalist>
              {errors.className && <p className="text-red-500 text-xs mt-1">{errors.className}</p>}
            </div>

            {/* Fees Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign size={16} className="text-[#0052cc]" />
                <span>Monthly Fees *</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.fees}
                onChange={(e) => handleInputChange('fees', e.target.value)}
                placeholder="0.00"
                className={`h-12 ${errors.fees ? 'border-red-500' : 'border-blue-200 focus:border-[#0052cc]'}`}
              />
              {errors.fees && <p className="text-red-500 text-xs mt-1">{errors.fees}</p>}
            </div>

            {/* Notes Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="text-[#0052cc]" />
                <span>Notes</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any special notes about this student..."
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-[#0052cc] focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/200 characters</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 flex space-x-3 bg-white">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-12 border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 h-12 bg-gradient-to-r from-[#0052cc] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <Check size={16} className="mr-2" />
            {editingStudent ? 'Update Student' : 'Save Student'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddStudentForm;
