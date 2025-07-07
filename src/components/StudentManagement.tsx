
import React, { useState, useEffect } from 'react';
import { Search, Users, Phone, Mail, Trash2, Filter, Download, UserPlus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import AddStudentForm from './AddStudentForm';

const StudentManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const classes = ['Dance Level 1', 'Dance Level 2', 'Math Tutoring', 'Salsa Beginners', 'Advanced Ballet'];

  // Fetch students from Supabase
  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          student_balances (
            current_balance,
            total_paid,
            last_payment_date
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const studentsWithStatus = data.map(student => ({
        ...student,
        status: 'Active',
        paymentStatus: student.student_balances?.[0]?.current_balance > 0 ? 'Excess' : 
                      student.student_balances?.[0]?.current_balance < 0 ? 'Pending' : 'Paid',
        lastPayment: student.student_balances?.[0]?.last_payment_date || new Date().toISOString().split('T')[0],
        amount: Math.abs(student.student_balances?.[0]?.current_balance || 0)
      }));

      setStudents(studentsWithStatus);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterClass === 'all' || student.class_name === filterClass;
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

  const generateStudentId = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('student_id')
      .order('student_id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error generating student ID:', error);
      return 'STU001';
    }

    if (data.length === 0) {
      return 'STU001';
    }

    const lastId = data[0].student_id;
    const lastNumber = parseInt(lastId.replace('STU', ''));
    return `STU${String(lastNumber + 1).padStart(3, '0')}`;
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setShowAddForm(true);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', studentId);

        if (error) throw error;

        await fetchStudents();
        toast({
          title: "Success",
          description: "Student deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting student:', error);
        toast({
          title: "Error",
          description: "Failed to delete student",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveStudent = async (studentData: any) => {
    try {
      if (editingStudent) {
        // Update existing student
        const { error } = await supabase
          .from('students')
          .update({
            name: studentData.name,
            email: studentData.email,
            phone: studentData.phone,
            class_name: studentData.className,
            fees: studentData.fees,
            notes: studentData.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStudent.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Student updated successfully",
        });
      } else {
        // Add new student
        const studentId = await generateStudentId();
        const { error } = await supabase
          .from('students')
          .insert({
            student_id: studentId,
            name: studentData.name,
            email: studentData.email,
            phone: studentData.phone,
            class_name: studentData.className,
            fees: studentData.fees,
            notes: studentData.notes
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Student added successfully",
        });
      }

      await fetchStudents();
      setEditingStudent(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving student:', error);
      toast({
        title: "Error",
        description: "Failed to save student",
        variant: "destructive",
      });
    }
  };

  const StudentCard = ({ student, index }: any) => (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 animate-fade-in hover:shadow-md transition-all duration-200 mx-3"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-base truncate">{student.name}</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{student.student_id}</span>
          </div>
          <p className="text-sm text-gray-600 mb-1 truncate">{student.class_name}</p>
          <div className="flex items-center space-x-1 text-xs text-green-600 font-medium mb-1">
            <span>₹{student.fees || 0}/month</span>
          </div>
          <div className="flex flex-col space-y-1 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Mail size={12} />
              <span className="truncate">{student.email || 'No email'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Phone size={12} />
              <span>{student.phone || 'No phone'}</span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${getStatusColor(student.paymentStatus)}`}>
          {student.paymentStatus}
        </span>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-1 text-sm">
          <span className="font-medium">₹{student.amount}</span>
          <span className="text-gray-500 text-xs">• {student.lastPayment}</span>
        </div>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs h-8 px-3"
            onClick={() => handleEditStudent(student)}
          >
            <Edit size={12} className="mr-1" />
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            className="text-xs h-8 px-3"
            onClick={() => handleDeleteStudent(student.id)}
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
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-black">
                Your Star Students
              </h1>
            </div>
            <p className="text-gray-600 text-sm pl-11">Building futures, one student at a time</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
        onClick={() => {
          setEditingStudent(null);
          setShowAddForm(true);
        }}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-[#0052cc] to-blue-600 hover:from-blue-700 hover:to-blue-800 shadow-lg z-10"
      >
        <UserPlus size={24} />
      </Button>

      {/* Add Student Form */}
      {showAddForm && (
        <AddStudentForm 
          onClose={() => {
            setShowAddForm(false);
            setEditingStudent(null);
          }}
          onSave={handleSaveStudent}
          editingStudent={editingStudent}
        />
      )}
    </div>
  );
};

export default StudentManagement;
