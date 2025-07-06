
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
    <div className="min-h-screen bg-gray-50 font-[Roboto,system-ui,sans-serif] max-w-[375px] mx-auto relative">
      {/* Main Content */}
      <main className="relative">
        {renderActiveComponent()}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
