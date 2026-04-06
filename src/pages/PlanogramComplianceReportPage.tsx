import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Layout,
  ArrowLeft,
  Filter,
  Download,
  Search,
  Building2,
  Package,
  Percent,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DateTime } from 'luxon';

interface PlanogramComplianceReport {
  id: number;
  outlet_account_id: number;
  product_id: number;
  target_quantity: number;
  outlet_account_name: string;
  product_name: string;
  product_code: string;
  actual_quantity: number;
  report_count: number;
  last_report_date: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}


const PlanogramComplianceReportPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<PlanogramComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState<string>(
    DateTime.now().startOf('month').toISODate() || ''
  );
  const [endDate, setEndDate] = useState<string>(
    DateTime.now().endOf('month').toISODate() || ''
  );
  const [selectedOutletAccount, setSelectedOutletAccount] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [outletAccounts, setOutletAccounts] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetchOutletAccounts();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, selectedOutletAccount, searchQuery, pagination.page, pagination.limit]);

  const fetchOutletAccounts = async () => {
    try {
      const res = await axios.get('/api/outlet-accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.data.success) {
        setOutletAccounts(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch outlet accounts:', err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedOutletAccount && selectedOutletAccount !== 'all') {
        params.append('outletAccountId', selectedOutletAccount);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await axios.get(`/api/planogram-compliance/report?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.data.success) {
        setReports(res.data.data);
        setPagination(res.data.pagination);
      } else {
        setError(res.data.error || 'Failed to fetch planogram compliance report');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch planogram compliance report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedOutletAccount && selectedOutletAccount !== 'all') {
        params.append('outletAccountId', selectedOutletAccount);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await axios.get(`/api/planogram-compliance/report?${params}&limit=-1`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.data.success) {
        const csvData = res.data.data;
        const headers = [
          'Outlet Account',
          'Product Name',
          'Target Quantity',
          'Actual Quantity',
          'Compliance %',
          'Report Count',
          'Last Report Date',
        ];

        const csvRows = [
          headers.join(','),
          ...csvData.map((row: PlanogramComplianceReport) => {
            const escapeCSV = (val: any) => {
              if (val === null || val === undefined) return '';
              const str = String(val);
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            };

            const compliancePercentage = row.target_quantity > 0 
              ? ((row.actual_quantity / row.target_quantity) * 100).toFixed(1)
              : row.actual_quantity > 0 ? '100.0' : '0.0';
            
            return [
              escapeCSV(row.outlet_account_name),
              escapeCSV(row.product_name),
              escapeCSV(row.target_quantity),
              escapeCSV(row.actual_quantity),
              escapeCSV(`${compliancePercentage}%`),
              escapeCSV(row.report_count),
              escapeCSV(row.last_report_date ? new Date(row.last_report_date).toLocaleDateString() : ''),
            ].join(',');
          }),
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `planogram_compliance_report_${DateTime.now().toISODate()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const getComplianceStatus = (target: number, actual: number): { color: string; icon: React.ReactNode; label: string } => {
    // Compare target quantity with actual quantity
    if (actual >= target) {
      return {
        color: 'text-green-600',
        icon: <CheckCircle2 className="w-4 h-4" />,
        label: 'Compliant',
      };
    } else if (actual > 0) {
      return {
        color: 'text-yellow-600',
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Below Target',
      };
    } else {
      return {
        color: 'text-red-600',
        icon: <XCircle className="w-4 h-4" />,
        label: 'Not Reported',
      };
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleResetFilters = () => {
    setStartDate(DateTime.now().startOf('month').toISODate() || '');
    setEndDate(DateTime.now().endOf('month').toISODate() || '');
    setSelectedOutletAccount('all');
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleOpenSummaryPage = () => {
    navigate('/planogram-compliance-outlet-summary', {
      state: {
        startDate,
        endDate,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-xs text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-3 h-3 mr-1.5" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Layout className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Planogram Compliance Report</h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  Compare planogram compliance target quantities with actual quantities from ProductReport
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenSummaryPage}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100"
              >
                <BarChart3 className="w-3 h-3" />
                Outlet Summary
              </button>
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-3 h-3" />
                Filters
              </button>
              <button
                onClick={handleExportCSV}
                disabled={exporting || reports.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3 h-3" />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-800">{error}</p>
          </div>
        )}

        {/* Filters Summary */}
        {(selectedOutletAccount !== 'all' || searchQuery || startDate || endDate) && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-blue-800">
              {startDate && endDate && (
                <span>
                  <CalendarIcon className="w-2.5 h-2.5 inline mr-1" />
                  {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                </span>
              )}
              {selectedOutletAccount !== 'all' && (
                <span>
                  <Building2 className="w-2.5 h-2.5 inline mr-1" />
                  {outletAccounts.find((oa) => oa.id.toString() === selectedOutletAccount)?.name}
                </span>
              )}
              {searchQuery && (
                <span>
                  <Search className="w-2.5 h-2.5 inline mr-1" />
                  {searchQuery}
                </span>
              )}
            </div>
            <button
              onClick={handleResetFilters}
              className="text-[10px] text-blue-600 hover:text-blue-800 underline"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-xs text-gray-600 mt-3">Loading planogram compliance report...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <Layout className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-600">No planogram compliance data found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Outlet Account
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Target Quantity
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Actual Quantity
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Compliance %
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Report Count
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Last Report Date
                    </th>
                    <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => {
                    const status = getComplianceStatus(report.target_quantity, report.actual_quantity);
                    const compliancePercentage = report.target_quantity > 0 
                      ? ((report.actual_quantity / report.target_quantity) * 100).toFixed(1)
                      : report.actual_quantity > 0 ? '100.0' : '0.0';
                    return (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">{report.outlet_account_name}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{report.product_name}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="text-xs font-semibold text-gray-900">{report.target_quantity}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="text-xs text-gray-900">{report.actual_quantity}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className={`text-xs font-semibold ${
                            parseFloat(compliancePercentage) >= 100 ? 'text-green-600' :
                            parseFloat(compliancePercentage) >= 80 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {compliancePercentage}%
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="text-xs text-gray-600">{report.report_count}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-600">
                            {report.last_report_date
                              ? new Date(report.last_report_date).toLocaleDateString()
                              : '-'}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <div className={`flex items-center justify-center gap-1 ${status.color}`}>
                            {status.icon}
                            <span className="text-[10px]">{status.label}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {reports.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </span>
                  <span className="text-[10px] text-gray-500">|</span>
                  <span className="text-[10px] text-gray-700">Show</span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    className="text-[10px] border border-gray-300 rounded px-1.5 py-0.5"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-[10px] text-gray-700">per page</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-2 py-0.5 text-[10px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-2 py-0.5 text-[10px] border border-gray-300 rounded hover:bg-gray-50 ${
                          pagination.page === pageNum
                            ? 'bg-green-600 text-white border-green-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-2 py-0.5 text-[10px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsFilterModalOpen(false)}
            ></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-3 pt-4 pb-3 sm:p-4 sm:pb-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs leading-5 font-medium text-gray-900">Filter Report</h3>
                  <button
                    onClick={() => setIsFilterModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-[10px] border border-gray-300 rounded-lg px-2 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-[10px] border border-gray-300 rounded-lg px-2 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Outlet Account</label>
                    <select
                      value={selectedOutletAccount}
                      onChange={(e) => setSelectedOutletAccount(e.target.value)}
                      className="w-full text-[10px] border border-gray-300 rounded-lg px-2 py-1.5"
                    >
                      <option value="all">All Outlet Accounts</option>
                      {outletAccounts.map((oa) => (
                        <option key={oa.id} value={oa.id.toString()}>
                          {oa.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by product or outlet account..."
                      className="w-full text-[10px] border border-gray-300 rounded-lg px-2 py-1.5"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-1.5">
                  <button
                    onClick={handleResetFilters}
                    className="px-3 py-1.5 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      setIsFilterModalOpen(false);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="px-3 py-1.5 text-[10px] font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PlanogramComplianceReportPage;
