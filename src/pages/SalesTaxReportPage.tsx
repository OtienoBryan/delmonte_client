import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Download, 
  FileText, 
  BarChart3, 
  Calculator,
  Calendar,
  Search,
  RefreshCw,
  Eye,
  Info,
  Receipt,
  FileText as TaxIcon
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface SalesTaxEntry {
  journal_entry_id: number;
  entry_number: string;
  entry_date: string;
  reference: string;
  journal_description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  created_at: string;
  line_id: number;
  account_id: number;
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  line_description: string;
}

interface SalesTaxSummary {
  total_debit: number;
  total_credit: number;
  net_tax_payable: number;
  entry_count: number;
}

interface SalesTaxReportData {
  entries: SalesTaxEntry[];
  summary: SalesTaxSummary;
}

const SalesTaxReportPage: React.FC = () => {
  const [reportData, setReportData] = useState<SalesTaxReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Set default date range to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchSalesTaxReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const fetchSalesTaxReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await axios.get(`${API_BASE_URL}/financial/reports/sales-tax?${params}`);
      
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch sales tax report');
      }
    } catch (err: any) {
      console.error('Error fetching sales tax report:', err);
      setError(err.response?.data?.error || 'Failed to fetch sales tax report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Export PDF functionality to be implemented');
  };

  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log('Export Excel functionality to be implemented');
  };

  const filteredEntries = reportData?.entries.filter(entry => {
    if (!entry) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (entry.entry_number || '').toLowerCase().includes(searchLower) ||
      (entry.reference || '').toLowerCase().includes(searchLower) ||
      (entry.journal_description || '').toLowerCase().includes(searchLower) ||
      (entry.line_description || '').toLowerCase().includes(searchLower)
    );
  }) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center">
                <TaxIcon className="w-5 h-5 mr-2 text-blue-600" />
                Sales Tax Report
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                Sales Tax Payable (Account 35) - {startDate} to {endDate}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-3 h-3 mr-1.5" />
                Export PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FileText className="w-3 h-3 mr-1.5" />
                Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-2 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="w-3 h-3 mr-1.5" />
              Filters
            </button>
            
            {showFilters && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                  />
                  <span className="text-xs text-gray-500">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                  />
                </div>
                
                <button
                  onClick={fetchSalesTaxReport}
                  className="inline-flex items-center px-2 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                  Refresh
                </button>
              </div>
            )}
            
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {reportData && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calculator className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="text-xs font-medium text-gray-500 truncate">
                        Total Credit
                      </dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {formatCurrency(reportData.summary.total_credit)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calculator className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="text-xs font-medium text-gray-500 truncate">
                        Total Debit
                      </dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {formatCurrency(reportData.summary.total_debit)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="text-xs font-medium text-gray-500 truncate">
                        Net Tax Payable
                      </dt>
                      <dd className={`text-sm font-medium ${reportData.summary.net_tax_payable >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(reportData.summary.net_tax_payable)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="text-xs font-medium text-gray-500 truncate">
                        Total Entries
                      </dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {reportData.summary.entry_count}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-4 w-4 text-red-400" />
              </div>
              <div className="ml-2">
                <h3 className="text-xs font-medium text-red-800">
                  Error loading sales tax report
                </h3>
                <div className="mt-1 text-xs text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entries Table */}
      {reportData && !error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-3 py-3 sm:px-4 border-b border-gray-200">
              <h3 className="text-sm leading-6 font-medium text-gray-900">
                Sales Tax Entries
              </h3>
              <p className="mt-1 max-w-2xl text-xs text-gray-500">
                All journal entry lines for Sales Tax Payable account
              </p>
            </div>
            
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-2 text-xs font-medium text-gray-900">No entries found</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'No sales tax entries found for the selected date range.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Entry Details
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Debit
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Credit
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEntries.map((entry) => (
                      <tr key={entry.line_id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {entry.entry_number}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {formatDate(entry.entry_date)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {entry.reference || '-'}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500 max-w-xs truncate">
                          {entry.line_description || entry.journal_description}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            entry.status === 'posted' 
                              ? 'bg-green-100 text-green-800' 
                              : entry.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTaxReportPage;
