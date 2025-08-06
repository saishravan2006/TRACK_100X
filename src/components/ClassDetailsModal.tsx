
import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Users, BookOpen, Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import EditClassModal from './EditClassModal';

interface ClassDetailsModalProps {
  date: string;
  onClose: () => void;
  onScheduleNew?: () => void;
}

const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({ date, onClose, onScheduleNew }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingClass, setEditingClass] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchClassesForDate();
  }, [date]);

  const fetchClassesForDate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      
      // Query for both specific date classes and recurring classes that match the day
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Filter classes that match the date or have the day in repeat_days
      const filteredClasses = (data || []).filter(classItem => {
        return classItem.date === date || 
               (classItem.repeat_days && classItem.repeat_days.includes(dayOfWeek));
      });
      
      // Sort by start time
      filteredClasses.sort((a, b) => {
        if (!a.start_time && !b.start_time) return 0;
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return a.start_time.localeCompare(b.start_time);
      });
      
      setClasses(filteredClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleEditClass = (classItem: any) => {
    setEditingClass(classItem);
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    fetchClassesForDate();
    setShowEditModal(false);
    setEditingClass(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#0052cc] to-blue-600 rounded-full flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Classes for {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052cc] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading classes...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No Classes Scheduled</h3>
              <p className="text-gray-400">No classes are scheduled for this date.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((classItem: any) => (
                <div key={classItem.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{classItem.class_name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{classItem.class_type}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#0052cc]">₹{classItem.fees}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(classItem.start_time || classItem.end_time) && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock size={16} className="text-[#0052cc]" />
                        <span>
                          {classItem.start_time ? formatTime(classItem.start_time) : 'Start time not set'}
                          {classItem.start_time && classItem.end_time && ' - '}
                          {classItem.end_time ? formatTime(classItem.end_time) : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin size={16} className="text-[#0052cc]" />
                      <span>{classItem.location}</span>
                    </div>

                    {classItem.repeat_days && classItem.repeat_days.length > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users size={16} className="text-[#0052cc]" />
                        <span>Repeats: {classItem.repeat_days.join(', ')}</span>
                      </div>
                    )}

                    {classItem.notes && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-sm text-gray-600">{classItem.notes}</p>
                      </div>
                    )}
                    
                    {/* Edit Button */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Button
                        onClick={() => handleEditClass(classItem)}
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs border-blue-200 hover:bg-blue-50"
                      >
                        <Edit size={12} className="mr-1" />
                        Edit Class
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          {onScheduleNew && (
            <Button
              onClick={onScheduleNew}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus size={16} className="mr-2" />
              Schedule New Class
            </Button>
          )}
          <Button
            onClick={onClose}
            className="w-full bg-[#0052cc] hover:bg-blue-700"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Edit Class Modal */}
      {showEditModal && editingClass && (
        <EditClassModal
          classData={editingClass}
          onClose={() => {
            setShowEditModal(false);
            setEditingClass(null);
          }}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};

export default ClassDetailsModal;
