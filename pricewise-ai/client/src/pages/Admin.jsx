import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Activity, Users, Search, Database, CheckCircle, AlertTriangle, Clock, TrendingUp, DollarSign } from 'lucide-react';

const Admin = () => {
  const kpis = [
    { label: "Total Searches", value: "1.2M", change: "+12.5%", icon: <Search size={20} />, color: "bg-blue-500" },
    { label: "Products Tracked", value: "85.4k", change: "+4.2%", icon: <Database size={20} />, color: "bg-purple-500" },
    { label: "Matches Found", value: "98.2%", change: "+0.5%", icon: <CheckCircle size={20} />, color: "bg-green-500" },
    { label: "API Latency", value: "142ms", change: "-8ms", icon: <Activity size={20} />, color: "bg-amber-500" },
  ];

  const topProducts = [
    { name: "iPhone 15", searches: 45000 },
    { name: "Samsung S24", searches: 38000 },
    { name: "PS5 Console", searches: 32000 },
    { name: "MacBook Air", searches: 29000 },
    { name: "Sony WH-5", searches: 24000 },
    { name: "iPad Pro", searches: 21000 },
    { name: "Nintendo Sw", searches: 18000 },
    { name: "GoPro 12", searches: 15000 },
    { name: "Logitech MX", searches: 12000 },
    { name: "AirPods Pro", searches: 10000 },
  ];

  const apiCalls = [
    { day: "Mon", calls: 4500, cost: 45 },
    { day: "Tue", calls: 5200, cost: 52 },
    { day: "Wed", calls: 4800, cost: 48 },
    { day: "Thu", calls: 6100, cost: 61 },
    { day: "Fri", calls: 5900, cost: 59 },
    { day: "Sat", calls: 7200, cost: 72 },
    { day: "Sun", calls: 8100, cost: 81 },
  ];

  const scrapers = [
    { name: "Amazon IN", last: "2 mins ago", success: "99.8%", status: "Healthy", time: "1.2s" },
    { name: "Flipkart", last: "1 min ago", success: "98.5%", status: "Healthy", time: "0.8s" },
    { name: "Tata Cliq", last: "5 mins ago", success: "94.2%", status: "Warning", time: "2.4s" },
    { name: "Croma", last: "2 mins ago", success: "99.9%", status: "Healthy", time: "0.5s" },
    { name: "Reliance Dig", last: "8 mins ago", success: "88.4%", status: "Issue", time: "4.1s" },
    { name: "Meesho", last: "3 mins ago", success: "97.1%", status: "Healthy", time: "1.5s" },
    { name: "Myntra", last: "4 mins ago", success: "99.2%", status: "Healthy", time: "0.9s" },
    { name: "Nykaa", last: "12 mins ago", success: "95.5%", status: "Warning", time: "1.8s" },
    { name: "Snapdeal", last: "10 mins ago", success: "91.2%", status: "Warning", time: "2.1s" },
    { name: "JioMart", last: "2 mins ago", success: "99.5%", status: "Healthy", time: "1.1s" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">System Analytics</h1>
          <p className="text-neutral-500">Monitoring PriceWise AI global operations.</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-bold text-green-400">Live: All Systems Operational</span>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 flex items-center space-x-6">
            <div className={`w-14 h-14 ${kpi.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
              {kpi.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest leading-none mb-1">{kpi.label}</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">{kpi.value}</span>
                <span className={`text-[10px] font-bold ${kpi.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{kpi.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Searched */}
        <div className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800">
          <h3 className="text-xl font-bold text-white mb-8">Top 10 Searched Products</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#262626" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#737373', fontWeight: 'bold' }} width={100} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: '1px solid #262626', background: '#171717', color: '#fff' }} />
                <Bar dataKey="searches" fill="#3b82f6" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* API Usage */}
        <div className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800">
           <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-bold text-white">LLM API Calls & Costs</h3>
             <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-1">
                 <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                 <span className="text-xs font-bold text-neutral-500">Calls</span>
               </div>
               <div className="flex items-center space-x-1">
                 <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                 <span className="text-xs font-bold text-neutral-500">Cost ($)</span>
               </div>
             </div>
           </div>
           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={apiCalls}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} dy={10} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #262626', background: '#171717', color: '#fff' }} />
                  <Area type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                  <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Scraper Health */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
        <div className="px-8 py-6 border-b border-neutral-800">
          <h3 className="text-xl font-bold text-white">Scraper Infrastructure Health</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-950 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                <th className="px-8 py-5">Retailer Instance</th>
                <th className="px-8 py-5">Last Scraped</th>
                <th className="px-8 py-5">Success Rate</th>
                <th className="px-8 py-5">Response Time</th>
                <th className="px-8 py-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {scrapers.map((s, idx) => (
                <tr key={idx} className="hover:bg-neutral-800/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                       <div className="w-2 h-2 rounded-full bg-neutral-600"></div>
                       <span className="font-bold text-white text-sm">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-neutral-500 flex items-center gap-2">
                    <Clock size={14} /> {s.last}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-neutral-800 rounded-full">
                        <div className="h-1.5 bg-green-500 rounded-full" style={{ width: s.success }}></div>
                      </div>
                      <span className="text-xs font-bold text-neutral-300">{s.success}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-neutral-500 font-medium">{s.time}</td>
                  <td className="px-8 py-6 text-right">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${
                      s.status === 'Healthy' ? 'bg-green-500/10 text-green-400' :
                      s.status === 'Warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
