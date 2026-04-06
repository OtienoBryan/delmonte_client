import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface Manager {
  id: number;
  name: string;
  region: string;
  managerTypeId: number;
}

interface PerfData {
  vapes_target: number;
  pouches_target: number;
  vapes_sales: number;
  pouches_sales: number;
  total_outlets?: number;
  outlets_with_orders?: number;
  outlet_pct?: number;
}

interface RepPerf {
  id: number;
  name: string;
  region?: string;
  distributors: PerfData;
  key_accounts: PerfData;
  retail: PerfData;
}

const MANAGER_TYPE_LABELS: Record<number, string> = {
  1: 'Retail',
  2: 'Key Accounts',
  3: 'Distributors',
};

const ManagersPerformancePage: React.FC = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [repData, setRepData] = useState<RepPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().slice(0, 10);
  });
  const [pendingStart, setPendingStart] = useState(startDate);
  const [pendingEnd, setPendingEnd] = useState(endDate);

  const fetchData = (s = startDate, e = endDate) => {
    setLoading(true);
    Promise.all([
      axios.get('/api/managers'),
      axios.get('/api/managers/performance', { params: { start_date: s, end_date: e } }),
    ])
      .then(([mgrRes, repRes]) => {
        setManagers(mgrRes.data || []);
        setRepData(repRes.data.data || []);
      })
      .catch(err => setError(err.message || 'Failed to fetch data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [startDate, endDate]);

  const handleApply = () => {
    setStartDate(pendingStart);
    setEndDate(pendingEnd);
  };

  // Helper to get all reps for a manager (by region)
  function getRepsForManager(manager: Manager) {
    return repData.filter(rep => rep.region === manager.region);
  }

  // Helper to sum up targets and sales for a manager by type
  function getManagerSummary(manager: Manager) {
    const reps = getRepsForManager(manager);
    let typeKey: 'retail' | 'key_accounts' | 'distributors';
    if (manager.managerTypeId === 1) typeKey = 'retail';
    else if (manager.managerTypeId === 2) typeKey = 'key_accounts';
    else typeKey = 'distributors';
    const total = reps.reduce(
      (acc, rep) => {
        const perf = rep[typeKey];
        acc.vapes_target += perf.vapes_target || 0;
        acc.pouches_target += perf.pouches_target || 0;
        acc.vapes_sales += perf.vapes_sales || 0;
        acc.pouches_sales += perf.pouches_sales || 0;
        acc.total_outlets += perf.total_outlets || 0;
        acc.outlets_with_orders += perf.outlets_with_orders || 0;
        return acc;
      },
      { vapes_target: 0, pouches_target: 0, vapes_sales: 0, pouches_sales: 0, total_outlets: 0, outlets_with_orders: 0 }
    );
    const outlet_pct = total.total_outlets > 0 ? (total.outlets_with_orders / total.total_outlets) * 100 : 0;
    const vapesPct = total.vapes_target > 0 ? (total.vapes_sales / total.vapes_target) * 100 : 0;
    const pouchesPct = total.pouches_target > 0 ? (total.pouches_sales / total.pouches_target) * 100 : 0;
    const overallPct = ((outlet_pct + vapesPct + pouchesPct) / 3);
    return { ...total, outlet_pct, vapesPct, pouchesPct, overallPct, typeKey };
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Managers Performance</h1>
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
          <input type="date" value={pendingStart} onChange={e => setPendingStart(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" value={pendingEnd} onChange={e => setPendingEnd(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <button onClick={handleApply} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Apply</button>
        <span className="text-xs text-gray-500 ml-2">Showing: {startDate} to {endDate}</span>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600 mb-4">{error}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white shadow rounded-lg text-xs md:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Manager</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Region</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase">Vapes Target</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase">Vapes Sales</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase">Vapes %</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase">Pouches Target</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase">Pouches Sales</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase">Pouches %</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase">Total Outlets</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase">Outlets with Orders</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase">Outlet %</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase">Overall %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {managers.map(manager => {
                  const summary = getManagerSummary(manager);
                  const vapesPct = summary.vapes_target > 0 ? ((summary.vapes_sales / summary.vapes_target) * 100).toFixed(1) : '0.0';
                  const pouchesPct = summary.pouches_target > 0 ? ((summary.pouches_sales / summary.pouches_target) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={manager.id}>
                      <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{manager.name}</td>
                      <td className="px-4 py-2 text-left">{manager.region}</td>
                      <td className="px-4 py-2 text-left">{MANAGER_TYPE_LABELS[manager.managerTypeId] || 'Unknown'}</td>
                      <td className="px-4 py-2 text-center">{summary.vapes_target}</td>
                      <td className="px-4 py-2 text-center">{summary.vapes_sales}</td>
                      <td className="px-4 py-2 text-center">{vapesPct}%</td>
                      <td className="px-4 py-2 text-center">{summary.pouches_target}</td>
                      <td className="px-4 py-2 text-center">{summary.pouches_sales}</td>
                      <td className="px-4 py-2 text-center">{pouchesPct}%</td>
                      <td className="px-4 py-2 text-center">{summary.total_outlets}</td>
                      <td className="px-4 py-2 text-center">{summary.outlets_with_orders}</td>
                      <td className="px-4 py-2 text-center">{summary.outlet_pct?.toFixed(1)}%</td>
                      <td className={`px-4 py-2 text-center font-bold ${
                        summary.overallPct >= 90 ? 'text-green-700 bg-green-100' :
                        summary.overallPct >= 70 ? 'text-yellow-800 bg-yellow-100' :
                        'text-red-700 bg-red-100'
                      }`}>
                        {summary.overallPct?.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                {managers.length > 0 && (() => {
                  const totals = managers.reduce((acc, manager) => {
                    const summary = getManagerSummary(manager);
                    acc.vapes_target += summary.vapes_target || 0;
                    acc.vapes_sales += summary.vapes_sales || 0;
                    acc.pouches_target += summary.pouches_target || 0;
                    acc.pouches_sales += summary.pouches_sales || 0;
                    acc.total_outlets += summary.total_outlets || 0;
                    acc.outlets_with_orders += summary.outlets_with_orders || 0;
                    acc.outlet_pct += summary.outlet_pct || 0;
                    acc.vapesPct += summary.vapesPct || 0;
                    acc.pouchesPct += summary.pouchesPct || 0;
                    acc.overallPct += summary.overallPct || 0;
                    return acc;
                  }, { vapes_target: 0, vapes_sales: 0, pouches_target: 0, pouches_sales: 0, total_outlets: 0, outlets_with_orders: 0, outlet_pct: 0, vapesPct: 0, pouchesPct: 0, overallPct: 0 });
                  const n = managers.length;
                  return (
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-4 py-2 text-gray-900 whitespace-nowrap"></td>
                      <td className="px-4 py-2 text-left text-gray-900 whitespace-nowrap">Total</td>
                      <td className="px-4 py-2 text-left text-gray-900 whitespace-nowrap"></td>
                      <td className="px-4 py-2 text-center">{totals.vapes_target}</td>
                      <td className="px-4 py-2 text-center">{totals.vapes_sales}</td>
                      <td className="px-4 py-2 text-center">{(totals.vapesPct / n).toFixed(1)}%</td>
                      <td className="px-4 py-2 text-center">{totals.pouches_target}</td>
                      <td className="px-4 py-2 text-center">{totals.pouches_sales}</td>
                      <td className="px-4 py-2 text-center">{(totals.pouchesPct / n).toFixed(1)}%</td>
                      <td className="px-4 py-2 text-center">{totals.total_outlets}</td>
                      <td className="px-4 py-2 text-center">{totals.outlets_with_orders}</td>
                      <td className="px-4 py-2 text-center">{(totals.outlet_pct / n).toFixed(1)}%</td>
                      <td className={`px-4 py-2 text-center font-bold ${
                        (totals.overallPct / n) >= 90 ? 'text-green-700 bg-green-100' :
                        (totals.overallPct / n) >= 70 ? 'text-yellow-800 bg-yellow-100' :
                        'text-red-700 bg-red-100'
                      }`}>
                        {(totals.overallPct / n).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
          {/* Pie chart for managers' overall performance */}
          {managers.length > 0 && (
            <div className="max-w-xl mx-auto mt-10">
              <h2 className="text-lg font-semibold mb-2 text-center">Managers Overall % Performance</h2>
              <Pie
                data={{
                  labels: managers.map(m => m.name),
                  datasets: [
                    {
                      label: 'Overall %',
                      data: managers.map(m => {
                        const summary = getManagerSummary(m);
                        return summary.overallPct || 0;
                      }),
                      backgroundColor: managers.map((_, i) => {
                        // Distinct color palette
                        const palette = [
                          '#22c55e', // green
                          '#eab308', // yellow
                          '#ef4444', // red
                          '#3b82f6', // blue
                          '#a21caf', // purple
                          '#f59e42', // orange
                          '#0ea5e9', // sky
                          '#f43f5e', // pink
                          '#16a34a', // emerald
                          '#facc15', // amber
                          '#6366f1', // indigo
                          '#f87171', // rose
                        ];
                        return palette[i % palette.length];
                      }),
                      borderColor: '#fff',
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  plugins: {
                    legend: { position: 'bottom' },
                    tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(1)}%` } },
                    datalabels: {
                      color: '#222',
                      font: { weight: 'bold' },
                      formatter: (value: number) => `${value.toFixed(1)}%`,
                    },
                  }
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManagersPerformancePage; 