
import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

interface ExcelUploadProcessorProps {
  onClose: () => void;
  onComplete: () => void;
}

const ExcelUploadProcessor: React.FC<ExcelUploadProcessorProps> = ({ onClose, onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
    }
  };

  const processExcelFile = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      // Read Excel file
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      console.log('Excel data:', data);

      // Get all students from database
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, student_id, name');

      if (studentsError) throw studentsError;

      // Get existing transaction references to check for duplicates
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('transaction_ref')
        .not('transaction_ref', 'is', null);

      if (paymentsError) throw paymentsError;

      const existingTransactionRefs = new Set(
        existingPayments.map(p => p.transaction_ref).filter(ref => ref)
      );

      let processed = 0;
      let skipped = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process each row
      for (const row of data as any[]) {
        try {
          // Extract data from row (adjust column names as needed)
          const studentName = row['Student Name'] || row['Name'] || row['student_name'];
          const amount = parseFloat(row['Amount'] || row['amount'] || '0');
          const upiRef = row['UPI Ref no.'] || row['UPI Ref'] || row['upi_ref'] || row['transaction_ref'];
          const paymentDate = row['Date'] || row['Payment Date'] || row['payment_date'] || new Date().toISOString().split('T')[0];

          // Skip if UPI Ref already exists
          if (upiRef && existingTransactionRefs.has(upiRef)) {
            skipped++;
            console.log(`Skipping duplicate transaction: ${upiRef}`);
            continue;
          }

          // Find student by name or student ID
          const student = students.find(s => 
            s.name.toLowerCase().includes(studentName?.toLowerCase() || '') ||
            s.student_id === studentName
          );

          if (!student) {
            failed++;
            errors.push(`Student not found: ${studentName}`);
            continue;
          }

          // Insert payment
          const { error: insertError } = await supabase
            .from('payments')
            .insert({
              student_id: student.id,
              amount: amount,
              payment_date: paymentDate,
              method: 'Excel Upload',
              transaction_ref: upiRef,
              remarks: `Uploaded from ${file.name}`
            });

          if (insertError) {
            failed++;
            errors.push(`Failed to insert payment for ${studentName}: ${insertError.message}`);
          } else {
            processed++;
            // Add to existing refs set to prevent duplicates within the same upload
            if (upiRef) {
              existingTransactionRefs.add(upiRef);
            }
          }
        } catch (error) {
          failed++;
          errors.push(`Error processing row: ${error}`);
        }
      }

      setResults({
        total: data.length,
        processed,
        skipped,
        failed,
        errors
      });

      toast({
        title: "Upload Complete",
        description: `Processed: ${processed}, Skipped: ${skipped}, Failed: ${failed}`,
      });

    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process Excel file",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-2xl shadow-xl animate-slide-in-bottom pb-safe-area-pb">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#0052cc] to-blue-600 rounded-full flex items-center justify-center">
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

        {/* Content */}
        <div className="p-4">
          {!results ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Select Excel file with payment data</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="cursor-pointer bg-[#0052cc] text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Choose File
                </label>
              </div>

              {file && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Selected: <span className="font-medium">{file.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Expected columns: Student Name, Amount, UPI Ref no., Date
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Duplicate Detection</p>
                    <p>Payments with existing UPI Ref numbers will be automatically skipped.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle size={20} className="text-green-600" />
                  <h3 className="font-semibold text-green-800">Upload Results</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Records:</span>
                    <span className="font-medium ml-2">{results.total}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Processed:</span>
                    <span className="font-medium ml-2 text-green-600">{results.processed}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Skipped:</span>
                    <span className="font-medium ml-2 text-yellow-600">{results.skipped}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Failed:</span>
                    <span className="font-medium ml-2 text-red-600">{results.failed}</span>
                  </div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                  <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {results.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 flex space-x-3 bg-white">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-12 border-gray-300 hover:bg-gray-50"
            disabled={processing}
          >
            {results ? 'Close' : 'Cancel'}
          </Button>
          {!results && (
            <Button
              onClick={processExcelFile}
              disabled={!file || processing}
              className="flex-1 h-12 bg-gradient-to-r from-[#0052cc] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {processing ? 'Processing...' : 'Upload'}
            </Button>
          )}
          {results && (
            <Button
              onClick={onComplete}
              className="flex-1 h-12 bg-gradient-to-r from-[#0052cc] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelUploadProcessor;
