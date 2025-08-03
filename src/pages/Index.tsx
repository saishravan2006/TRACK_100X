
import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import BottomNavigation from '../components/BottomNavigation';
import Dashboard from '../components/Dashboard';
import StudentManagement from '../components/StudentManagement';
import CalendarView from '../components/CalendarView';
import PaymentManager from '../components/PaymentManager';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      {/* Logout Button - Only show on dashboard */}
      {activeTab === 'dashboard' && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleLogout}
            className="p-2 bg-white shadow-lg rounded-full hover:bg-red-50 transition-colors group"
            title="Logout"
          >
            <LogOut size={20} className="text-red-600 group-hover:text-red-700" />
          </button>
        </div>
      )}

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
