import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download, 
  Filter,
  ChevronDown,
  ChevronRight,
  Activity,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar
} from 'lucide-react';

interface CashFlowItem {
  account_code: string;
  account_name: string;
  net_change: number;
}

interface CashFlowSection {
  items: CashFlowItem[];
  total: number;
}

interface CashFlowData {
  period: string;
  operations: CashFlowSection;
  investing: CashFlowSection;
  financing: CashFlowSection;
  net_cash_flow: number;
  opening_balance?: number;
  closing_balance?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CashFlowReportPage: React.FC = () => {
  const [reportData, setReportData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('current_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    operations: true,
    investing: true,
    financing: true
  });

  useEffect(() => {
    fetchCashFlowReport();
    // eslint-disable-next-line
  }, [period, startDate, endDate]);

  const fetchCashFlowReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (period === 'custom' && startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      const res = await axios.get(`${API_BASE_URL}/financial/reports/cash-flow?${params}`);
      if (res.data.success) {
        setReportData(res.data.data);
      } else {
        setError(res.data.error || 'Failed to fetch cash flow report');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cash flow report');
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderCashFlowSection = (
    title: string,
    section: CashFlowSection,
    sectionKey: string
  ) => (
    <div className="border-b border-gray-200">
      <div 
        className="px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center space-x-2">
          {expandedSections[sectionKey] ? 
            <ChevronDown className="w-4 h-4 text-gray-400" /> : 
            <ChevronRight className="w-4 h-4 text-gray-400" />
          }
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        </div>
        <span className={`text-sm font-bold ${section.total >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
          {section.total >= 0 ? '' : '('}
          {number_format(Math.abs(section.total))}
          {section.total >= 0 ? '' : ')'}
        </span>
      </div>
      {expandedSections[sectionKey] && (
        <div className="bg-gray-50">
          {section.items.length > 0 ? (
            <div className="px-4 py-2">
              {section.items.map(item => (
                <div key={item.account_code} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500 w-20 font-mono">{item.account_code}</span>
                    <span className="text-xs text-gray-700">{item.account_name}</span>
                  </div>
                  <span className={`text-xs font-medium ${item.net_change >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {item.net_change >= 0 ? '' : '('}
                    {number_format(Math.abs(item.net_change))}
                    {item.net_change >= 0 ? '' : ')'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-2 text-xs text-gray-500">No transactions in this period.</div>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Statement of Cash Flows</h1>
                <p className="text-xs text-gray-600 mt-1">
                  For the period: {reportData?.period || 'Loading...'}
                </p>
              </div>
              <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Download className="w-3 h-3 mr-1.5" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-4 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <label className="text-xs font-medium text-gray-700">Period:</label>
                <select
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="current_month">Current Month</option>
                  <option value="current_quarter">Current Quarter</option>
                  <option value="current_year">Current Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              {period === 'custom' && (
                <>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-medium text-gray-700">From:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-medium text-gray-700">To:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        ) : reportData ? (
          <>
            {/* Summary Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-blue-100 rounded">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-gray-600 uppercase">Operating</p>
                    <p className={`text-sm font-bold ${reportData.operations.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.operations.total >= 0 ? '' : '('}
                      {number_format(Math.abs(reportData.operations.total))}
                      {reportData.operations.total >= 0 ? '' : ')'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-purple-100 rounded">
                    <TrendingDown className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-gray-600 uppercase">Investing</p>
                    <p className={`text-sm font-bold ${reportData.investing.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.investing.total >= 0 ? '' : '('}
                      {number_format(Math.abs(reportData.investing.total))}
                      {reportData.investing.total >= 0 ? '' : ')'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-100 rounded">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-gray-600 uppercase">Financing</p>
                    <p className={`text-sm font-bold ${reportData.financing.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.financing.total >= 0 ? '' : '('}
                      {number_format(Math.abs(reportData.financing.total))}
                      {reportData.financing.total >= 0 ? '' : ')'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-teal-100 rounded">
                    <Wallet className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-gray-600 uppercase">Net Flow</p>
                    <p className={`text-sm font-bold ${reportData.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.net_cash_flow >= 0 ? '' : '('}
                      {number_format(Math.abs(reportData.net_cash_flow))}
                      {reportData.net_cash_flow >= 0 ? '' : ')'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Cash Flow Statement */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Statement Header */}
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="text-sm font-bold text-gray-900 text-center">CASH FLOW STATEMENT</h2>
                <p className="text-xs text-gray-600 text-center mt-0.5">All amounts in KES</p>
              </div>

              {/* Cash Flow Sections */}
              <div>
                {/* Operating Activities */}
                {renderCashFlowSection(
                  'CASH FLOWS FROM OPERATING ACTIVITIES',
                  reportData.operations,
                  'operations'
                )}

                {/* Investing Activities */}
                {renderCashFlowSection(
                  'CASH FLOWS FROM INVESTING ACTIVITIES',
                  reportData.investing,
                  'investing'
                )}

                {/* Financing Activities */}
                {renderCashFlowSection(
                  'CASH FLOWS FROM FINANCING ACTIVITIES',
                  reportData.financing,
                  'financing'
                )}

                {/* Net Change in Cash */}
                <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">NET INCREASE (DECREASE) IN CASH</span>
                    <span className={`text-sm font-bold ${reportData.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.net_cash_flow >= 0 ? '' : '('}
                      {number_format(Math.abs(reportData.net_cash_flow))}
                      {reportData.net_cash_flow >= 0 ? '' : ')'}
                    </span>
                  </div>
                </div>

                {/* Opening and Closing Cash Balances */}
                {(reportData.opening_balance !== undefined || reportData.closing_balance !== undefined) && (
                  <div className="px-4 py-3 bg-gray-50">
                    {reportData.opening_balance !== undefined && (
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-xs font-medium text-gray-700">Cash and Cash Equivalents at Beginning of Period</span>
                        <span className="text-xs font-medium text-gray-900">
                          {number_format(reportData.opening_balance)}
                        </span>
                      </div>
                    )}
                    {reportData.closing_balance !== undefined && (
                      <>
                        <div className="border-t border-gray-300 my-2"></div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-sm font-bold text-gray-900">Cash and Cash Equivalents at End of Period</span>
                          <span className="text-sm font-bold text-gray-900">
                            {number_format(reportData.closing_balance)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Supplementary Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xs font-bold text-gray-900">SUPPLEMENTARY INFORMATION</h3>
              </div>
              <div className="px-4 py-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-[10px] font-medium text-blue-700 uppercase mb-1">Operating Health</p>
                    <p className={`text-xs font-bold ${reportData.operations.total > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.operations.total > 0 ? '✓ Positive' : '⚠ Negative'}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {reportData.operations.total > 0 
                        ? 'Healthy operations generating cash' 
                        : 'Operations consuming cash'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-[10px] font-medium text-purple-700 uppercase mb-1">Investment Activity</p>
                    <p className="text-xs font-bold text-gray-900">
                      {reportData.investing.total < 0 ? '📈 Investing' : '📉 Divesting'}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {reportData.investing.total < 0 
                        ? 'Capital investments in progress' 
                        : 'Asset sales or reduced investments'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-teal-50 rounded-lg border border-teal-100">
                    <p className="text-[10px] font-medium text-teal-700 uppercase mb-1">Overall Position</p>
                    <p className={`text-xs font-bold ${reportData.net_cash_flow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.net_cash_flow > 0 ? '✓ Improving' : '⚠ Declining'}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {reportData.net_cash_flow > 0 
                        ? 'Cash position strengthening' 
                        : 'Monitor cash management'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default CashFlowReportPage;
