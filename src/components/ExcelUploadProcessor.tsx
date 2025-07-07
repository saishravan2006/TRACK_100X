
import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ExcelUploadProcessorProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ExcelUploadProcessor: React.FC<ExcelUploadProcessorProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setUploadResult(null);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select an Excel (.xlsx, .xls) or CSV file",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const processExcelFile = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      // Create upload record
      const { data: uploadRecord, error: uploadError } = await supabase
        .from('payment_uploads')
        .insert({
          file_name: file.name,
          status: 'PROCESSING',
          total_records: 0,
          processed_records: 0,
          failed_records: 0
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      // Updated mock data with UPI Ref No column
      const mockData = [
        { studentId: 'STU001', amount: 1500, date: '2024-01-15', upiRefNo: 'UPI123456789' },
        { studentId: 'STU002', amount: 1200, date: '2024-01-15', upiRefNo: 'UPI987654321' },
        { studentId: 'STU999', amount: 1000, date: '2024-01-15', upiRefNo: 'UPI555666777' }, // This will fail - student doesn't exist
      ];

      let processedCount = 0;
      let failedCount = 0;
      const errors = [];

      for (let i = 0; i < mockData.length; i++) {
        const row = mockData[i];
        try {
          // Find student by student_id
          const { data: student, error: studentError } = await supabase
            .from('students')
            .select('id')
            .eq('student_id', row.studentId)
            .single();

          if (studentError || !student) {
            failedCount++;
            errors.push({
              row_number: i + 2,
              student_reference: row.studentId,
              error_type: 'STUDENT_NOT_FOUND',
              error_message: `Student with ID ${row.studentId} not found`,
              raw_data: row
            });
            continue;
          }

          // Insert payment with UPI Ref No as transaction reference
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              student_id: student.id,
              amount: row.amount,
              payment_date: row.date,
              method: 'Excel Upload',
              transaction_ref: row.upiRefNo // Using UPI Ref No as transaction reference
            });

          if (paymentError) {
            failedCount++;
            errors.push({
              row_number: i + 2,
              student_reference: row.studentId,
              error_type: 'PAYMENT_INSERT_FAILED',
              error_message: paymentError.message,
              raw_data: row
            });
          } else {
            processedCount++;
          }
        } catch (error) {
          failedCount++;
          errors.push({
            row_number: i + 2,
            student_reference: row.studentId,
            error_type: 'UNKNOWN_ERROR',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            raw_data: row
          });
        }
      }

      // Insert errors if any
      if (errors.length > 0) {
        await supabase
          .from('payment_errors')
          .insert(errors.map(error => ({
            ...error,
            upload_id: uploadRecord.id
          })));
      }

      // Update upload record
      await supabase
        .from('payment_uploads')
        .update({
          status: failedCount === mockData.length ? 'FAILED' : 'COMPLETED',
          total_records: mockData.length,
          processed_records: processedCount,
          failed_records: failedCount,
          error_log: errors.length > 0 ? errors : null
        })
        .eq('id', uploadRecord.id);

      setUploadResult({
        total: mockData.length,
        processed: processedCount,
        failed: failedCount,
        errors: errors
      });

      if (processedCount > 0) {
        toast({
          title: "Upload completed",
          description: `${processedCount} payments processed successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        });
        onSuccess();
      }

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: "Failed to process the Excel file",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const downloadTemplate = () => {
    // Updated CSV template with UPI Ref No column
    const csvContent = "Student ID,Amount,Date,UPI Ref No\nSTU001,1500,2024-01-15,UPI123456789\nSTU002,1200,2024-01-15,UPI987654321";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <FileSpreadsheet size={16} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Upload Payments</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          {!uploadResult ? (
            <>
              {/* File Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 mb-2">Drop your Excel file here or</p>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('excel-upload')?.click()}
                  className="mb-2"
                >
                  Choose File
                </Button>
                <input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">Supports .xlsx, .xls, .csv files</p>
                <p className="text-xs text-blue-600 mt-1">Include UPI Ref No column for transaction reference</p>
              </div>

              {file && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet size={16} className="text-green-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                </div>
              )}

              {/* Template Download */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Need a template?</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="text-blue-600 border-blue-200 hover:bg-blue-100"
                >
                  <Download size={14} className="mr-1" />
                  Download Template
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={processExcelFile}
                  disabled={!file || processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? 'Processing...' : 'Process File'}
                </Button>
              </div>
            </>
          ) : (
            /* Results */
            <div className="space-y-4">
              <div className="text-center">
                {uploadResult.failed === 0 ? (
                  <CheckCircle size={48} className="mx-auto text-green-500 mb-2" />
                ) : (
                  <AlertCircle size={48} className="mx-auto text-yellow-500 mb-2" />
                )}
                <h3 className="font-semibold text-lg">Upload Complete</h3>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-bold text-blue-600">{uploadResult.total}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="font-bold text-green-600">{uploadResult.processed}</div>
                  <div className="text-xs text-gray-600">Processed</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="font-bold text-red-600">{uploadResult.failed}</div>
                  <div className="text-xs text-gray-600">Failed</div>
                </div>
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  <h4 className="font-medium text-sm mb-2">Errors:</h4>
                  {uploadResult.errors.map((error: any, index: number) => (
                    <div key={index} className="text-xs bg-red-50 p-2 rounded mb-1">
                      Row {error.row_number}: {error.error_message}
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={onClose}
                className="w-full bg-[#0052cc] hover:bg-blue-700"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadProcessor;
