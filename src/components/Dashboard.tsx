
import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Calendar, X, Bell } from 'lucide-react';
import RevenueChart from './RevenueChart';
import { supabase } from '@/integrations/supabase/client';

const Dashboard: React.FC = () => {
  const [showNotification, setShowNotification] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    monthlyRevenue: 0,
    totalStudents: 0,
    classesThisMonth: 0,
    revenueGrowth: 0
  });
  const [classesData, setClassesData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      // Fetch total students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id');
      
      if (studentsError) throw studentsError;

      // Fetch monthly revenue from payments
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('payment_date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);
      
      if (paymentsError) throw paymentsError;

      // Fetch classes this month with full details
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .gte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);
      
      if (classesError) throw classesError;

      const monthlyRevenue = paymentsData?.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0) || 0;
      const totalStudents = studentsData?.length || 0;
      const classesThisMonth = classesData?.length || 0;

      setClassesData(classesData || []);
      setDashboardData({
        monthlyRevenue,
        totalStudents,
        classesThisMonth,
        revenueGrowth: 12.5 // Keep this as mock for now
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Trigger confetti for milestones
    if (dashboardData.classesThisMonth >= 30) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [dashboardData.classesThisMonth]);

  const MetricCard = ({ icon: Icon, title, value, subtitle, delay, showGrowth = false, isClassCard = false }: any) => (
    <div 
      className={`bg-gradient-to-br from-[#0052cc] to-blue-600 text-white p-4 rounded-xl shadow-lg animate-fade-in w-full relative overflow-hidden`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon size={24} className="opacity-80" />
        <div className="text-right">
          <span className="text-2xl font-bold">{value}</span>
          {showGrowth && (
            <div className="flex items-center justify-end mt-1">
              <TrendingUp size={14} className="mr-1" />
              <span className="text-sm font-medium text-green-200">+{dashboardData.revenueGrowth}%</span>
            </div>
          )}
        </div>
      </div>
      <h3 className="text-sm opacity-90 mb-1">{title}</h3>
      {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
      {isClassCard && classesData.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/20">
          <p className="text-xs opacity-70 mb-1">Classes:</p>
          <div className="text-xs opacity-80 space-y-1 max-h-20 overflow-y-auto">
            {classesData.map((cls, index) => (
              <div key={index} className="flex justify-between">
                <span>{cls.class_name}</span>
                <span>{cls.location}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
        <div className="bg-gradient-to-r from-[#28a745] to-green-600 text-white px-4 py-3 animate-slide-in-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell size={18} className="animate-pulse" />
              <span className="text-sm font-medium">
                Track 10X Alert: Next class in 45 minutes!
              </span>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="p-1 hover:bg-green-600 rounded transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50 px-4 py-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-2xl font-bold text-black">
            Welcome Back, Champion!
          </h1>
        </div>
        <p className="text-gray-600 text-sm">Your teaching empire is growing strong</p>
      </div>

      {/* Metric Cards */}
      <div className="px-4 py-6 space-y-4">
        <MetricCard
          icon={TrendingUp}
          title="Monthly Revenue"
          value={`₹${dashboardData.monthlyRevenue}`}
          subtitle="Keep the momentum going!"
          delay={0}
          showGrowth={true}
        />
        <MetricCard
          icon={Users}
          title="Active Students"
          value={dashboardData.totalStudents}
          subtitle="Lives you're transforming"
          delay={200}
        />
        <MetricCard
          icon={Calendar}
          title="Classes This Month"
          value={dashboardData.classesThisMonth}
          subtitle="Incredible progress!"
          delay={400}
          isClassCard={true}
        />
      </div>

      {/* Revenue Chart */}
      <div className="px-4 pb-6">
        <div className="bg-white rounded-xl shadow-lg p-4 animate-fade-in border-l-4 border-[#0052cc]" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <TrendingUp size={20} className="text-[#0052cc]" />
              <span>Revenue Trajectory</span>
            </h2>
          </div>
          <RevenueChart />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
