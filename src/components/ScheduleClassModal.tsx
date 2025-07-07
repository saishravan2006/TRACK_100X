
import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ScheduleClassModalProps {
  date: string;
  onClose: () => void;
  onSave: () => void;
}

const ScheduleClassModal: React.FC<ScheduleClassModalProps> = ({ date, onClose, onSave }) => {
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('class_name');

      if (error) throw error;
      setAvailableClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to load available classes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleClass = async () => {
    if (!selectedClassId) {
      toast({
        title: "Error",
        description: "Please select a class to schedule",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedClass = availableClasses.find(c => c.id === selectedClassId);
      
      const { error } = await supabase
        .from('classes')
        .insert({
          class_name: selectedClass.class_name,
          location: customLocation || selectedClass.location,
          date: date,
          start_time: startTime || selectedClass.start_time,
          end_time: endTime || selectedClass.end_time,
          fees: selectedClass.fees,
          notes: selectedClass.notes,
          class_type: 'single'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class scheduled successfully",
      });
      onSave();
    } catch (error) {
      console.error('Error scheduling class:', error);
      toast({
        title: "Error",
        description: "Failed to schedule class",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Schedule Class for {new Date(date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052cc] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading classes...</p>
            </div>
          ) : (
            <>
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Existing Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0052cc] focus:border-transparent"
                >
                  <option value="">Choose a class...</option>
                  {availableClasses.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.class_name} - {classItem.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  Custom Location (Optional)
                </label>
                <Input
                  placeholder="Enter custom location or leave empty to use default"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="focus:ring-2 focus:ring-[#0052cc] focus:border-transparent"
                />
              </div>

              {/* Time Override */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock size={16} className="inline mr-1" />
                    Start Time (Optional)
                  </label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="focus:ring-2 focus:ring-[#0052cc] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time (Optional)
                  </label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="focus:ring-2 focus:ring-[#0052cc] focus:border-transparent"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleScheduleClass}
            disabled={!selectedClassId || loading}
            className="flex-1 bg-[#0052cc] hover:bg-blue-700"
          >
            <Save size={16} className="mr-2" />
            Schedule Class
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleClassModal;
