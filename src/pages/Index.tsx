
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import BottomNavigation from '../components/BottomNavigation';
import Dashboard from '../components/Dashboard';
import StudentManagement from '../components/StudentManagement';
import CalendarView from '../components/CalendarView';
import PaymentManager from '../components/PaymentManager';
import UserProfile from '../components/UserProfile';
import SubscriptionModal from '../components/SubscriptionModal';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentManagement />;
      case 'schedule':
        return <CalendarView />;
      case 'payments':
        return <PaymentManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-[Roboto,system-ui,sans-serif] max-w-[375px] mx-auto relative">
      {/* User Profile - Only show on dashboard */}
      {activeTab === 'dashboard' && (
        <div className="absolute top-4 right-4 z-10">
          <UserProfile onOpenSubscription={() => setShowSubscriptionModal(true)} />
        </div>
      )}

      {/* Main Content */}
      <main className="relative">
        {renderActiveComponent()}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Subscription Modal */}
      <SubscriptionModal 
        open={showSubscriptionModal} 
        onOpenChange={setShowSubscriptionModal} 
      />
    </div>
  );
};

export default Index;
