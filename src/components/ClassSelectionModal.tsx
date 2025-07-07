import React, { useState, useEffect } from 'react';
import { X, Download, BookOpen, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ClassSelectionModalProps {
  onClose: () => void;
}

const ClassSelectionModal: React.FC<ClassSelectionModalProps> = ({ onClose }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showColumnSelection, setShowColumnSelection] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const { toast } = useToast();

  const availableColumns = [
    { key: 'student_id', label: 'Student ID' },
    { key: 'name', label: 'Name' },
    { key: 'class_name', label: 'Class' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'fees', label: 'Fees' },
    { key: 'notes', label: 'Notes' }
  ];

  useEffect(() => {
    fetchClasses();
    setSelectedColumns(['student_id', 'name', 'class_name', 'email', 'phone', 'fees']); // Default columns
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('class_name')
        .order('class_name');

      if (error) throw error;

      // Get unique class names
      const uniqueClasses = [...new Set(data.map(student => student.class_name))];
      setClasses(uniqueClasses.map(className => ({ name: className })));
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

  const handleClassToggle = (className: string) => {
    setSelectedClasses(prev => 
      prev.includes(className) 
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const handleSelectAll = () => {
    if (selectedClasses.length === classes.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(classes.map((cls: any) => cls.name));
    }
  };

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(c => c !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAllColumns = () => {
    if (selectedColumns.length === availableColumns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(availableColumns.map(col => col.key));
    }
  };

  const handleProceedToDownload = () => {
    if (selectedClasses.length === 0) {
      toast({
        title: "No classes selected",
        description: "Please select at least one class to download",
        variant: "destructive",
      });
      return;
    }
    setShowColumnSelection(true);
  };

  const downloadCSV = async () => {
    if (selectedColumns.length === 0) {
      toast({
        title: "No columns selected",
        description: "Please select at least one column to download",
        variant: "destructive",
      });
      return;
    }

    setDownloading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('student_id, name, class_name, email, phone, fees, notes')
        .in('class_name', selectedClasses)
        .order('class_name, name');

      if (error) throw error;

      // Create headers based on selected columns
      const headers = availableColumns
        .filter(col => selectedColumns.includes(col.key))
        .map(col => col.label);

      // Create CSV content with only selected columns
      const csvContent = [
        headers.join(','),
        ...data.map(student => 
          selectedColumns.map(colKey => {
            const value = student[colKey as keyof typeof student];
            return typeof value === 'string' ? `"${value}"` : (value || '');
          }).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_${selectedClasses.join('_')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Downloaded ${data.length} students with ${selectedColumns.length} columns`,
      });

      onClose();
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast({
        title: "Error",
        description: "Failed to download CSV",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  if (showColumnSelection) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#0052cc] to-blue-600 rounded-full flex items-center justify-center">
                <CheckSquare size={16} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Select Columns</h2>
            </div>
            <button
              onClick={() => setShowColumnSelection(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              Choose which columns to include in your CSV download:
            </p>

            {/* Select All Button */}
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllColumns}
                className="w-full"
              >
                {selectedColumns.length === availableColumns.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Column List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableColumns.map((column) => (
                <label
                  key={column.key}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column.key)}
                    onChange={() => handleColumnToggle(column.key)}
                    className="rounded border-gray-300 text-[#0052cc] focus:ring-[#0052cc]"
                  />
                  <span className="text-sm font-medium text-gray-900">{column.label}</span>
                </label>
              ))}
            </div>

            {selectedColumns.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {selectedColumns.length} column(s) selected
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex space-x-3">
            <Button
              onClick={() => setShowColumnSelection(false)}
              variant="outline"
              className="flex-1"
              disabled={downloading}
            >
              Back
            </Button>
            <Button
              onClick={downloadCSV}
              disabled={selectedColumns.length === 0 || downloading}
              className="flex-1 bg-[#0052cc] hover:bg-blue-700"
            >
              {downloading ? 'Downloading...' : (
                <>
                  <Download size={16} className="mr-2" />
                  Download CSV
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#0052cc] to-blue-600 rounded-full flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Select Classes</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052cc] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading classes...</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Select the classes you want to include in the CSV download:
              </p>

              {/* Select All Button */}
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="w-full"
                >
                  {selectedClasses.length === classes.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              {/* Class List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {classes.map((classItem: any) => (
                  <label
                    key={classItem.name}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(classItem.name)}
                      onChange={() => handleClassToggle(classItem.name)}
                      className="rounded border-gray-300 text-[#0052cc] focus:ring-[#0052cc]"
                    />
                    <span className="text-sm font-medium text-gray-900">{classItem.name}</span>
                  </label>
                ))}
              </div>

              {selectedClasses.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {selectedClasses.length} class(es) selected
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={downloading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProceedToDownload}
            disabled={selectedClasses.length === 0 || downloading}
            className="flex-1 bg-[#0052cc] hover:bg-blue-700"
          >
            Next: Select Columns
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClassSelectionModal;
