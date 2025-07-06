
import React, { useState } from 'react';
import BottomNavigation from '../components/BottomNavigation';
import Dashboard from '../components/Dashboard';
import StudentManagement from '../components/StudentManagement';
import ClassSchedule from '../components/ClassSchedule';
import PaymentManager from '../components/PaymentManager';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentManagement />;
      case 'schedule':
        return <ClassSchedule />;
      case 'payments':
        return <PaymentManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[Roboto,system-ui,sans-serif]">
      {/* Main Content */}
      <main className="relative">
        {renderActiveComponent()}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Global Styles */}
      <style jsx global>{`
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #0052cc;
          border-radius: 2px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #003d99;
        }
        
        /* Smooth transitions for all interactive elements */
        button, input, select, textarea {
          transition: all 0.2s ease-in-out;
        }
        
        /* Focus styles for accessibility */
        button:focus-visible, input:focus-visible {
          outline: 2px solid #0052cc;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default Index;
