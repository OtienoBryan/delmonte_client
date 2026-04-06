import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  XCircle,
  Calculator,
  Filter
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: number;
  balance: number;
  comparative_balance?: number;
  change?: number;
  change_percentage?: number;
}

interface Subtotals {
  current: number;
  nonCurrent: number;
  other: number;
  total: number;
}

interface BalanceSheetData {
  as_of_date: string;
  compare_date?: string;
  assets: {
    current: Account[];
    non_current: Account[];
    other: Account[];
    subtotals: Subtotals;
    cash_and_equivalents_total?: number;
  };
  liabilities: {
    current: Account[];
    non_current: Account[];
    other: Account[];
    subtotals: Subtotals;
  };
  equity: {
    accounts: Account[];
    subtotals: Subtotals;
  };
  totals: {
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
    total_liabilities_and_equity: number;
  };
  ratios: {
    working_capital: number;
    current_ratio: number;
    debt_to_equity_ratio: number;
    debt_to_asset_ratio: number;
  };
  metadata: {
    generated_at: string;
    has_comparative_data: boolean;
    total_accounts: number;
  };
}

const BalanceSheetReportPage: React.FC = () => {
  const [reportData, setReportData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState('');
  const [compareDate, setCompareDate] = useState('');
  const [showOnlyNonZero, setShowOnlyNonZero] = useState(true);

  useEffect(() => {
    fetchBalanceSheetReport();
    // eslint-disable-next-line
  }, [asOfDate, compareDate]);

  const fetchBalanceSheetReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (asOfDate) params.append('as_of_date', asOfDate);
      if (compareDate) params.append('compare_date', compareDate);
      const res = await axios.get(`${API_BASE_URL}/financial/reports/balance-sheet?${params}`);
      if (res.data.success) {
        setReportData(res.data.data);
      } else {
        setError(res.data.error || 'Failed to fetch balance sheet report');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch balance sheet report');
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

  const formatPercentage = (value: number) => {
    if (isNaN(value) || !isFinite(value)) return '0.00%';
    return `${value.toFixed(2)}%`;
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const rows: string[][] = [
      ['Balance Sheet'],
      [`As of: ${reportData.as_of_date}`],
      [],
      ['ASSETS'],
      ['Account Code', 'Account Name', 'Amount'],
      [],
      ['Current Assets'],
      ...reportData.assets.current.map(acc => [acc.account_code, acc.account_name, number_format(acc.balance)]),
      ['', 'Total Current Assets', number_format(reportData.assets.subtotals.current)],
      [],
      ['Non-Current Assets'],
      ...reportData.assets.non_current.map(acc => [acc.account_code, acc.account_name, number_format(acc.balance)]),
      ['', 'Total Non-Current Assets', number_format(reportData.assets.subtotals.nonCurrent)],
      [],
      ['', 'TOTAL ASSETS', number_format(reportData.totals.total_assets)],
      [],
      ['LIABILITIES AND EQUITY'],
      [],
      ['Current Liabilities'],
      ...reportData.liabilities.current.map(acc => [acc.account_code, acc.account_name, number_format(acc.balance)]),
      ['', 'Total Current Liabilities', number_format(reportData.liabilities.subtotals.current)],
      [],
      ['Non-Current Liabilities'],
      ...reportData.liabilities.non_current.map(acc => [acc.account_code, acc.account_name, number_format(acc.balance)]),
      ['', 'Total Non-Current Liabilities', number_format(reportData.liabilities.subtotals.nonCurrent)],
      [],
      ['Equity'],
      ...reportData.equity.accounts.map(acc => [acc.account_code, acc.account_name, number_format(acc.balance)]),
      ['', 'Total Equity', number_format(reportData.totals.total_equity)],
      [],
      ['', 'TOTAL LIABILITIES AND EQUITY', number_format(reportData.totals.total_liabilities_and_equity)]
    ];

    const csvContent = rows
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `balance_sheet_${reportData.as_of_date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAssets = (accounts: Account[]) => 
    showOnlyNonZero ? accounts.filter(acc => acc.balance !== 0) : accounts;

  const filteredLiabilities = (accounts: Account[]) => 
    showOnlyNonZero ? accounts.filter(acc => acc.balance !== 0) : accounts;

  const filteredEquity = (accounts: Account[]) => 
    showOnlyNonZero ? accounts.filter(acc => acc.balance !== 0) : accounts;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-xs text-gray-600">Loading balance sheet report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="h-6 w-6 text-red-500 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Error Loading Report</h3>
          <p className="text-xs text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchBalanceSheetReport}
            className="inline-flex items-center px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Balance Sheet</h1>
                <p className="text-xs text-gray-600">
                  As of {reportData?.as_of_date || 'Latest'}
                  {reportData?.compare_date && ` (vs ${reportData.compare_date})`}
                </p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              disabled={!reportData}
              className="inline-flex items-center px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3 h-3 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="w-3 h-3 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                As of Date
              </label>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Compare Date (Optional)
              </label>
              <input
                type="date"
                value={compareDate}
                onChange={(e) => setCompareDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyNonZero}
                  onChange={(e) => setShowOnlyNonZero(e.target.checked)}
                  className="w-3 h-3 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-xs font-medium text-gray-700">
                  Show only non-zero balances
                </span>
              </label>
            </div>
          </div>
        </div>

        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-lg shadow-sm p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Assets</p>
                    <p className="text-base font-bold text-green-600">
                      {number_format(reportData.totals.total_assets)}
                    </p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Liabilities</p>
                    <p className="text-base font-bold text-red-600">
                      {number_format(reportData.totals.total_liabilities)}
                    </p>
                  </div>
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Equity</p>
                    <p className="text-base font-bold text-blue-600">
                      {number_format(reportData.totals.total_equity)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Working Capital</p>
                    <p className="text-base font-bold text-teal-600">
                      {number_format(reportData.ratios.working_capital)}
                    </p>
                  </div>
                  <Calculator className="w-4 h-4 text-teal-500" />
                </div>
              </div>
            </div>

            {/* Financial Ratios */}
            <div className="bg-white rounded-lg shadow-sm p-3 mb-4 hidden">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Financial Ratios</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Current Ratio</p>
                  <p className="text-base font-bold text-gray-900">
                    {reportData.ratios.current_ratio.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">Assets / Liabilities</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Debt to Equity</p>
                  <p className="text-base font-bold text-gray-900">
                    {formatPercentage(reportData.ratios.debt_to_equity_ratio * 100)}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">Liabilities / Equity</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Debt to Assets</p>
                  <p className="text-base font-bold text-gray-900">
                    {formatPercentage(reportData.ratios.debt_to_asset_ratio * 100)}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">Liabilities / Assets</p>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Working Capital</p>
                  <p className="text-base font-bold text-gray-900">
                    {number_format(reportData.ratios.working_capital)}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">Current Assets - Liabilities</p>
                </div>
              </div>
            </div>

            {/* Assets Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
              <div className="bg-green-50 px-4 py-2 border-b border-green-200">
                <h2 className="text-sm font-bold text-green-900">ASSETS</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Account Code
                      </th>
                      <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Account Name
                      </th>
                      <th className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Current Assets */}
                    <tr className="bg-green-50">
                      <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-gray-900">
                        Current Assets
                      </td>
                    </tr>
                    {filteredAssets(reportData.assets.current).map((account) => (
                      <tr key={account.account_code} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                          {account.account_code}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {account.account_name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-right font-semibold text-gray-900">
                          {number_format(account.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={2} className="px-4 py-2 text-xs text-gray-900">
                        Total Current Assets
                      </td>
                      <td className="px-4 py-2 text-xs text-right text-gray-900">
                        {number_format(reportData.assets.subtotals.current)}
                      </td>
                    </tr>

                    {/* Non-Current Assets */}
                    <tr className="bg-green-50">
                      <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-gray-900">
                        Non-Current Assets
                      </td>
                    </tr>
                    {filteredAssets(reportData.assets.non_current).map((account) => (
                      <tr key={account.account_code} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                          {account.account_code}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {account.account_name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-right font-semibold text-gray-900">
                          {number_format(account.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={2} className="px-4 py-2 text-xs text-gray-900">
                        Total Non-Current Assets
                      </td>
                      <td className="px-4 py-2 text-xs text-right text-gray-900">
                        {number_format(reportData.assets.subtotals.nonCurrent)}
                      </td>
                    </tr>

                    {/* Total Assets */}
                    <tr className="bg-green-100 border-t-2 border-green-300">
                      <td colSpan={2} className="px-4 py-3 text-xs font-bold text-green-900 uppercase">
                        TOTAL ASSETS
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-bold text-green-900">
                        {number_format(reportData.totals.total_assets)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Liabilities and Equity Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                <h2 className="text-sm font-bold text-red-900">LIABILITIES AND EQUITY</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Account Code
                      </th>
                      <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Account Name
                      </th>
                      <th className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Current Liabilities */}
                    <tr className="bg-red-50">
                      <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-gray-900">
                        Current Liabilities
                      </td>
                    </tr>
                    {filteredLiabilities(reportData.liabilities.current).map((account) => (
                      <tr key={account.account_code} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                          {account.account_code}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {account.account_name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-right font-semibold text-gray-900">
                          {number_format(account.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={2} className="px-4 py-2 text-xs text-gray-900">
                        Total Current Liabilities
                      </td>
                      <td className="px-4 py-2 text-xs text-right text-gray-900">
                        {number_format(reportData.liabilities.subtotals.current)}
                      </td>
                    </tr>

                    {/* Non-Current Liabilities */}
                    <tr className="bg-red-50">
                      <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-gray-900">
                        Non-Current Liabilities
                      </td>
                    </tr>
                    {filteredLiabilities(reportData.liabilities.non_current).map((account) => (
                      <tr key={account.account_code} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                          {account.account_code}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {account.account_name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-right font-semibold text-gray-900">
                          {number_format(account.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={2} className="px-4 py-2 text-xs text-gray-900">
                        Total Non-Current Liabilities
                      </td>
                      <td className="px-4 py-2 text-xs text-right text-gray-900">
                        {number_format(reportData.liabilities.subtotals.nonCurrent)}
                      </td>
                    </tr>

                    {/* Total Liabilities */}
                    <tr className="bg-red-100 border-t-2 border-red-300">
                      <td colSpan={2} className="px-4 py-3 text-xs font-bold text-red-900">
                        TOTAL LIABILITIES
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-bold text-red-900">
                        {number_format(reportData.totals.total_liabilities)}
                      </td>
                    </tr>

                    {/* Equity */}
                    <tr className="bg-blue-50">
                      <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-gray-900">
                        Equity
                      </td>
                    </tr>
                    {filteredEquity(reportData.equity.accounts).map((account) => (
                      <tr key={account.account_code} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                          {account.account_code}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {account.account_name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-right font-semibold text-gray-900">
                          {number_format(account.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={2} className="px-4 py-2 text-xs text-gray-900">
                        Total Equity
                      </td>
                      <td className="px-4 py-2 text-xs text-right text-gray-900">
                        {number_format(reportData.totals.total_equity)}
                      </td>
                    </tr>

                    {/* Total Liabilities and Equity */}
                    <tr className="bg-blue-100 border-t-2 border-blue-300">
                      <td colSpan={2} className="px-4 py-3 text-xs font-bold text-blue-900 uppercase">
                        TOTAL LIABILITIES AND EQUITY
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-bold text-blue-900">
                        {number_format(reportData.totals.total_liabilities_and_equity)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="mt-4 text-center text-xs text-gray-500">
              <p>
                Report generated on {new Date(reportData.metadata.generated_at).toLocaleString()} • 
                {reportData.metadata.total_accounts} accounts included
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BalanceSheetReportPage;
