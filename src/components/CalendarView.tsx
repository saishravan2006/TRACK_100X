
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import ClassDetailsModal from './ClassDetailsModal';
import ScheduleClassModal from './ScheduleClassModal';
import AddClassForm from './AddClassForm';

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [classes, setClasses] = useState([]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchClasses();
  }, [currentDate]);

  const fetchClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getClassesForDate = (day: number) => {
    const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toLocaleDateString('en-US', { weekday: 'long' });
    
    return classes.filter(classItem => 
      classItem.date === dateString || 
      (classItem.repeat_days && classItem.repeat_days.includes(dayOfWeek))
    );
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = clickedDate.toISOString().split('T')[0];
    setSelectedDate(dateString);
  };

  const handleSaveClass = async (classData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
          repeat_days: classData.repeatDays,
          user_id: user.id,
        });

      if (error) throw error;

      await fetchClasses();
      setShowAddClassForm(false);
    } catch (error) {
      console.error('Error saving class:', error);
    }
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50 px-4 py-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-[#0052cc] to-blue-600 rounded-full flex items-center justify-center">
            <Calendar size={16} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-black">Schedule</h1>
        </div>
        <p className="text-gray-600 text-sm pl-11">Manage your dance classes and schedule</p>
      </div>

      {/* Two Cards Layout */}
      <div className="p-4 space-y-4">
        {/* Create New Class Card */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Plus size={20} className="text-[#0052cc]" />
              <span>Create New Class</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">Add a new recurring or single class to your schedule</p>
            <Button
              onClick={() => setShowAddClassForm(true)}
              className="w-full bg-gradient-to-r from-[#0052cc] to-blue-600 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus size={16} className="mr-2" />
              Create New Class
            </Button>
          </CardContent>
        </Card>

        {/* Calendar Card */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Calendar size={20} className="text-[#0052cc]" />
                <span>Calendar View</span>
              </CardTitle>
              
              {/* Month Navigation */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="h-8 w-8 p-0 border-gray-200 hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </Button>
                
                <div className="text-center min-w-[140px]">
                  <h2 className="text-base font-semibold text-gray-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="h-8 w-8 p-0 border-gray-200 hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">Click on a date to view or schedule classes</p>
            
            {/* Today's date indicator */}
            {isCurrentMonth && (
              <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg mb-4 border border-blue-200">
                <p className="text-sm text-[#0052cc] font-medium">
                  Today: {today.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Day Names Header */}
              <div className="grid grid-cols-7 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                {dayNames.map((dayName) => (
                  <div key={dayName} className="p-3 text-center">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      {dayName}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {days.map((day, index) => {
                  const dayClasses = day ? getClassesForDate(day) : [];
                  const isToday = day && isCurrentMonth && day === today.getDate();
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border-b border-r border-gray-100 last:border-r-0 relative transition-all duration-200 ${
                        day ? 'hover:bg-blue-50 cursor-pointer' : 'bg-gray-50'
                      } ${isToday ? 'bg-gradient-to-br from-[#0052cc] to-blue-600 text-white' : 'bg-white'}`}
                      onClick={() => day && handleDateClick(day)}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-white' : 'text-gray-900'}`}>
                            {day}
                          </div>
                          
                          {/* Classes for this day */}
                          <div className="space-y-1">
                            {dayClasses.slice(0, 2).map((classItem, idx) => (
                              <div
                                key={idx}
                                className={`text-xs px-2 py-1 rounded-md font-medium truncate ${
                                  isToday 
                                    ? 'bg-white bg-opacity-20 text-white border border-white border-opacity-30' 
                                    : 'bg-blue-100 text-[#0052cc] border border-blue-200'
                                }`}
                              >
                                {classItem.class_name}
                                {classItem.start_time && (
                                  <div className="text-xs opacity-80">
                                    {classItem.start_time.slice(0, 5)}
                                  </div>
                                )}
                              </div>
                            ))}
                            {dayClasses.length > 2 && (
                              <div className={`text-xs font-medium ${isToday ? 'text-white text-opacity-80' : 'text-gray-500'}`}>
                                +{dayClasses.length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Class Form */}
      {showAddClassForm && (
        <AddClassForm 
          onClose={() => setShowAddClassForm(false)}
          onSave={handleSaveClass}
        />
      )}

      {/* Class Details Modal */}
      {selectedDate && (
        <ClassDetailsModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onScheduleNew={() => {
            setShowScheduleModal(true);
          }}
        />
      )}

      {/* Schedule Class Modal */}
      {showScheduleModal && selectedDate && (
        <ScheduleClassModal
          date={selectedDate}
          onClose={() => setShowScheduleModal(false)}
          onSave={() => {
            setShowScheduleModal(false);
            fetchClasses();
          }}
        />
      )}
    </div>
  );
};

export default CalendarView;
