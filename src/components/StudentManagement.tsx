
import React, { useState } from 'react';
import { Search, Plus, Users, Phone, Mail, DollarSign, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const StudentManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock student data
  const students = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah@email.com',
      phone: '+1 234 567 8901',
      batch: 'Dance Level 1',
      status: 'Active',
      paymentStatus: 'Paid',
      lastPayment: '2024-01-15',
      amount: 150
    },
    {
      id: 2,
      name: 'Mike Chen',
      email: 'mike@email.com',
      phone: '+1 234 567 8902',
      batch: 'Math Tutoring',
      status: 'Active',
      paymentStatus: 'Pending',
      lastPayment: '2023-12-20',
      amount: 200
    },
    {
      id: 3,
      name: 'Emily Davis',
      email: 'emily@email.com',
      phone: '+1 234 567 8903',
      batch: 'Dance Level 2',
      status: 'Active',
      paymentStatus: 'Excess',
      lastPayment: '2024-01-10',
      amount: 300
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Excess': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StudentCard = ({ student, index }: any) => (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 animate-fade-in hover:shadow-md transition-all duration-200"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{student.name}</h3>
          <p className="text-sm text-gray-600 mb-1">{student.batch}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Mail size={12} />
              <span>{student.email}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Phone size={12} />
              <span>{student.phone}</span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.paymentStatus)}`}>
          {student.paymentStatus}
        </span>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-1 text-sm">
          <DollarSign size={14} className="text-[#0052cc]" />
          <span className="font-medium">${student.amount}</span>
          <span className="text-gray-500">• {student.lastPayment}</span>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="text-xs">
            Edit
          </Button>
          <Button size="sm" className="bg-[#0052cc] hover:bg-blue-700 text-xs">
            Payment
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Students</h1>
            <p className="text-gray-600">Manage your students and track payments</p>
          </div>
          <Button className="bg-[#0052cc] hover:bg-blue-700 min-w-[48px] min-h-[48px]">
            <Plus size={20} />
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="min-w-[48px] min-h-[48px] px-3">
            <Filter size={16} />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-xl font-bold text-[#0052cc]">{students.length}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-xl font-bold text-green-600">
              {students.filter(s => s.paymentStatus === 'Paid').length}
            </div>
            <div className="text-xs text-gray-600">Paid</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-xl font-bold text-yellow-600">
              {students.filter(s => s.paymentStatus === 'Pending').length}
            </div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="px-4">
        <div className="flex items-center space-x-2 mb-4">
          <Users size={18} className="text-[#0052cc]" />
          <h2 className="font-semibold text-gray-900">Student Directory</h2>
        </div>
        
        {students.map((student, index) => (
          <StudentCard key={student.id} student={student} index={index} />
        ))}
      </div>
    </div>
  );
};

export default StudentManagement;
