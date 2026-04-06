import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { XIcon } from 'lucide-react';
import { salesService } from '../services/salesService';

interface RepPerf {
  id: number;
  name: string;
  route_name?: string;
  status?: number; // 1 for active, 0 for inactive
  country?: string;
  distributors: PerfData;
  key_accounts: PerfData;
  retail: PerfData;
}
interface PerfData {
  vapes_target: number;
  pouches_target: number;
  vapes_sales: number;
  pouches_sales: number;
  total_outlets: number;
  outlets_with_orders: number;
  outlet_pct: number;
}

interface Manager {
  id: number;
  name: string;
  region: string;
  managerTypeId: number;
}

const CLIENT_TYPE_LABELS = [
  { key: 'distributors', label: 'Distributors' },
  { key: 'key_accounts', label: 'Key Accounts' },
  { key: 'retail', label: 'Retail' },
] as const;

type ClientTypeKey = typeof CLIENT_TYPE_LABELS[number]['key'];

const SharedPerformancePage: React.FC = () => {
  const [data, setData] = useState<RepPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [pendingStart, setPendingStart] = useState(startDate);
  const [pendingEnd, setPendingEnd] = useState(endDate);
  const [search, setSearch] = useState('');
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'1' | '0' | ''>('1'); // Default to active
  const [selectedCountry, setSelectedCountry] = useState<string>('Kenya'); // Default to Kenya
  const [countries, setCountries] = useState<{id: number; name: string}[]>([]);
  const [salesReps, setSalesReps] = useState<{id: number; status: number; country?: string}[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const fetchData = (s = startDate, e = endDate) => {
    setLoading(true);
    // Fetch performance data, sales rep data, and countries in parallel
    Promise.all([
      axios.get('/api/sales/performance', { params: { start_date: s, end_date: e } }),
      salesService.getAllSalesReps(),
      salesService.getCountries()
    ])
      .then(([performanceRes, salesRepsData, countriesData]) => {
        const performanceData = performanceRes.data.data || [];
        
        // Create maps for quick lookup
        const statusMap = new Map();
        const countryMap = new Map();
        salesRepsData.forEach((rep: any) => {
          statusMap.set(rep.id, rep.status);
          countryMap.set(rep.id, rep.country);
        });
        
        // Merge status and country information into performance data
        const mergedData = performanceData.map((rep: RepPerf) => ({
          ...rep,
          status: statusMap.get(rep.id) || 0, // Default to inactive if not found
          country: countryMap.get(rep.id) || '' // Default to empty if not found
        }));
        
        setData(mergedData);
        setSalesReps(salesRepsData.map((rep: any) => ({ 
          id: rep.id, 
          status: rep.status,
          country: rep.country 
        })));
        setCountries(countriesData);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to fetch data');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    axios.get('/api/managers')
      .then(res => setManagers(res.data))
      .catch(() => setManagers([]));
    // eslint-disable-next-line
  }, [startDate, endDate]);

  const handleApply = () => {
    setStartDate(pendingStart);
    setEndDate(pendingEnd);
  };

  const getPct = (num: number, denom: number) => denom > 0 ? ((num / denom) * 100).toFixed(1) : '0.0';

  // Helper to get the filtered client type label
  function getClientTypeLabel() {
    if (!selectedManager) return '';
    if (selectedManager.managerTypeId === 1) return 'Retail';
    if (selectedManager.managerTypeId === 2) return 'Key Accounts';
    if (selectedManager.managerTypeId === 3) return 'Distributors';
    return 'All Types';
  }

  return (
    <div className="max-w-8xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">
        Shared Performance
        {selectedCountry && selectedCountry !== '' && (
          <span className="ml-2 text-lg font-normal text-blue-600">
            - {selectedCountry}
          </span>
        )}
        {selectedManager && (
          <span className="ml-2 text-lg font-normal text-gray-700">
            - {selectedManager.name} ({selectedManager.region})
            {getClientTypeLabel() && ` - ${getClientTypeLabel()}`}
          </span>
        )}
      </h1>
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="bg-gray-100 text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-200"
        >
          Filter
        </button>
        <span className="text-xs text-gray-500 ml-2">Showing: {startDate} to {endDate}</span>
        <Link
          to="/sales-rep-performance-graph"
          className="ml-4 bg-purple-100 text-purple-700 font-semibold px-4 py-2 rounded shadow hover:bg-purple-200"
        >
          Sales Rep Performance Graph
        </Link>
      </div>
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setIsFilterModalOpen(false)}
              aria-label="Close"
            >
              <XIcon className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold mb-4">Filter Shared Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={pendingStart} onChange={e => setPendingStart(e.target.value)} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={pendingEnd} onChange={e => setPendingEnd(e.target.value)} className="border rounded px-2 py-1 w-full" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search sales rep or route..."
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Manager</label>
                <select
                  value={selectedManager ? selectedManager.id : ''}
                  onChange={e => {
                    const m = managers.find(m => m.id === Number(e.target.value));
                    setSelectedManager(m || null);
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                >
                  <option value="">All Managers</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.region})</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Sales Rep Status</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as '1' | '0' | '')}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                  <option value="">All</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={selectedCountry}
                  onChange={e => setSelectedCountry(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country.id} value={country.name}>{country.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-6 gap-2">
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleApply();
                  setIsFilterModalOpen(false);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
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
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">Sales Rep</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">Client Type</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Total Outlets</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Outlets with Orders</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Outlet %</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Vapes Target</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Vapes Sales</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Vapes %</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Pouches Target</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Pouches Sales</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Pouches %</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Overall %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data
                  .filter(rep => {
                    const q = search.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      rep.name.toLowerCase().includes(q) ||
                      (rep.route_name && rep.route_name.toLowerCase().includes(q))
                    );
                  })
                  .filter(rep => {
                    // Filter by status
                    if (selectedStatus !== '') {
                      // Only show reps whose status exactly matches the selected status
                      return String(rep.status) === selectedStatus;
                    }
                    return true;
                  })
                  .filter(rep => {
                    // Filter by country
                    if (selectedCountry !== '') {
                      return rep.country === selectedCountry;
                    }
                    return true;
                  })
                  .filter(rep => {
                    if (!selectedManager) return true;
                    // region match
                    // rep.region may be undefined, so fallback to ''
                    // If rep.region is not available, skip filtering by region
                    // We'll assume rep.region is available as rep.region or rep.region_name
                    // If not, you may need to adjust backend to include it
                    // For now, skip region filter if not present
                    // Only show reps whose region matches selectedManager.region
                    // Only show the relevant client type row for the managerType
                    // (1=retail, 2=key_accounts, 3=distributors)
                    // We'll filter reps by region, and filter rows by client type below
                    // If rep.region is not available, don't filter out
                    // If you want strict filtering, add rep.region to RepPerf
                    // For now, just return true
                    return true;
                  })
                  .map(rep => {
                    // If manager is selected, only show the relevant client type row
                    let showTypes: string[];
                    if (selectedManager) {
                      if (selectedManager.managerTypeId === 1) showTypes = ['retail'];
                      else if (selectedManager.managerTypeId === 2) showTypes = ['key_accounts'];
                      else if (selectedManager.managerTypeId === 3) showTypes = ['distributors'];
                      else showTypes = ['distributors', 'key_accounts', 'retail'];
                    } else {
                      showTypes = ['distributors', 'key_accounts', 'retail'];
                    }
                    const rows = CLIENT_TYPE_LABELS.filter(ct => showTypes.includes(ct.key)).map((ct, idx) => {
                      const perf = rep[ct.key as ClientTypeKey];
                      const outletPct = perf.total_outlets > 0 ? ((perf.outlets_with_orders / perf.total_outlets) * 100) : 0;
                      const vapesPct = perf.vapes_target > 0 ? ((perf.vapes_sales / perf.vapes_target) * 100) : 0;
                      const pouchesPct = perf.pouches_target > 0 ? ((perf.pouches_sales / perf.pouches_target) * 100) : 0;
                      const overallPct = ((outletPct + vapesPct + pouchesPct) / 3).toFixed(1);
                      return (
                        <tr key={rep.id + '-' + ct.key}>
                          <td className="px-2 py-2 font-medium text-gray-900 whitespace-nowrap">
                            {idx === 0 && (
                              <>
                                {rep.name}
                                {rep.route_name && (
                                  <span className="ml-2 text-sm text-gray-500">({rep.route_name})</span>
                                )}
                                {rep.country && (
                                  <span className="ml-2 text-xs text-blue-600 font-medium">{rep.country}</span>
                                )}
                                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  rep.status === 1 
                                    ? 'bg-green-100 text-green-800' 
                                    : rep.status === 0
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {rep.status === 1 ? 'Active' : rep.status === 0 ? 'Inactive' : 'Unknown'}
                                </span>
                              </>
                            )}
                          </td>
                          <td className="px-2 py-2 text-left font-medium text-gray-700 whitespace-nowrap">{ct.label}</td>
                          <td className="px-2 py-2 text-center">{perf.total_outlets}</td>
                          <td className="px-2 py-2 text-center">{perf.outlets_with_orders}</td>
                          <td className="px-2 py-2 text-center">{outletPct.toFixed(1)}%</td>
                          <td className="px-2 py-2 text-center">{perf.vapes_target}</td>
                          <td className="px-2 py-2 text-center">{perf.vapes_sales}</td>
                          <td className="px-2 py-2 text-center">{vapesPct.toFixed(1)}%</td>
                          <td className="px-2 py-2 text-center">{perf.pouches_target}</td>
                          <td className="px-2 py-2 text-center">{perf.pouches_sales}</td>
                          <td className="px-2 py-2 text-center">{pouchesPct.toFixed(1)}%</td>
                          <td className="px-2 py-2 text-center font-bold text-blue-700">{overallPct}%</td>
                        </tr>
                      );
                    });
                    // Calculate totals (only for visible types)
                    const totals = CLIENT_TYPE_LABELS.filter(ct => showTypes.includes(ct.key)).reduce((acc, ct) => {
                      const perf = rep[ct.key as ClientTypeKey];
                      const outletPct = perf.total_outlets > 0 ? ((perf.outlets_with_orders / perf.total_outlets) * 100) : 0;
                      const vapesPct = perf.vapes_target > 0 ? ((perf.vapes_sales / perf.vapes_target) * 100) : 0;
                      const pouchesPct = perf.pouches_target > 0 ? ((perf.pouches_sales / perf.pouches_target) * 100) : 0;
                      return {
                        total_outlets: acc.total_outlets + perf.total_outlets,
                        outlets_with_orders: acc.outlets_with_orders + perf.outlets_with_orders,
                        outletPct: acc.outletPct + outletPct,
                        vapes_target: acc.vapes_target + perf.vapes_target,
                        vapes_sales: acc.vapes_sales + perf.vapes_sales,
                        vapesPct: acc.vapesPct + vapesPct,
                        pouches_target: acc.pouches_target + perf.pouches_target,
                        pouches_sales: acc.pouches_sales + perf.pouches_sales,
                        pouchesPct: acc.pouchesPct + pouchesPct,
                        overallPct: acc.overallPct + ((outletPct + vapesPct + pouchesPct) / 3)
                      };
                    }, { total_outlets: 0, outlets_with_orders: 0, outletPct: 0, vapes_target: 0, vapes_sales: 0, vapesPct: 0, pouches_target: 0, pouches_sales: 0, pouchesPct: 0, overallPct: 0 });
                    const n = showTypes.length;
                    rows.push(
                      <tr key={rep.id + '-total'} className="bg-gray-100 font-bold">
                        <td className="px-2 py-2 text-gray-900 whitespace-nowrap"></td>
                        <td className="px-2 py-2 text-left text-gray-900 whitespace-nowrap">Total</td>
                        <td className="px-2 py-2 text-center">{totals.total_outlets}</td>
                        <td className="px-2 py-2 text-center">{totals.outlets_with_orders}</td>
                        <td className="px-2 py-2 text-center">{(totals.outletPct / n).toFixed(1)}%</td>
                        <td className="px-2 py-2 text-center">{totals.vapes_target}</td>
                        <td className="px-2 py-2 text-center">{totals.vapes_sales}</td>
                        <td className="px-2 py-2 text-center">{(totals.vapesPct / n).toFixed(1)}%</td>
                        <td className="px-2 py-2 text-center">{totals.pouches_target}</td>
                        <td className="px-2 py-2 text-center">{totals.pouches_sales}</td>
                        <td className="px-2 py-2 text-center">{(totals.pouchesPct / n).toFixed(1)}%</td>
                        <td className="px-2 py-2 text-center text-blue-900">{(totals.overallPct / n).toFixed(1)}%</td>
                      </tr>
                    );
                    return rows;
                  })}
                </tbody>
              </table>
            </div>
          </>
      )}
    </div>
  );
}

export default SharedPerformancePage; 