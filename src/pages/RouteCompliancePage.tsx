import React, { useEffect, useMemo, useState } from 'react';
import { fetchRouteCompliance, RouteComplianceItem } from '../services/routeComplianceService';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Country {
  id: number;
  name: string;
}

const RouteCompliancePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [country, setCountry] = useState<string>('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<RouteComplianceItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [defaultCountrySet, setDefaultCountrySet] = useState<boolean>(false);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get('/sales/countries');
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setCountries(data);
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      }
    };
    fetchCountries();
  }, []);

  // Fetch user's country and set default filter
  useEffect(() => {
    const fetchUserCountry = async () => {
      // Only set default once
      if (!user?.id || countries.length === 0 || defaultCountrySet) return;
      
      try {
        const response = await api.get(`/staff/${user.id}`);
        const staffData = response.data;
        const userCountry = staffData.country || staffData.country_id || staffData.countryId;
        
        // Set default country based on user's country
        // country = 1 means Kenya, country = 2 means Tanzania
        if (userCountry === 1 || userCountry === '1') {
          // Find Kenya in the countries list
          const kenyaCountry = countries.find(c => c.id === 1 || c.name.toLowerCase() === 'kenya');
          if (kenyaCountry) {
            setCountry(kenyaCountry.name);
          } else {
            setCountry('Kenya');
          }
          setDefaultCountrySet(true);
        } else if (userCountry === 2 || userCountry === '2') {
          // Find Tanzania in the countries list
          const tanzaniaCountry = countries.find(c => c.id === 2 || c.name.toLowerCase() === 'tanzania');
          if (tanzaniaCountry) {
            setCountry(tanzaniaCountry.name);
          } else {
            setCountry('Tanzania');
          }
          setDefaultCountrySet(true);
        }
      } catch (error) {
        console.error('Failed to fetch user country:', error);
        // Default to Kenya if we can't fetch the user's country
        if (!defaultCountrySet) {
          setCountry('Kenya');
          setDefaultCountrySet(true);
        }
      }
    };
    
    fetchUserCountry();
  }, [user?.id, countries, defaultCountrySet]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchRouteCompliance({ 
      startDate, 
      endDate, 
      country: country || undefined 
    })
      .then(setRows)
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [startDate, endDate, country]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r => r.salesRepName.toLowerCase().includes(term));
  }, [rows, search]);

  const totalPlanned = useMemo(() => filtered.reduce((s, r) => s + (r.plannedVisits || 0), 0), [filtered]);
  const totalAchieved = useMemo(() => filtered.reduce((s, r) => s + (r.achievedVisits || 0), 0), [filtered]);
  const overallPct = useMemo(() => totalPlanned > 0 ? ((totalAchieved / totalPlanned) * 100).toFixed(1) : '0.0', [totalPlanned, totalAchieved]);

  const exportToCSV = () => {
    if (filtered.length === 0) {
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

    // Create title row with country and date range
    const countryName = country || 'All Countries';
    let dateRangeText = 'All Dates';
    if (startDate && endDate) {
      dateRangeText = `${startDate} to ${endDate}`;
    } else if (startDate) {
      dateRangeText = `From ${startDate}`;
    } else if (endDate) {
      dateRangeText = `Until ${endDate}`;
    }
    const title = `Route Compliance Report - ${countryName} (${dateRangeText})`;

    // Define CSV headers
    const headers = [
      'Sales Rep',
      'Planned Visits',
      'Achieved Visits',
      'Compliance %'
    ];

    // Convert filtered data to CSV rows
    const csvRows = filtered.map(item => {
      return [
        escapeCSV(item.salesRepName),
        escapeCSV(item.plannedVisits.toString()),
        escapeCSV(item.achievedVisits.toString()),
        escapeCSV(item.compliancePct.toString())
      ].join(',');
    });

    // Combine title, headers and rows
    const csvContent = [
      escapeCSV(title),
      '',
      headers.join(','),
      ...csvRows
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const sanitizedCountryName = (country || 'all-countries').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileName = `route-compliance-${sanitizedCountryName}-${new Date().toISOString().split('T')[0]}.csv`;
    
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
        <h1 className="text-lg font-semibold text-gray-900">Route Compliance</h1>
        <div className="flex gap-2">
          <select
            className="border rounded px-2 py-1 text-xs"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
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
            placeholder="Search sales rep..."
            className="border rounded px-2 py-1 text-xs w-48"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={exportToCSV}
            disabled={filtered.length === 0}
            title="Export filtered data to CSV"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="rounded-lg p-3 bg-blue-50">
          <div className="text-[10px] text-blue-700">Total Planned</div>
          <div className="text-lg font-semibold text-blue-900">{totalPlanned}</div>
        </div>
        <div className="rounded-lg p-3 bg-green-50">
          <div className="text-[10px] text-green-700">Total Achieved</div>
          <div className="text-lg font-semibold text-green-900">{totalAchieved}</div>
        </div>
        <div className="rounded-lg p-3 bg-purple-50">
          <div className="text-[10px] text-purple-700">Overall Compliance</div>
          <div className="text-lg font-semibold text-purple-900">{overallPct}%</div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Sales Rep</th>
              <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">Planned</th>
              <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">Achieved</th>
              <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr><td className="px-3 py-2 text-xs text-gray-500" colSpan={5}>Loading...</td></tr>
            )}
            {error && !loading && (
              <tr><td className="px-3 py-2 text-xs text-red-600" colSpan={5}>{error}</td></tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr><td className="px-3 py-2 text-xs text-gray-500" colSpan={5}>No data</td></tr>
            )}
            {!loading && !error && filtered.map(item => (
              <tr key={item.salesRepId} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs font-medium text-gray-900">{item.salesRepName}</td>
                <td className="px-3 py-2 text-xs text-right">{item.plannedVisits}</td>
                <td className="px-3 py-2 text-xs text-right">{item.achievedVisits}</td>
                <td className="px-3 py-2 text-xs text-right">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${item.compliancePct >= 80 ? 'bg-green-100 text-green-800' : item.compliancePct >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {item.compliancePct}%
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    className="text-[10px] text-indigo-600 hover:text-indigo-900"
                    onClick={() =>
                      navigate(
                        `/dashboard/route-compliance/coverage/${item.salesRepId}`,
                        { state: { salesRep: { id: item.salesRepId, name: item.salesRepName }, startDate, endDate } }
                      )
                    }
                  >
                    View Coverage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RouteCompliancePage;


