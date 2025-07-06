
import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const RevenueChart: React.FC = () => {
  // Mock revenue data for 6 months
  const data = [
    { month: 'Jan', revenue: 1200 },
    { month: 'Feb', revenue: 1350 },
    { month: 'Mar', revenue: 1100 },
    { month: 'Apr', revenue: 1600 },
    { month: 'May', revenue: 1400 },
    { month: 'Jun', revenue: 1500 },
  ];

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0052cc',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '12px'
            }}
            formatter={(value) => [`$${value}`, 'Revenue']}
            labelStyle={{ color: 'white' }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#0052cc"
            strokeWidth={3}
            dot={{ fill: '#0052cc', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#0052cc', strokeWidth: 2 }}
            animationDuration={1500}
            animationBegin={0}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
