
import React, { useState } from 'react';
import { X, User, Mail, Phone, BookOpen, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddStudentFormProps {
  onClose: () => void;
  onSave: (studentData: any) => void;
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    className: '',
    notes: ''
  });

  const [errors, setErrors] = useState<any>({});

  const classes = ['Dance Level 1', 'Dance Level 2', 'Math Tutoring', 'Salsa Beginners', 'Advanced Ballet'];

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
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
            <h2 className="text-xl font-semibold text-gray-900">Add New Student</h2>
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

            {/* Class Field */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <BookOpen size={16} className="text-[#0052cc]" />
                <span>Class *</span>
              </label>
              <select
                value={formData.className}
                onChange={(e) => handleInputChange('className', e.target.value)}
                className={`w-full h-12 px-3 border rounded-md bg-white ${errors.className ? 'border-red-500' : 'border-blue-200'} focus:border-[#0052cc] focus:outline-none`}
              >
                <option value="">Select a class</option>
                {classes.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
              {errors.className && <p className="text-red-500 text-xs mt-1">{errors.className}</p>}
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
            Save Student
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddStudentForm;
