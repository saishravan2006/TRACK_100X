
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import AddClassForm from './AddClassForm';
import ClassDetailsModal from './ClassDetailsModal';

const ClassSchedule: React.FC = () => {
  const [classes, setClasses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch classes from Supabase
  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleSaveClass = async (classData: any) => {
    try {
      const { error } = await supabase
        .from('classes')
        .insert({
          class_name: classData.className,
          location: classData.location,
          date: classData.date,
          start_time: classData.startTime,
          end_time: classData.endTime,
          fees: classData.fees,
          notes: classData.notes,
          class_type: classData.classType,
          repeat_days: classData.repeatDays
        });

      if (error) throw error;

      await fetchClasses();
      setShowAddForm(false);
      toast({
        title: "Success",
        description: "Class added successfully",
      });
    } catch (error) {
      console.error('Error saving class:', error);
      toast({
        title: "Error",
        description: "Failed to save class",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('id', classId);

        if (error) throw error;

        await fetchClasses();
        toast({
          title: "Success",
          description: "Class deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting class:', error);
        toast({
          title: "Error",
          description: "Failed to delete class",
          variant: "destructive",
        });
      }
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const ClassCard = ({ classItem, index }: any) => (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 animate-fade-in hover:shadow-md transition-all duration-200 mx-3"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-base mb-1">{classItem.class_name}</h3>
          <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
            <MapPin size={14} />
            <span>{classItem.location}</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar size={14} />
              <span>{formatDate(classItem.date)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={14} />
              <span>{formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}</span>
            </div>
          </div>
        </div>
        <span className="text-lg font-bold text-green-600">₹{classItem.fees}</span>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          classItem.class_type === 'recurring' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {classItem.class_type === 'recurring' ? 'Recurring' : 'Single'}
        </span>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs h-8 px-3"
            onClick={() => {
              setSelectedDate(classItem.date);
              setShowDetails(true);
            }}
          >
            <Edit size={12} className="mr-1" />
            View
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            className="text-xs h-8 px-3"
            onClick={() => handleDeleteClass(classItem.id)}
          >
            <Trash2 size={12} className="mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="pb-20 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052cc] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50 px-4 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#0052cc] to-blue-600 rounded-full flex items-center justify-center">
                <Calendar size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-black">Class Schedule</h1>
            </div>
            <p className="text-gray-600 text-sm pl-11">Manage your dance classes</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-[#0052cc] to-blue-600 text-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-xl font-bold">{classes.filter(c => c.class_type === 'single').length}</div>
            <div className="text-xs text-blue-100">Single Classes</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-xl font-bold">{classes.filter(c => c.class_type === 'recurring').length}</div>
            <div className="text-xs text-purple-100">Recurring Classes</div>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div className="px-1">
        <div className="flex items-center justify-between px-3 mb-4">
          <div className="flex items-center space-x-2">
            <Users size={18} className="text-[#0052cc]" />
            <h2 className="font-semibold text-gray-900">Upcoming Classes</h2>
          </div>
        </div>
        
        {classes.map((classItem, index) => (
          <ClassCard key={classItem.id} classItem={classItem} index={index} />
        ))}

        {classes.length === 0 && (
          <div className="text-center py-12 px-4">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">No classes scheduled</h3>
            <p className="text-gray-400 mb-4">Start by adding your first class</p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <Button 
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-[#0052cc] to-blue-600 hover:from-blue-700 hover:to-blue-800 shadow-lg z-10"
      >
        <Plus size={24} />
      </Button>

      {/* Add Class Form */}
      {showAddForm && (
        <AddClassForm 
          onClose={() => setShowAddForm(false)}
          onSave={handleSaveClass}
        />
      )}

      {/* Class Details Modal */}
      {showDetails && selectedDate && (
        <ClassDetailsModal 
          date={selectedDate}
          onClose={() => {
            setShowDetails(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
};

export default ClassSchedule;
