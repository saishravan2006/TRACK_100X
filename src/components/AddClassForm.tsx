
import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, FileText, Check, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddClassFormProps {
  onClose: () => void;
  onSave: (classData: any) => void;
}

const AddClassForm: React.FC<AddClassFormProps> = ({ onClose, onSave }) => {
  const [classType, setClassType] = useState<'single' | 'recurring' | null>(null);
  const [formData, setFormData] = useState({
    className: '',
    startTime: '',
    endTime: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    notes: '',
    repeatDays: [] as string[]
  });

  const [errors, setErrors] = useState<any>({});

  const locations = ['Studio A', 'Studio B', 'Room 101', 'Online', 'Main Hall'];
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.className.trim()) newErrors.className = 'Class name is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (classType === 'single' && !formData.date) newErrors.date = 'Date is required';
    if (classType === 'recurring' && formData.repeatDays.length === 0) newErrors.repeatDays = 'Select at least one day';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave({ ...formData, classType });
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    }
  };

  const resetForm = () => {
    setClassType(null);
    setFormData({
      className: '',
      startTime: '',
      endTime: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      notes: '',
      repeatDays: []
    });
    setErrors({});
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
            <h2 className="text-xl font-semibold text-gray-900">Schedule New Class</h2>
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
          {!classType ? (
            /* Class Type Selection */
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-6">What type of class would you like to create?</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setClassType('single')}
                  className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-[#0052cc] hover:bg-blue-50 transition-all duration-200 text-left"
                >
                  <div className="font-medium text-gray-900">Single Class</div>
                  <div className="text-sm text-gray-600">A one-time class on a specific date</div>
                </button>
                <button
                  onClick={() => setClassType('recurring')}
                  className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-[#0052cc] hover:bg-blue-50 transition-all duration-200 text-left"
                >
                  <div className="font-medium text-gray-900">Recurring Class</div>
                  <div className="text-sm text-gray-600">A class that repeats on specific days of the week</div>
                </button>
              </div>
            </div>
          ) : (
            /* Main Form */
            <div className="space-y-4">
              <button
                onClick={resetForm}
                className="text-sm text-[#0052cc] hover:underline mb-4"
              >
                ← Change class type
              </button>

              {/* Class Name Field */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <BookOpen size={16} className="text-[#0052cc]" />
                  <span>Class Name *</span>
                </label>
                <Input
                  value={formData.className}
                  onChange={(e) => handleInputChange('className', e.target.value)}
                  placeholder="Enter new class name (e.g., Advanced Salsa)"
                  className={`h-12 ${errors.className ? 'border-red-500' : 'border-blue-200 focus:border-[#0052cc]'}`}
                />
                {errors.className && <p className="text-red-500 text-xs mt-1">{errors.className}</p>}
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

              {/* Date or Weekdays based on class type */}
              {classType === 'single' ? (
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
              ) : (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Select Days *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {weekdays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleRepeatDay(day)}
                        className={`h-10 text-xs font-medium rounded-lg transition-all duration-200 ${
                          formData.repeatDays.includes(day)
                            ? 'bg-[#0052cc] text-white shadow-md animate-glow'
                            : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                  {errors.repeatDays && <p className="text-red-500 text-xs mt-1">{errors.repeatDays}</p>}
                </div>
              )}

              {/* Location Field */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="text-[#0052cc]" />
                  <span>Location *</span>
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full h-12 px-3 border rounded-md bg-white ${errors.location ? 'border-red-500' : 'border-blue-200'} focus:border-[#0052cc] focus:outline-none`}
                >
                  <option value="">Select location</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
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
                  placeholder="Any special instructions or notes..."
                  maxLength={200}
                  rows={3}
                  className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-[#0052cc] focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/200 characters</p>
              </div>
            </div>
          )}
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
          {classType && (
            <Button
              onClick={handleSave}
              className="flex-1 h-12 bg-gradient-to-r from-[#0052cc] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Check size={16} className="mr-2" />
              Schedule Class
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddClassForm;
