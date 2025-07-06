
import React, { useState } from 'react';
import { Upload, Download, DollarSign, FileSpreadsheet, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PaymentManager: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);

  // Mock payment data
  const payments = [
    {
      id: 1,
      studentName: 'Sarah Johnson',
      batch: 'Dance Level 1',
      amount: 150,
      date: '2024-01-15',
      status: 'Paid',
      method: 'Excel Upload'
    },
    {
      id: 2,
      studentName: 'Mike Chen',
      batch: 'Math Tutoring',
      amount: 200,
      date: '2024-01-10',
      status: 'Pending',
      method: 'Manual Entry'
    },
    {
      id: 3,
      studentName: 'Emily Davis',
      batch: 'Dance Level 2',
      amount: 300,
      date: '2024-01-08',
      status: 'Excess',
      method: 'Excel Upload'
    }
  ];

  const totalRevenue = payments.reduce((sum, payment) => 
    payment.status === 'Paid' ? sum + payment.amount : sum, 0
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File uploaded:', file.name);
      // Handle Excel file processing here
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      console.log('File dropped:', files[0].name);
      // Handle file processing here
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Excess': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const PaymentCard = ({ payment, index }: any) => (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 animate-fade-in hover:shadow-md transition-all duration-200"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{payment.studentName}</h3>
          <p className="text-sm text-gray-600 mb-1">{payment.batch}</p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{payment.date}</span>
            <span>•</span>
            <span>{payment.method}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">${payment.amount}</div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
            {payment.status}
          </span>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Payments</h1>
            <p className="text-gray-600">Track and manage student payments</p>
          </div>
          <Button className="bg-[#0052cc] hover:bg-blue-700 min-w-[48px] min-h-[48px]">
            <Plus size={20} />
          </Button>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-100 mb-1">Total Revenue</div>
              <div className="text-3xl font-bold">${totalRevenue}</div>
              <div className="text-green-100 text-sm">This month</div>
            </div>
            <TrendingUp size={32} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Excel Upload Section */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <FileSpreadsheet size={20} className="text-[#0052cc]" />
            <h2 className="font-semibold text-gray-900">Excel Upload</h2>
          </div>
          
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
              dragOver 
                ? 'border-[#0052cc] bg-blue-50' 
                : 'border-gray-300 hover:border-[#0052cc]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload size={32} className="mx-auto text-gray-400 mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Upload Payment Excel File</h3>
            <p className="text-sm text-gray-600 mb-4">
              Drag and drop your Excel file here, or click to browse
            </p>
            
            <div className="flex space-x-3 justify-center">
              <Button 
                variant="outline" 
                className="relative overflow-hidden"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload size={16} className="mr-2" />
                Choose File
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
              
              <Button variant="outline">
                <Download size={16} className="mr-2" />
                Template
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-xl font-bold text-green-600">
              {payments.filter(p => p.status === 'Paid').length}
            </div>
            <div className="text-xs text-gray-600">Paid</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-xl font-bold text-yellow-600">
              {payments.filter(p => p.status === 'Pending').length}
            </div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-xl font-bold text-blue-600">
              {payments.filter(p => p.status === 'Excess').length}
            </div>
            <div className="text-xs text-gray-600">Excess</div>
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="px-4">
        <div className="flex items-center space-x-2 mb-4">
          <DollarSign size={18} className="text-[#0052cc]" />
          <h2 className="font-semibold text-gray-900">Recent Payments</h2>
        </div>
        
        {payments.map((payment, index) => (
          <PaymentCard key={payment.id} payment={payment} index={index} />
        ))}
      </div>
    </div>
  );
};

export default PaymentManager;
