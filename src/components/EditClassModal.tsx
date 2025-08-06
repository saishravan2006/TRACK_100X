import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, FileText, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface EditClassModalProps {
  classData: any;
  onClose: () => void;
  onSave: () => void;
}

const EditClassModal: React.FC<EditClassModalProps> = ({ classData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    className: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    fees: '',
    notes: '',
    classType: 'single',
    repeatDays: [] as string[]
  });

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (classData) {
      setFormData({
        className: classData.class_name || '',
        location: classData.location || '',
        date: classData.date || '',
        startTime: classData.start_time || '',
        endTime: classData.end_time || '',
        fees: classData.fees?.toString() || '',
        notes: classData.notes || '',
        classType: classData.class_type || 'single',
        repeatDays: classData.repeat_days || []
      });
    }
  }, [classData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const toggleRepeatDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      repeatDays: prev.repeatDays.includes(day)
        ? prev.repeatDays.filter(d => d !== day)
        : [...prev.repeatDays, day]
    }));
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.className.trim()) newErrors.className = 'Class name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (formData.classType === 'single' && !formData.date) newErrors.date = 'Date is required for single classes';
    if (formData.classType === 'recurring' && formData.repeatDays.length === 0) {
      newErrors.repeatDays = 'Select at least one day for recurring classes';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData = {
        class_name: formData.className,
        location: formData.location,
        date: formData.classType === 'single' ? formData.date : null,
        start_time: formData.startTime,
        end_time: formData.endTime,
        fees: parseFloat(formData.fees) || 0,
        notes: formData.notes,
        class_type: formData.classType,
        repeat_days: formData.classType === 'recurring' ? formData.repeatDays : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('classes')
        .update(updateData)
        .eq('id', classData.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class updated successfully",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating class:', error);
      toast({
        title: "Error",
        description: "Failed to update class",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classData.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class deleted successfully",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: "Error",
        description: "Failed to delete class",
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
              <Calendar size={16} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Class</h2>
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
            {/* Class Name */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="text-[#0052cc]" />
                <span>Class Name *</span>
              </label>
              <Input
                value={formData.className}
                onChange={(e) => handleInputChange('className', e.target.value)}
                placeholder="Enter class name"
                className={`h-12 ${errors.className ? 'border-red-500' : 'border-blue-200 focus:border-[#0052cc]'}`}
              />
              {errors.className && <p className="text-red-500 text-xs mt-1">{errors.className}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="text-[#0052cc]" />
                <span>Location *</span>
              </label>
              <Input
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter location"
                className={`h-12 ${errors.location ? 'border-red-500' : 'border-blue-200 focus:border-[#0052cc]'}`}
              />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>

            {/* Time Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock size={16} className="text-[#0052cc]" />
                  <span>Start Time *</span>
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={`h-12 ${errors.startTime ? 'border-red-500' : 'border-blue-200 focus:border-[#0052cc]'}`}
                />
                {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
              </div>
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock size={16} className="text-[#0052cc]" />
                  <span>End Time *</span>
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={`h-12 ${errors.endTime ? 'border-red-500' : 'border-blue-200 focus:border-[#0052cc]'}`}
                />
                {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
              </div>
            </div>

            {/* Date for single classes */}
            {formData.classType === 'single' && (
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="text-[#0052cc]" />
                  <span>Date *</span>
                </label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`h-12 ${errors.date ? 'border-red-500' : 'border-blue-200 focus:border-[#0052cc]'}`}
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
            )}

            {/* Repeat Days for recurring classes */}
            {formData.classType === 'recurring' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Repeat Days *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {dayOptions.map((day) => (
                    <label key={day} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.repeatDays.includes(day)}
                        onChange={() => toggleRepeatDay(day)}
                        className="h-4 w-4 text-[#0052cc] border-gray-300 rounded focus:ring-[#0052cc]"
                      />
                      <span className="text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
                {errors.repeatDays && <p className="text-red-500 text-xs mt-1">{errors.repeatDays}</p>}
              </div>
            )}

            {/* Fees */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <span>Fees (Optional)</span>
              </label>
              <Input
                type="number"
                value={formData.fees}
                onChange={(e) => handleInputChange('fees', e.target.value)}
                placeholder="0.00"
                className="h-12 border-blue-200 focus:border-[#0052cc]"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="text-[#0052cc]" />
                <span>Notes</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes..."
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-[#0052cc] focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/200 characters</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 space-y-3 bg-white">
          <div className="flex space-x-3">
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
              <Check size={16} className="mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
          
          {/* Delete Button */}
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="w-full h-12"
            disabled={loading}
          >
            <Trash2 size={16} className="mr-2" />
            {loading ? 'Deleting...' : 'Delete Class'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditClassModal;