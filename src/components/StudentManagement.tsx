
import React, { useState } from 'react';
import { Search, Users, Phone, Mail, DollarSign, Filter, Download, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AddStudentForm from './AddStudentForm';

const StudentManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Mock student data
  const students = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah@email.com',
      phone: '+1 234 567 8901',
      className: 'Dance Level 1',
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
      className: 'Math Tutoring',
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
      className: 'Dance Level 2',
      status: 'Active',
      paymentStatus: 'Excess',
      lastPayment: '2024-01-10',
      amount: 300
    }
  ];

  const classes = ['Dance Level 1', 'Dance Level 2', 'Math Tutoring', 'Salsa Beginners', 'Advanced Ballet'];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterClass === 'all' || student.className === filterClass;
    return matchesSearch && matchesFilter;
  });

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
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 animate-fade-in hover:shadow-md transition-all duration-200 mx-3"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base truncate">{student.name}</h3>
          <p className="text-sm text-gray-600 mb-1 truncate">{student.className}</p>
          <div className="flex flex-col space-y-1 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Mail size={12} />
              <span className="truncate">{student.email}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Phone size={12} />
              <span>{student.phone}</span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${getStatusColor(student.paymentStatus)}`}>
          {student.paymentStatus}
        </span>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-1 text-sm">
          <DollarSign size={14} className="text-[#0052cc]" />
          <span className="font-medium">${student.amount}</span>
          <span className="text-gray-500 text-xs">• {student.lastPayment}</span>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="text-xs h-8 px-3">
            Edit
          </Button>
          <Button size="sm" className="bg-[#0052cc] hover:bg-blue-700 text-xs h-8 px-3">
            Payment
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50 px-4 py-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#0052cc] to-blue-600 rounded-full flex items-center justify-center">
                <Users size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0052cc] to-blue-600 bg-clip-text text-transparent">
                Your Star Students
              </h1>
            </div>
            <p className="text-gray-600 text-sm pl-11">Building futures, one student at a time</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-pulse" />
            <Input
              placeholder="Search your amazing students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 border-blue-200 focus:border-[#0052cc]"
            />
          </div>
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              className="min-w-[48px] min-h-[48px] px-3 border-blue-200 hover:bg-blue-50"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter size={16} />
            </Button>
            {showFilterDropdown && (
              <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Filter by Class</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setFilterClass('all');
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                        filterClass === 'all' ? 'bg-blue-50 text-[#0052cc]' : 'text-gray-700'
                      }`}
                    >
                      All Classes
                    </button>
                    {classes.map((className) => (
                      <button
                        key={className}
                        onClick={() => {
                          setFilterClass(className);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                          filterClass === className ? 'bg-blue-50 text-[#0052cc]' : 'text-gray-700'
                        }`}
                      >
                        {className}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-[#0052cc] to-blue-600 text-white rounded-lg p-3 text-center shadow-sm relative overflow-hidden">
            <div className="text-xl font-bold">{students.filter(s => s.status === 'Active').length}</div>
            <div className="text-xs text-blue-100">Active Champions</div>
          </div>
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-lg p-3 text-center shadow-sm relative overflow-hidden">
            <div className="text-xl font-bold">0</div>
            <div className="text-xs text-gray-100">Taking a Break</div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="px-1">
        <div className="flex items-center justify-between px-3 mb-4">
          <div className="flex items-center space-x-2">
            <Users size={18} className="text-[#0052cc]" />
            <h2 className="font-semibold text-gray-900">Student Directory</h2>
          </div>
          <Button variant="outline" size="sm" className="h-8 px-3 border-blue-200 hover:bg-blue-50">
            <Download size={14} className="mr-1" />
            CSV
          </Button>
        </div>
        
        {filteredStudents.map((student, index) => (
          <StudentCard key={student.id} student={student} index={index} />
        ))}

        {filteredStudents.length === 0 && (
          <div className="text-center py-12 px-4">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">No students found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <Button 
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-[#0052cc] to-blue-600 hover:from-blue-700 hover:to-blue-800 shadow-lg z-10 animate-bounce"
        style={{ animationDuration: '3s' }}
      >
        <UserPlus size={24} />
      </Button>

      {/* Add Student Form */}
      {showAddForm && (
        <AddStudentForm 
          onClose={() => setShowAddForm(false)}
          onSave={(studentData) => {
            console.log('New student:', studentData);
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
};

export default StudentManagement;
