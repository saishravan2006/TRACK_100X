
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="p-2"
            >
              <ChevronLeft size={18} />
            </Button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-black">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h1>
              <p className="text-gray-600 text-sm">
                {isCurrentMonth ? 'Current Month' : 'Navigate to view classes'}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="p-2"
            >
              <ChevronRight size={18} />
            </Button>
          </div>

          <Button 
            className="bg-[#0052cc] hover:bg-blue-700 min-w-[48px] min-h-[48px] px-3"
          >
            <Plus size={16} className="mr-1" />
            Class
          </Button>
        </div>

        {/* Today's date indicator */}
        {isCurrentMonth && (
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">
              Today: {today.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 bg-gray-50">
            {dayNames.map((dayName) => (
              <div key={dayName} className="p-3 text-center text-sm font-medium text-gray-600">
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => (
              <div
                key={index}
                className={`aspect-square p-2 border-b border-r border-gray-100 relative ${
                  day ? 'hover:bg-blue-50 cursor-pointer' : ''
                } ${
                  day && isCurrentMonth && day === today.getDate()
                    ? 'bg-blue-500 text-white font-bold'
                    : ''
                }`}
              >
                {day && (
                  <>
                    <div className={`text-sm ${
                      isCurrentMonth && day === today.getDate() ? 'text-white' : 'text-gray-900'
                    }`}>
                      {day}
                    </div>
                    
                    {/* Sample events/classes - you can replace this with actual data */}
                    {day % 7 === 0 && (
                      <div className="absolute bottom-1 left-1 right-1">
                        <div className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded truncate">
                          Dance Class
                        </div>
                      </div>
                    )}
                    
                    {day % 5 === 0 && day !== today.getDate() && (
                      <div className="absolute bottom-1 left-1 right-1">
                        <div className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate">
                          Math Tutor
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-[#0052cc]">12</div>
            <div className="text-sm text-gray-600">Classes This Month</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-sm text-gray-600">Upcoming Classes</div>
          </div>
        </div>

        {/* Upcoming Classes Preview */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Upcoming Classes</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Dance Level 1</div>
                <div className="text-sm text-gray-600">Tomorrow, 4:00 PM - 5:00 PM</div>
              </div>
              <div className="text-sm text-[#0052cc] font-medium">15 students</div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Math Tutoring</div>
                <div className="text-sm text-gray-600">Friday, 3:00 PM - 4:00 PM</div>
              </div>
              <div className="text-sm text-[#0052cc] font-medium">8 students</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
