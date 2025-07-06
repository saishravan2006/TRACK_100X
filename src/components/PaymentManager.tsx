
import React, { useState } from 'react';
import { Upload, Download, TrendingUp, FileSpreadsheet, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PaymentManager: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock payment data
  const payments = [
    {
      id: 1,
      studentName: 'Sarah Johnson',
      className: 'Dance Level 1',
      amount: 150,
      date: '2024-01-15',
      status: 'Paid',
      method: 'Excel Upload',
      phone: '+1 234 567 8901'
    },
    {
      id: 2,
      studentName: 'Mike Chen',
      className: 'Math Tutoring',
      amount: 200,
      date: '2024-01-10',
      status: 'Pending',
      method: 'Manual Entry',
      phone: '+1 234 567 8902'
    },
    {
      id: 3,
      studentName: 'Emily Davis',
      className: 'Dance Level 2',
      amount: 300,
      date: '2024-01-08',
      status: 'Excess',
      method: 'Excel Upload',
      phone: '+1 234 567 8903'
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

  const handleSendReminder = (payment: any) => {
    const message = `Hi ${payment.studentName}, this is a friendly reminder that your payment of ₹${payment.amount} for ${payment.className} is pending. Please make the payment at your earliest convenience. Thank you!`;
    const phoneNumber = payment.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const PaymentCard = ({ payment, index }: any) => (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 animate-fade-in hover:shadow-md transition-all duration-200 mx-3"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base truncate">{payment.studentName}</h3>
          <p className="text-sm text-gray-600 mb-1 truncate">{payment.className}</p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>{payment.date}</span>
            <span>•</span>
            <span className="truncate">{payment.method}</span>
          </div>
        </div>
        <div className="text-right ml-2">
          <div className="text-lg font-bold text-gray-900">₹{payment.amount}</div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(payment.status)}`}>
            {payment.status}
          </span>
        </div>
      </div>
      
      {payment.status === 'Pending' && (
        <div className="pt-3 border-t border-gray-100">
          <Button 
            size="sm" 
            className="bg-[#0052cc] hover:bg-blue-700 text-xs h-8 w-full"
            onClick={() => handleSendReminder(payment)}
          >
            Send Reminder
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-1">Payments</h1>
            <p className="text-gray-600 text-sm">Track and manage student payments</p>
          </div>
          <Button 
            className="bg-red-600 hover:bg-red-700 min-w-[48px] min-h-[48px] px-3 text-xs"
            variant="destructive"
          >
            Reset Month
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search students or classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-100 mb-1">Total Revenue</div>
              <div className="text-3xl font-bold">₹{totalRevenue}</div>
              <div className="text-green-100 text-sm">This month</div>
            </div>
            <TrendingUp size={32} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Three Cards Side by Side */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0052cc] text-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-lg font-bold">
              {payments.filter(p => p.status === 'Paid').length}
            </div>
            <div className="text-xs text-blue-100">Paid</div>
          </div>
          <div className="bg-[#0052cc] text-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-lg font-bold">
              {payments.filter(p => p.status === 'Pending').length}
            </div>
            <div className="text-xs text-blue-100">Pending</div>
          </div>
          <div className="bg-[#0052cc] text-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-lg font-bold">
              {payments.filter(p => p.status === 'Excess').length}
            </div>
            <div className="text-xs text-blue-100">Excess</div>
          </div>
        </div>
      </div>

      {/* Upload and Manual Entry Cards */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {/* Upload Excel Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-center">
              <FileSpreadsheet size={24} className="mx-auto text-[#0052cc] mb-2" />
              <h3 className="font-medium text-gray-900 text-sm mb-2">Upload Payments</h3>
              <p className="text-xs text-gray-600 mb-3">Import payments in seconds!</p>
              <Button 
                size="sm" 
                className="bg-[#0052cc] hover:bg-blue-700 w-full h-8 text-xs"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload size={14} className="mr-1" />
                Choose File
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Manual Entry Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-center">
              <Plus size={24} className="mx-auto text-[#0052cc] mb-2" />
              <h3 className="font-medium text-gray-900 text-sm mb-2">Add Payment</h3>
              <p className="text-xs text-gray-600 mb-3">Manual entry</p>
              <Button size="sm" className="bg-[#0052cc] hover:bg-blue-700 w-full h-8 text-xs">
                Add Payment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="px-1">
        <div className="flex items-center space-x-2 px-3 mb-4">
          <TrendingUp size={18} className="text-[#0052cc]" />
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
