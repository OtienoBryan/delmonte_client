import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  CalendarIcon, 
  UsersIcon, 
  TrendingDownIcon,
  TrendingUpIcon,
  Download,
  RefreshCwIcon,
  SearchIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface MaternalLeaveReportItem {
  id: number;
  name: string;
  employeeNumber: string;
  department: string;
  entitlement: number;
  takenDays: number;
  balance: number;
}

const MaternalLeaveReportPage: React.FC = () => {
  const [reportData, setReportData] = useState<MaternalLeaveReportItem[]>([]);
  const [filteredData, setFilteredData] = useState<MaternalLeaveReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchMaternalLeaveReport();
  }, []);

  useEffect(() => {
    // Filter data based on search term
    if (!searchTerm.trim()) {
      setFilteredData(reportData);
    } else {
      const filtered = reportData.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.department && item.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, reportData]);

  const fetchMaternalLeaveReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/leave-requests/maternal-leave-report');
      setReportData(response.data);
      setFilteredData(response.data);
    } catch (err: any) {
      console.error('Error fetching maternal leave report:', err);
      setError(err.message || 'Failed to fetch maternal leave report');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const total = filteredData.length;
    const totalEntitlement = filteredData.reduce((sum, item) => sum + item.entitlement, 0);
    const totalTaken = filteredData.reduce((sum, item) => sum + item.takenDays, 0);
    const totalBalance = filteredData.reduce((sum, item) => sum + item.balance, 0);
    const averageTaken = total > 0 ? totalTaken / total : 0;
    const averageBalance = total > 0 ? totalBalance / total : 0;

    return {
      total,
      totalEntitlement,
      totalTaken: Math.round(totalTaken * 10) / 10,
      totalBalance: Math.round(totalBalance * 10) / 10,
      averageTaken: Math.round(averageTaken * 10) / 10,
      averageBalance: Math.round(averageBalance * 10) / 10
    };
  };

  const summary = calculateSummary();

  const handleExport = () => {
    // Create CSV content
    const headers = ['Employee Name', 'Department', 'Entitlement (Days)', 'Taken (Days)', 'Balance (Days)'];
    const rows = filteredData.map(item => [
      item.name,
      item.department,
      item.entitlement.toString(),
      item.takenDays.toString(),
      item.balance.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `maternal-leave-report-${currentYear}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-xs font-medium text-gray-900">Loading maternal leave report...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center py-8">
              <p className="text-sm font-medium text-red-600">{error}</p>
              <button
                onClick={fetchMaternalLeaveReport}
                className="mt-3 px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-gray-900">Maternal Leave Report</h1>
                <p className="mt-1 text-xs text-gray-500">
                  Maternal leave entitlement, taken days, and remaining balance for {currentYear}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-2.5 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-3 w-3 mr-1.5" />
                  Export CSV
                </button>
                <button
                  onClick={fetchMaternalLeaveReport}
                  className="inline-flex items-center px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCwIcon className="h-3 w-3 mr-1.5" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 hidden">
          <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-600 hidden">Total Employees</p>
                <p className="text-lg font-bold text-gray-900">{summary.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-600">Total Entitlement</p>
                <p className="text-lg font-bold text-gray-900">{summary.totalEntitlement} days</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CalendarIcon className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-600">Total Taken</p>
                <p className="text-lg font-bold text-gray-900">{summary.totalTaken} days</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Avg: {summary.averageTaken} days</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingDownIcon className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-600">Total Balance</p>
                <p className="text-lg font-bold text-gray-900">{summary.totalBalance} days</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Avg: {summary.averageBalance} days</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUpIcon className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <SearchIcon className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-lg shadow text-center py-8">
            <UsersIcon className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-3 text-sm font-medium text-gray-900">No staff found</h3>
            <p className="mt-2 text-xs text-gray-500">
              {searchTerm ? 'Try adjusting your search' : 'No active staff members found'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Staff Name
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Entitlement
                    </th>
                    <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Taken Days
                    </th>
                    <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-1 bg-gray-100 rounded-full mr-2">
                            <UsersIcon className="h-3 w-3 text-gray-600" />
                          </div>
                          <span className="text-xs font-medium text-gray-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-xs text-gray-600">{item.department}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <span className="text-xs font-medium text-gray-900">{item.entitlement} days</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <span className={`text-xs font-medium ${
                          item.takenDays > 0 ? 'text-amber-600' : 'text-gray-600'
                        }`}>
                          {item.takenDays} days
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          item.balance >= 60 
                            ? 'bg-green-100 text-green-800' 
                            : item.balance >= 30 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : item.balance >= 0
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.balance} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaternalLeaveReportPage;

