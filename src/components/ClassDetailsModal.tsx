
import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Users, BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ClassDetailsModalProps {
  date: string;
  onClose: () => void;
  onScheduleNew?: () => void;
}

const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({ date, onClose, onScheduleNew }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassesForDate();
  }, [date]);

  const fetchClassesForDate = async () => {
    try {
      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Fetch classes for the specific date or recurring classes for that day
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .or(`date.eq.${date},repeat_days.cs.{${dayOfWeek}}`);

      if (error) throw error;
      setClasses(data || []);
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
    </div>
  );
};

export default ClassDetailsModal;
