
import React from 'react';
import { Home, Users, Calendar, CreditCard } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'students', icon: Users, label: 'Students' },
    { id: 'schedule', icon: Calendar, label: 'Schedule' },
    { id: 'payments', icon: CreditCard, label: 'Payments' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                // Haptic feedback simulation
                if (navigator.vibrate) {
                  navigator.vibrate(50);
                }
              }}
              className={`flex flex-col items-center px-3 py-2 min-w-[48px] min-h-[48px] rounded-lg transition-all duration-300 ${
                isActive 
                  ? 'text-[#0052cc] bg-blue-50 scale-110' 
                  : 'text-gray-500 hover:text-[#0052cc] active:scale-95'
              }`}
            >
              <IconComponent 
                size={20} 
                className={`transition-all duration-200 ${isActive ? 'animate-pulse' : ''}`} 
              />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
              {isActive && (
                <div className="absolute -inset-1 bg-[#0052cc] rounded-lg opacity-10 animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
