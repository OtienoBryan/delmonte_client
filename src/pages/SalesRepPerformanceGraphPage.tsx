import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

// Add country to RepPerf type
type RepPerf = {
  id: number;
  name: string;
  route_name: string;
  region: string;
  country: string;
  distributors: any;
  key_accounts: any;
  retail: any;
};
interface PerfData {
  vapes_target: number;
  pouches_target: number;
  vapes_sales: number;
  pouches_sales: number;
  total_outlets: number;
  outlets_with_orders: number;
  outlet_pct: number;
}

const CLIENT_TYPE_LABELS = [
  { key: 'distributors', label: 'Distributors' },
  { key: 'key_accounts', label: 'Key Accounts' },
  { key: 'retail', label: 'Retail' },
] as const;

type ClientTypeKey = typeof CLIENT_TYPE_LABELS[number]['key'];

const SalesRepPerformanceGraphPage: React.FC = () => {
  const [data, setData] = useState<RepPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [pendingStart, setPendingStart] = useState(startDate);
  const [pendingEnd, setPendingEnd] = useState(endDate);
  const [country, setCountry] = useState('');
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/sales/performance', { params: { start_date: startDate, end_date: endDate } })
      .then(res => setData(res.data.data || []))
      .catch(err => setError(err.message || 'Failed to fetch performance'))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  useEffect(() => {
    axios.get('/api/countries')
      .then(res => {
        if (res.data.success) {
          setCountries(res.data.data.map((row: { name: string }) => row.name));
        }
      })
      .catch(() => setCountries([]));
  }, []);

  const handleApply = () => {
    setStartDate(pendingStart);
    setEndDate(pendingEnd);
  };

  // Prepare data for bar chart: one bar per sales rep, showing overall %
  const chartData = data
    .filter(rep => !country || (rep.country === country))
    .map(rep => {
    // Calculate overall % as average of Outlet %, Vapes %, and Pouches % across all client types
    const allTypes = ['distributors', 'key_accounts', 'retail'] as ClientTypeKey[];
    let outletPctSum = 0, vapesPctSum = 0, pouchesPctSum = 0;
    allTypes.forEach(type => {
      const perf = rep[type];
      const outletPct = perf.total_outlets > 0 ? (perf.outlets_with_orders / perf.total_outlets) * 100 : 0;
      const vapesPct = perf.vapes_target > 0 ? (perf.vapes_sales / perf.vapes_target) * 100 : 0;
      const pouchesPct = perf.pouches_target > 0 ? (perf.pouches_sales / perf.pouches_target) * 100 : 0;
      outletPctSum += outletPct;
      vapesPctSum += vapesPct;
      pouchesPctSum += pouchesPct;
    });
    const n = allTypes.length;
    const overall = ((outletPctSum + vapesPctSum + pouchesPctSum) / (n * 3));
    return {
      rep: rep.name, // Only show the name, not the route name
      overall: Number(overall.toFixed(1)),
    };
  });

  return (
    <div className="max-w-8xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Sales Rep Performance (Bar Graph)</h1>
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
          <input type="date" value={pendingStart} onChange={e => setPendingStart(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" value={pendingEnd} onChange={e => setPendingEnd(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button onClick={handleApply} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Apply</button>
        <span className="text-xs text-gray-500 ml-2">Showing: {startDate} to {endDate}</span>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600 mb-4">{error}</div>
      ) : (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rep" type="category" interval={0} angle={-30} textAnchor="end" height={80}
              tick={{ fontSize: 10 }}
            />
            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={v => `${v}%`} />
            <Legend />
            <Bar dataKey="overall" fill="#7CB9E8" name="Overall %" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default SalesRepPerformanceGraphPage; 