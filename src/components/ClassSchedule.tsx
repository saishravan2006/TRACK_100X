
import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Plus, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ClassSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock class data
  const classes = [
    {
      id: 1,
      batchName: 'Dance Level 1',
      time: '09:00 AM',
      duration: '1 hour',
      location: 'Studio A',
      students: 8,
      date: '2024-01-20',
      status: 'upcoming'
    },
    {
      id: 2,
      batchName: 'Math Tutoring',
      time: '02:00 PM',
      duration: '2 hours',
      location: 'Room 101',
      students: 5,
      date: '2024-01-20',
      status: 'upcoming'
    },
    {
      id: 3,
      batchName: 'Dance Level 2',
      time: '05:00 PM',
      duration: '1.5 hours',
      location: 'Studio B',
      students: 12,
      date: '2024-01-20',
      status: 'completed'
    }
  ];

  const todayClasses = classes.filter(c => c.date === '2024-01-20');
  const upcomingClasses = todayClasses.filter(c => c.status === 'upcoming');

  const ClassCard = ({ classItem, index }: any) => (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 animate-fade-in hover:shadow-md transition-all duration-200"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-lg">{classItem.batchName}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              classItem.status === 'upcoming' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {classItem.status}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock size={14} className="text-[#0052cc]" />
              <span>{classItem.time} • {classItem.duration}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin size={14} className="text-[#0052cc]" />
              <span>{classItem.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users size={14} className="text-[#0052cc]" />
              <span>{classItem.students} students</span>
            </div>
          </div>
        </div>
        
        <ChevronRight size={20} className="text-gray-400 mt-1" />
      </div>
      
      <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
        <Button size="sm" variant="outline" className="text-xs flex-1">
          View Details
        </Button>
        {classItem.status === 'upcoming' && (
          <Button size="sm" className="bg-[#0052cc] hover:bg-blue-700 text-xs flex-1">
            Start Class
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Schedule</h1>
            <p className="text-gray-600">Manage your classes and batches</p>
          </div>
          <Button className="bg-[#0052cc] hover:bg-blue-700 min-w-[48px] min-h-[48px]">
            <Plus size={20} />
          </Button>
        </div>
      </div>

      {/* Today's Overview */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-r from-[#0052cc] to-blue-600 rounded-xl p-4 text-white mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-2xl font-bold">Today</div>
              <div className="text-blue-100 text-sm">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            <Calendar size={32} className="opacity-80" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{todayClasses.length}</div>
              <div className="text-xs text-blue-100">Total Classes</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{upcomingClasses.length}</div>
              <div className="text-xs text-blue-100">Upcoming</div>
            </div>
          </div>
        </div>
      </div>

      {/* Class List */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock size={18} className="text-[#0052cc]" />
            <h2 className="font-semibold text-gray-900">Today's Classes</h2>
          </div>
          <Button variant="ghost" size="sm" className="text-[#0052cc]">
            View All
          </Button>
        </div>
        
        {todayClasses.map((classItem, index) => (
          <ClassCard key={classItem.id} classItem={classItem} index={index} />
        ))}
        
        {todayClasses.length === 0 && (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">No classes today</h3>
            <p className="text-gray-400 mb-4">Take a well-deserved break!</p>
            <Button className="bg-[#0052cc] hover:bg-blue-700">
              Schedule New Class
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassSchedule;
