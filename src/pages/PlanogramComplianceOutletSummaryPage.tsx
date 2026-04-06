import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Download,
  Building2,
  BarChart3,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { DateTime } from 'luxon';

interface OutletAccountSummary {
  outlet_account_id: number;
  outlet_account_name: string;
  total_products: number;
  total_target_quantity: number;
  total_actual_quantity: number;
  overall_compliance: number;
  total_report_count: number;
  last_report_date: string | null;
}

const PlanogramComplianceOutletSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [summaryData, setSummaryData] = useState<OutletAccountSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get date filters from location state or use current month defaults
  const [startDate, setStartDate] = useState<string>(
    (location.state as any)?.startDate || DateTime.now().startOf('month').toISODate() || ''
  );
  const [endDate, setEndDate] = useState<string>(
    (location.state as any)?.endDate || DateTime.now().endOf('month').toISODate() || ''
  );

  useEffect(() => {
    fetchOutletSummary();
  }, [startDate, endDate]);

  const fetchOutletSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await axios.get(`/api/planogram-compliance/outlet-summary?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.data.success) {
        setSummaryData(res.data.data);
      } else {
        setError(res.data.error || 'Failed to fetch outlet summary');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch outlet summary');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Outlet Account',
      'Total Products',
      'Total Target Quantity',
      'Total Actual Quantity',
      'Overall Compliance %',
      'Total Report Count',
      'Last Report Date',
    ];

    const csvRows = [
      headers.join(','),
      ...summaryData.map((row) => {
        const escapeCSV = (val: any) => {
          if (val === null || val === undefined) return '';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        return [
          escapeCSV(row.outlet_account_name),
          escapeCSV(row.total_products),
          escapeCSV(row.total_target_quantity),
          escapeCSV(row.total_actual_quantity),
          escapeCSV(`${row.overall_compliance.toFixed(1)}%`),
          escapeCSV(row.total_report_count),
          escapeCSV(row.last_report_date ? new Date(row.last_report_date).toLocaleDateString() : ''),
        ].join(',');
      }),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `outlet_account_summary_${DateTime.now().toISODate()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Outlets Planogram Compliance Summary</h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  Overall planogram compliance by outlet account
                  {startDate && endDate && (
                    <span className="ml-2">
                      ({new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1.5"
                />
                <span className="text-xs text-gray-600">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1.5"
                />
              </div>
              <button
                onClick={handleExportCSV}
                disabled={summaryData.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3 h-3" />
                Export CSV
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

        {/* Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-xs text-gray-600 mt-3">Loading outlet summary...</p>
          </div>
        ) : summaryData.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-600">No outlet account data found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outlet Account
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Products
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actual Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overall Compliance %
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Count
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Report Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summaryData.map((summary) => (
                    <tr key={summary.outlet_account_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">{summary.outlet_account_name}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="text-xs text-gray-900">{summary.total_products}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="text-xs font-semibold text-gray-900">{summary.total_target_quantity}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="text-xs text-gray-900">{summary.total_actual_quantity}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className={`text-xs font-semibold ${
                          summary.overall_compliance >= 100 ? 'text-green-600' :
                          summary.overall_compliance >= 80 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {summary.overall_compliance.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="text-xs text-gray-600">{summary.total_report_count}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          {summary.last_report_date
                            ? new Date(summary.last_report_date).toLocaleDateString()
                            : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-900">Total</td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900">
                      {summaryData.reduce((sum, s) => sum + s.total_products, 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900">
                      {summaryData.reduce((sum, s) => sum + s.total_target_quantity, 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900">
                      {summaryData.reduce((sum, s) => sum + s.total_actual_quantity, 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900">
                      {(() => {
                        const totalTarget = summaryData.reduce((sum, s) => sum + s.total_target_quantity, 0);
                        const totalActual = summaryData.reduce((sum, s) => sum + s.total_actual_quantity, 0);
                        const overall = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : '0.0';
                        return `${overall}%`;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900">
                      {summaryData.reduce((sum, s) => sum + s.total_report_count, 0)}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanogramComplianceOutletSummaryPage;
