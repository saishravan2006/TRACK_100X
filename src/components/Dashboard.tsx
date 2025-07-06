
import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, DollarSign, X, Bell } from 'lucide-react';
import RevenueChart from './RevenueChart';

const Dashboard: React.FC = () => {
  const [showNotification, setShowNotification] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  // Mock data - in real app this would come from your database
  const dashboardData = {
    monthlyRevenue: 1500,
    totalStudents: 25,
    classesThisMonth: 30,
    revenueGrowth: 12.5
  };

  useEffect(() => {
    // Trigger confetti for milestones
    if (dashboardData.classesThisMonth >= 30) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, []);

  const MetricCard = ({ icon: Icon, title, value, subtitle, delay }: any) => (
    <div 
      className={`bg-[#0052cc] text-white p-4 rounded-xl shadow-lg animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon size={24} className="opacity-80" />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <h3 className="text-sm opacity-90 mb-1">{title}</h3>
      {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
    </div>
  );

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="confetti-container">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: ['#0052cc', '#28a745', '#ffc107', '#dc3545'][Math.floor(Math.random() * 4)]
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Notification Banner */}
      {showNotification && (
        <div className="bg-[#28a745] text-white px-4 py-3 animate-slide-in-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell size={18} />
              <span className="text-sm font-medium">
                Track 10X Alert: Next class in 45 minutes!
              </span>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="p-1 hover:bg-green-600 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your overview</p>
      </div>

      {/* Metric Cards */}
      <div className="px-4 py-6 space-y-4">
        <MetricCard
          icon={DollarSign}
          title="Monthly Revenue"
          value={`$${dashboardData.monthlyRevenue}`}
          subtitle={`+${dashboardData.revenueGrowth}% from last month`}
          delay={0}
        />
        <MetricCard
          icon={Users}
          title="Total Students"
          value={dashboardData.totalStudents}
          subtitle="Active learners"
          delay={200}
        />
        <MetricCard
          icon={Calendar}
          title="Classes This Month"
          value={dashboardData.classesThisMonth}
          subtitle="Great progress!"
          delay={400}
        />
      </div>

      {/* Revenue Chart */}
      <div className="px-4 pb-6">
        <div className="bg-white rounded-xl shadow-lg p-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Growth</h2>
            <TrendingUp size={20} className="text-[#0052cc]" />
          </div>
          <RevenueChart />
        </div>
      </div>

      <style jsx>{`
        .confetti-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        .confetti {
          position: absolute;
          width: 8px;
          height: 8px;
          opacity: 0.8;
          animation: confetti-fall 2s linear infinite;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        .animate-slide-in-top {
          animation: slideInTop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        @keyframes slideInTop {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
