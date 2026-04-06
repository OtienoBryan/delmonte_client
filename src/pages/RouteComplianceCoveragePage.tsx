import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getWithAuth } from '../utils/fetchWithAuth';

interface SalesRep {
  id: number;
  name: string;
  email?: string;
  route_name?: string;
}

interface JourneyPlan {
  id: number;
  date: string;
  time: string;
  userId: number;
  clientId: number;
  status: number;
  checkInTime?: string;
  checkoutTime?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  client_name?: string;
  client_company_name?: string;
  route_name?: string;
}

const RouteComplianceCoveragePage: React.FC = () => {
  const { salesRepId } = useParams<{ salesRepId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [plans, setPlans] = useState<JourneyPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>((location.state as any)?.startDate || '');
  const [endDate, setEndDate] = useState<string>((location.state as any)?.endDate || '');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      if (!salesRepId) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch sales rep basic info
        const repRes = await getWithAuth(`/api/sales-reps/${salesRepId}`);
        const repJson = await repRes.json();
        if (repJson?.success && repJson.data) setSalesRep(repJson.data);

        // Fetch journey plans for rep
        const plansRes = await getWithAuth(`/api/journey-plans/user/${salesRepId}`);
        const plansJson = await plansRes.json();
        const rawPlans = Array.isArray(plansJson) ? plansJson : (plansJson?.data ?? []);
        setPlans(Array.isArray(rawPlans) ? rawPlans : []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [salesRepId]);

  const filteredPlans = useMemo(() => {
    let list = plans;
    if (startDate) list = list.filter(p => new Date(p.date) >= new Date(startDate));
    if (endDate) list = list.filter(p => new Date(p.date) <= new Date(endDate + 'T23:59:59'));
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(p =>
        (p.client_name || p.client_company_name || '').toLowerCase().includes(term)
      );
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [plans, startDate, endDate, search]);

  const completedCount = filteredPlans.filter(p => p.status === 2 || p.status === 3).length;

  const exportToCSV = () => {
    if (filteredPlans.length === 0) {
      alert('No data to export');
      return;
    }

    // Escape commas and quotes in CSV
    const escapeCSV = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Create title row with sales rep name and date range
    const salesRepName = salesRep?.name || 'Unknown Sales Rep';
    let dateRangeText = 'All Dates';
    if (startDate && endDate) {
      dateRangeText = `${startDate} to ${endDate}`;
    } else if (startDate) {
      dateRangeText = `From ${startDate}`;
    } else if (endDate) {
      dateRangeText = `Until ${endDate}`;
    }
    const title = `Journey Plan Coverage - ${salesRepName} (${dateRangeText})`;

    // Define CSV headers
    const headers = [
      'Date',
      'Client',
      'Scheduled Time',
      'Status',
      'Check-in Time',
      'Check-out Time',
      'Notes'
    ];

    // Convert plans to CSV rows
    const rows = filteredPlans.map(plan => {
      const date = new Date(plan.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      const clientName = plan.client_name || plan.client_company_name || `Client #${plan.clientId}`;
      const status = (plan.status === 2 || plan.status === 3) ? 'Completed' : 
                     plan.status === 1 ? 'In Progress' : 'Pending';
      const checkIn = plan.checkInTime 
        ? new Date(plan.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '-';
      const checkOut = plan.checkoutTime 
        ? new Date(plan.checkoutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '-';
      const notes = plan.notes || '-';

      return [
        escapeCSV(date),
        escapeCSV(clientName),
        escapeCSV(plan.time),
        escapeCSV(status),
        escapeCSV(checkIn),
        escapeCSV(checkOut),
        escapeCSV(notes)
      ].join(',');
    });

    // Combine title, headers and rows
    const csvContent = [
      escapeCSV(title),
      '',
      headers.join(','),
      ...rows
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const sanitizedSalesRepName = (salesRep?.name || 'unknown').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileName = `journey-plan-coverage-${sanitizedSalesRepName}-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
          >
            Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Journey Plan Coverage</h1>
        </div>
        <div className="text-xs text-gray-600">
          {salesRep ? `${salesRep.name}${salesRep.route_name ? ` • ${salesRep.route_name}` : ''}` : ''}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
        <div className="rounded-lg p-3 bg-blue-50">
          <div className="text-[10px] text-blue-700">Total Plans</div>
          <div className="text-lg font-semibold text-blue-900">{filteredPlans.length}</div>
        </div>
        <div className="rounded-lg p-3 bg-green-50">
          <div className="text-[10px] text-green-700">Completed</div>
          <div className="text-lg font-semibold text-green-900">{completedCount}</div>
        </div>
        <div className="rounded-lg p-3 bg-yellow-50">
          <div className="text-[10px] text-yellow-700">Pending</div>
          <div className="text-lg font-semibold text-yellow-900">{filteredPlans.length - completedCount}</div>
        </div>
        <div className="rounded-lg p-3 bg-purple-50">
          <div className="text-[10px] text-purple-700">Completion</div>
          <div className="text-lg font-semibold text-purple-900">
            {filteredPlans.length ? ((completedCount / filteredPlans.length) * 100).toFixed(1) : '0.0'}%
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="date"
          className="border rounded px-2 py-1 text-xs"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="border rounded px-2 py-1 text-xs"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search client..."
          className="border rounded px-2 py-1 text-xs w-48"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {(startDate || endDate || search) && (
          <button
            className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
            onClick={() => { setStartDate(''); setEndDate(''); setSearch(''); }}
          >
            Clear
          </button>
        )}
        <button
          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={exportToCSV}
          disabled={filteredPlans.length === 0}
          title="Export filtered data to CSV"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
              <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr><td className="px-3 py-2 text-xs text-gray-500" colSpan={6}>Loading...</td></tr>
            )}
            {error && !loading && (
              <tr><td className="px-3 py-2 text-xs text-red-600" colSpan={6}>{error}</td></tr>
            )}
            {!loading && !error && filteredPlans.length === 0 && (
              <tr><td className="px-3 py-2 text-xs text-gray-500" colSpan={6}>No journey plans found</td></tr>
            )}
            {!loading && !error && filteredPlans.map(plan => (
              <tr key={plan.id} className={plan.status === 2 || plan.status === 3 ? 'bg-green-50' : ''}>
                <td className="px-3 py-2 text-xs text-gray-900">
                  {new Date(plan.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-3 py-2 text-xs text-gray-900">
                  {plan.client_name || plan.client_company_name || `Client #${plan.clientId}`}
                </td>
                <td className="px-3 py-2 text-xs text-center text-gray-900">{plan.time}</td>
                <td className="px-3 py-2 text-xs text-center">
                  <span className={
                    `inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ` +
                    ((plan.status === 2 || plan.status === 3) ? 'bg-green-100 text-green-800' : plan.status === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800')
                  }>
                    {(plan.status === 2 || plan.status === 3) ? 'Completed' : plan.status === 1 ? 'In Progress' : 'Pending'}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-center text-gray-700">
                  {plan.checkInTime ? new Date(plan.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
                <td className="px-3 py-2 text-xs text-center text-gray-700">
                  {plan.checkoutTime ? new Date(plan.checkoutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RouteComplianceCoveragePage;


