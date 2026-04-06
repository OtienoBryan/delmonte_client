import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Calculator, 
  Download, 
  Filter, 
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface TrialBalanceAccount {
  account_code: string;
  account_name: string;
  account_type: number;
  account_type_name: string;
  debit: number;
  credit: number;
  balance: number;
  // Date range specific fields
  opening_debit?: number;
  opening_credit?: number;
  opening_balance?: number;
  period_debit?: number;
  period_credit?: number;
  period_balance?: number;
  closing_balance?: number;
}

interface TrialBalanceData {
  as_of_date: string;
  from_date?: string;
  to_date?: string;
  date_range?: string;
  accounts: TrialBalanceAccount[];
  totals: {
    total_debits: number;
    total_credits: number;
    difference: number;
    is_balanced: boolean;
    // Date range specific totals
    total_opening_debit?: number;
    total_opening_credit?: number;
    total_opening_balance?: number;
    total_period_debit?: number;
    total_period_credit?: number;
    total_period_balance?: number;
    total_closing_balance?: number;
  };
  summary_by_type: {
    [key: string]: {
      total_debit: number;
      total_credit: number;
      net_balance: number;
    };
  };
  metadata: {
    generated_at: string;
    total_accounts: number;
  };
}

const TrialBalanceReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showOnlyNonZero, setShowOnlyNonZero] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTrialBalanceReport();
    // eslint-disable-next-line
  }, [fromDate, toDate]);

  const fetchTrialBalanceReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      const res = await axios.get(`${API_BASE_URL}/financial/reports/trial-balance?${params}`);
      if (res.data.success) {
        setReportData(res.data.data);
      } else {
        setError(res.data.error || 'Failed to fetch trial balance report');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trial balance report');
    } finally {
      setLoading(false);
    }
  };

  const number_format = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAccountClick = (accountCode: string) => {
    console.log('Account clicked:', accountCode);
    console.log('Navigating to:', `/dashboard/reports/general-ledger?account=${encodeURIComponent(accountCode)}`);
    navigate(`/dashboard/reports/general-ledger?account=${encodeURIComponent(accountCode)}`);
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const isDateRange = reportData.from_date && reportData.to_date;
    
    let headers: string[];
    let rows: string[][];
    let totalRow: string[];
    
    if (isDateRange) {
      // Date range format with opening, period, and closing balances
      headers = ['Account Code', 'Account Name', 'Account Type', 'Opening Balance', 'Period Debit', 'Period Credit', 'Period Balance', 'Closing Balance'];
      rows = filteredAccounts.map(acc => [
        acc.account_code,
        acc.account_name,
        acc.account_type_name,
        number_format(acc.opening_balance || 0),
        number_format(acc.period_debit || 0),
        number_format(acc.period_credit || 0),
        number_format(acc.period_balance || 0),
        number_format(acc.closing_balance || 0)
      ]);
      totalRow = [
        '', '', 'TOTALS',
        number_format(reportData.totals.total_opening_balance || 0),
        number_format(reportData.totals.total_period_debit || 0),
        number_format(reportData.totals.total_period_credit || 0),
        number_format(reportData.totals.total_period_balance || 0),
        number_format(reportData.totals.total_closing_balance || 0)
      ];
    } else {
      // Simple format with opening, debit, credit, period balance, and closing balance
      headers = ['Account Code', 'Account Name', 'Account Type', 'Opening Balance', 'Debit', 'Credit', 'Period Balance', 'Closing Balance'];
      rows = filteredAccounts.map(acc => [
        acc.account_code,
        acc.account_name,
        acc.account_type_name,
        '0.00',
        number_format(acc.debit),
        number_format(acc.credit),
        number_format(acc.balance),
        number_format(acc.balance)
      ]);
      totalRow = ['', '', 'TOTALS', '0.00', number_format(reportData.totals.total_debits), number_format(reportData.totals.total_credits), number_format(reportData.totals.difference), number_format(reportData.totals.difference)];
    }

    const dateInfo = reportData.date_range || `As of: ${reportData.as_of_date}`;
    const fileName = reportData.from_date && reportData.to_date 
      ? `trial_balance_${reportData.from_date}_to_${reportData.to_date}.csv`
      : `trial_balance_${reportData.as_of_date}.csv`;
    
    const csvRows = [
      ['Trial Balance Report'],
      [dateInfo],
      [],
      headers,
      ...rows,
      [],
      totalRow
    ];
    
    if (isDateRange) {
      csvRows.push(['', '', 'Period Difference', '', '', '', number_format(reportData.totals.difference), '']);
      csvRows.push(['', '', 'Status', '', '', '', reportData.totals.is_balanced ? 'BALANCED' : 'OUT OF BALANCE', '']);
    } else {
      csvRows.push(['', '', 'Difference', '', '', '', number_format(reportData.totals.difference), '']);
      csvRows.push(['', '', 'Status', '', '', '', reportData.totals.is_balanced ? 'BALANCED' : 'OUT OF BALANCE', '']);
    }
    
    const csvContent = csvRows
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAccounts = reportData?.accounts.filter(acc => {
    const matchesSearch = !searchTerm || 
      acc.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.account_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !showOnlyNonZero || (acc.debit !== 0 || acc.credit !== 0);
    
    return matchesSearch && matchesFilter;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading trial balance report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Error Loading Report</h3>
          <p className="text-xs text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchTrialBalanceReport}
            className="inline-flex items-center px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Calculator className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Trial Balance</h1>
                <p className="text-xs text-gray-600">
                  {reportData?.date_range || `As of ${reportData?.as_of_date || 'Latest'}`} • {reportData?.metadata.total_accounts || 0} accounts
                </p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              disabled={!reportData}
              className="inline-flex items-center px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3 h-3 mr-1.5" />
              Export CSV
            </button>
          </div>

          {/* Balance Status */}
          {reportData && (
            <div className={`flex items-center justify-center p-3 rounded-lg ${
              reportData.totals.is_balanced ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {reportData.totals.is_balanced ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-green-900 font-semibold text-sm">
                    Books are balanced ✓
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-red-900 font-semibold text-sm">
                    Out of balance by {number_format(Math.abs(reportData.totals.difference))}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Start date"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="End date"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                <Eye className="w-3 h-3 inline mr-1" />
                Search Accounts
              </label>
              <input
                type="text"
                placeholder="Account code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyNonZero}
                  onChange={(e) => setShowOnlyNonZero(e.target.checked)}
                  className="w-3.5 h-3.5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-xs font-medium text-gray-700">
                  Show only non-zero balances
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Summary by Account Type */}
        {reportData && reportData.summary_by_type && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 hidden">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary by Account Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(reportData.summary_by_type).map(([typeName, summary]) => (
                <div key={typeName} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">{typeName}</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-green-600">Debits:</span>
                      <span className="font-semibold">{number_format(summary.total_debit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Credits:</span>
                      <span className="font-semibold">{number_format(summary.total_credit)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-gray-700 font-medium">Net:</span>
                      <span className="font-bold">{number_format(summary.net_balance)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trial Balance Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {reportData?.from_date && reportData?.to_date ? (
              // Date Range Format with Opening, Period, and Closing Balances
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Account Code
                  </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Account Name
                  </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-blue-600 uppercase tracking-wider">
                      Opening Balance
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-green-600 uppercase tracking-wider">
                      Period Debit
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-red-600 uppercase tracking-wider">
                      Period Credit
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-purple-600 uppercase tracking-wider">
                      Period Balance
                  </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Closing Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.length === 0 ? (
                  <tr>
                      <td colSpan={8} className="px-4 py-4 text-center text-xs text-gray-500">
                      No accounts found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => (
                    <tr key={account.account_code} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {account.account_code}
                      </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <span
                          onClick={() => handleAccountClick(account.account_code)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                          title="Click to view ledger for this account"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleAccountClick(account.account_code);
                            }
                          }}
                        >
                          {account.account_name}
                        </span>
                      </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800">
                          {account.account_type_name}
                        </span>
                      </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-semibold text-blue-700">
                          {number_format(account.opening_balance || 0)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-semibold text-green-700">
                          {(account.period_debit || 0) !== 0 ? number_format(account.period_debit || 0) : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-semibold text-red-700">
                          {(account.period_credit || 0) !== 0 ? number_format(account.period_credit || 0) : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-semibold text-purple-700">
                          {number_format(account.period_balance || 0)}
                      </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-gray-900">
                          {number_format(account.closing_balance || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {reportData && (
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  <tr>
                      <td colSpan={3} className="px-3 py-2 text-xs font-bold text-gray-900 uppercase">
                        Total
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-blue-700">
                        {number_format(reportData.totals.total_opening_balance || 0)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-green-700">
                        {number_format(reportData.totals.total_period_debit || 0)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-red-700">
                        {number_format(reportData.totals.total_period_credit || 0)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-purple-700">
                        {number_format(reportData.totals.total_period_balance || 0)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {number_format(reportData.totals.total_closing_balance || 0)}
                      </td>
                    </tr>
                    {!reportData.totals.is_balanced && (
                      <tr className="bg-red-50">
                        <td colSpan={6} className="px-3 py-2 text-xs font-semibold text-red-900">
                          Period Difference (Out of Balance)
                        </td>
                        <td colSpan={2} className="px-3 py-2 text-xs text-right font-bold text-red-900">
                          {number_format(Math.abs(reportData.totals.difference))}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                )}
              </table>
            ) : (
              // Simple Format - Now with Opening, Period Balance, and Closing Balance columns
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Account Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-blue-600 uppercase tracking-wider">
                      Opening Balance
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-green-600 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-red-600 uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-purple-600 uppercase tracking-wider">
                      Period Balance
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Closing Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 text-center text-xs text-gray-500">
                        No accounts found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((account) => (
                      <tr key={account.account_code} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {account.account_code}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <span
                            onClick={() => handleAccountClick(account.account_code)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                            title="Click to view ledger for this account"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleAccountClick(account.account_code);
                              }
                            }}
                          >
                            {account.account_name}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800">
                            {account.account_type_name}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-semibold text-blue-700">
                          0.00
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-semibold text-green-700">
                          {account.debit !== 0 ? number_format(account.debit) : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-semibold text-red-700">
                          {account.credit !== 0 ? number_format(account.credit) : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-semibold text-purple-700">
                          {number_format(account.balance)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-gray-900">
                          {number_format(account.balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {reportData && (
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-xs font-bold text-gray-900 uppercase">
                        Total
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-blue-700">
                        0.00
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-green-700">
                        {number_format(reportData.totals.total_debits)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-red-700">
                        {number_format(reportData.totals.total_credits)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-right font-bold text-purple-700">
                        {number_format(reportData.totals.difference)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {number_format(reportData.totals.difference)}
                      </td>
                    </tr>
                    {!reportData.totals.is_balanced && (
                      <tr className="bg-red-50">
                        <td colSpan={7} className="px-3 py-2 text-xs font-semibold text-red-900">
                          Difference (Out of Balance)
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-bold text-red-900">
                          {number_format(Math.abs(reportData.totals.difference))}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                )}
              </table>
            )}
          </div>
        </div>

        {/* Metadata Footer */}
        {reportData && (
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>
              Report generated on {new Date(reportData.metadata.generated_at).toLocaleString()} • 
              Showing {filteredAccounts.length} of {reportData.metadata.total_accounts} accounts
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrialBalanceReportPage;

