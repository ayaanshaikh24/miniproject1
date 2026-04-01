import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Bell, Calendar } from 'lucide-react';

const PriceHistoryChart = ({ data, onSetAlert }) => {
  const [timeRange, setTimeRange] = useState('12M');
  
  const displayData = timeRange === '1M' ? data.slice(-1) : 
                      timeRange === '3M' ? data.slice(-3) : 
                      timeRange === '6M' ? data.slice(-6) : data;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900 p-3 border border-neutral-700 rounded-lg shadow-lg">
          <p className="font-bold text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-neutral-400">{entry.name}:</span>
              <span className="font-bold text-white">₹{entry.value.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-neutral-900 rounded-3xl p-8 border border-neutral-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Price Trends</h3>
          <p className="text-neutral-500 text-sm">Comparing major retailers over the last 12 months.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-neutral-800 p-1 rounded-xl">
          {['1M', '3M', '6M', '12M'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                timeRange === range 
                  ? 'bg-neutral-700 text-white' 
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#737373', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#737373', fontSize: 12 }}
              tickFormatter={(val) => `₹${val/1000}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
            <Line 
              type="monotone" 
              dataKey="amazon" 
              name="Amazon" 
              stroke="#FF9900" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2, fill: '#0a0a0a' }} 
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
              type="monotone" 
              dataKey="flipkart" 
              name="Flipkart" 
              stroke="#2874F0" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2, fill: '#0a0a0a' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
              type="monotone" 
              dataKey="croma" 
              name="Croma" 
              stroke="#00B9B0" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2, fill: '#0a0a0a' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <ReferenceLine y={62999} label={{ position: 'right', value: 'All-time Low', fill: '#22c55e', fontSize: 10, fontWeight: 'bold' }} stroke="#22c55e" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 flex justify-between items-center bg-neutral-800 border border-neutral-700 p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-neutral-700 rounded-lg text-neutral-400">
            <Bell size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Price Drop Alerts</p>
            <p className="text-xs text-neutral-500">Get notified when the price hits your target.</p>
          </div>
        </div>
        <button 
          onClick={onSetAlert}
          className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl transition-all"
        >
          Set Price Alert
        </button>
      </div>
    </div>
  );
};

export default PriceHistoryChart;
