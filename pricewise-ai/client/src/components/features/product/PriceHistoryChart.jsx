import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const RETAILER_COLORS = {
  'Amazon': '#FF9900',
  'Flipkart': '#2874F0',
  'Croma': '#00B0F0',
  'Reliance Digital': '#006CB5',
  'JioMart': '#0078AD',
  'Vijay Sales': '#E31E24',
  'Tata Cliq': '#6C2EB9',
};

const DEFAULT_COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#facc15', '#34d399', '#fb923c', '#94a3b8'];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatPrice(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-neutral-400 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}: {formatPrice(entry.value)}
        </p>
      ))}
    </div>
  );
};

const PriceHistoryChart = ({ history = [] }) => {
  const cleanHistory = (history || []).filter((h) => Number(h?.price) > 0);

  if (cleanHistory.length === 0) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 text-center">
        <p className="text-neutral-500 text-sm">No price history data yet. Keep searching to build trends!</p>
      </div>
    );
  }

  const retailerPointCount = cleanHistory.reduce((acc, row) => {
    const key = row.retailer || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const retailers = [...new Set(cleanHistory.map((h) => h.retailer))]
    .filter((retailer) => (retailerPointCount[retailer] || 0) >= 2)
    .sort((a, b) => (retailerPointCount[b] || 0) - (retailerPointCount[a] || 0))
    .slice(0, 6);

  if (retailers.length === 0) {
    return (
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 text-center">
        <p className="text-neutral-500 text-sm">Not enough clean price history points yet. Keep searching to build trends!</p>
      </div>
    );
  }

  const dateMap = {};

  cleanHistory.forEach(h => {
    if (!retailers.includes(h.retailer)) return;
    const date = formatDate(h.recorded_at);
    if (!dateMap[date]) dateMap[date] = { date };
    dateMap[date][h.retailer] = h.price;
  });

  const chartData = Object.values(dateMap).sort((a, b) => {
    const [dA, mA] = a.date.split('/').map(Number);
    const [dB, mB] = b.date.split('/').map(Number);
    return mA !== mB ? mA - mB : dA - dB;
  });

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
      <h3 className="text-lg font-black text-white mb-4">Price History — Last 30 Days</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis dataKey="date" tick={{ fill: '#737373', fontSize: 11 }} />
          <YAxis tick={{ fill: '#737373', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '12px' }}
            formatter={(value) => <span className="text-xs font-bold text-neutral-300">{value}</span>}
          />
          {retailers.map((retailer, i) => (
            <Line
              key={retailer}
              type="monotone"
              dataKey={retailer}
              stroke={RETAILER_COLORS[retailer] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceHistoryChart;
