import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Download,
  Filter
} from 'lucide-react';
import COGSDetailsModal from '../components/COGSDetailsModal';
import SalesRevenueDetailsModal from '../components/SalesRevenueDetailsModal';
import GrossMarginDetailsModal from '../components/GrossMarginDetailsModal';
import MonthlyComparisonModal from '../components/MonthlyComparisonModal';

interface ProfitLossData {
  period: string;
  revenue: {
    sales_revenue: number;
    other_income: number;
    total_revenue: number;
  };
  expenses: {
    cost_of_goods_sold: number;
    operating_expenses_breakdown: {
      account_code: string;
      account_name: string;
      balance: number;
    }[];
    total_operating_expenses: number;
    total_expenses: number;
  };
  net_profit: number;
  gross_profit: number;
  gross_margin: number;
  net_margin: number;
}

interface MultiMonthComparisonData {
  current: ProfitLossData;
  comparisons: {
    month: string;
    monthLabel: string;
    data: ProfitLossData;
    changes: {
      revenue: {
        sales_revenue: number;
        other_income: number;
        total_revenue: number;
      };
      expenses: {
        cost_of_goods_sold: number;
        total_operating_expenses: number;
        total_expenses: number;
      };
      net_profit: number;
      gross_profit: number;
      gross_margin: number;
      net_margin: number;
    };
    percentage_changes: {
      revenue: {
        sales_revenue: number;
        other_income: number;
        total_revenue: number;
      };
      expenses: {
        cost_of_goods_sold: number;
        total_operating_expenses: number;
        total_expenses: number;
      };
      net_profit: number;
      gross_profit: number;
      gross_margin: number;
      net_margin: number;
    };
  }[];
}



const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ProfitLossReportPage: React.FC = () => {
  const [reportData, setReportData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('current_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [enableComparison, setEnableComparison] = useState(false);

  const [showCOGSModal, setShowCOGSModal] = useState(false);
  const [showSalesRevenueModal, setShowSalesRevenueModal] = useState(false);
  const [showGrossMarginModal, setShowGrossMarginModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  useEffect(() => {
    fetchProfitLossReport();
  }, [period, customStartDate, customEndDate]);

  useEffect(() => {
    if (reportData) {
      console.log('Report Data Updated:', reportData);
      console.log('Net Profit Value:', reportData.net_profit, 'Type:', typeof reportData.net_profit);
    }
  }, [reportData]);


  const fetchProfitLossReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (period === 'custom' && customStartDate && customEndDate) {
        params.append('start_date', customStartDate);
        params.append('end_date', customEndDate);
      } else {
        params.append('period', period);
      }

      const res = await axios.get(`${API_BASE_URL}/financial/reports/profit-loss?${params}`);
      if (res.data.success) {
        console.log('Profit & Loss API Response:', res.data.data);
        setReportData(res.data.data);
      } else {
        setError(res.data.error || 'Failed to fetch profit and loss report');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profit and loss report');
    } finally {
      setLoading(false);
    }
  };

  const fetchDateComparisonData = async (startDate: string, endDate: string): Promise<MultiMonthComparisonData | null> => {
    try {
      const currentData = reportData;
      if (!currentData) {
        throw new Error('Current period data not available');
      }

      console.log('Fetching date comparison data for:', startDate, 'to', endDate);

      // Fetch data for the selected date range
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      
      console.log(`Fetching data for date range: ${startDate} to ${endDate}`);
      
      const res = await axios.get(`${API_BASE_URL}/financial/reports/profit-loss?${params}`);
      console.log(`Response for date range:`, res.data);
      
      if (!res.data.success) {
        throw new Error(`Failed to fetch data for date range ${startDate} to ${endDate}`);
      }

      const comparisonData = res.data.data;

      // Calculate comparison data
      const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / Math.abs(previous)) * 100;
      };

      const formatDateRangeLabel = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
      };

      const multiMonthComparisonData: MultiMonthComparisonData = {
        current: currentData,
        comparisons: [{
          month: `${startDate}_to_${endDate}`,
          monthLabel: formatDateRangeLabel(startDate, endDate),
          data: comparisonData,
          changes: {
            revenue: {
              sales_revenue: currentData.revenue.sales_revenue - comparisonData.revenue.sales_revenue,
              other_income: currentData.revenue.other_income - comparisonData.revenue.other_income,
              total_revenue: currentData.revenue.total_revenue - comparisonData.revenue.total_revenue,
            },
            expenses: {
              cost_of_goods_sold: currentData.expenses.cost_of_goods_sold - comparisonData.expenses.cost_of_goods_sold,
              total_operating_expenses: currentData.expenses.total_operating_expenses - comparisonData.expenses.total_operating_expenses,
              total_expenses: currentData.expenses.total_expenses - comparisonData.expenses.total_expenses,
            },
            net_profit: currentData.net_profit - comparisonData.net_profit,
            gross_profit: currentData.gross_profit - comparisonData.gross_profit,
            gross_margin: currentData.gross_margin - comparisonData.gross_margin,
            net_margin: currentData.net_margin - comparisonData.net_margin,
          },
          percentage_changes: {
            revenue: {
              sales_revenue: calculatePercentageChange(currentData.revenue.sales_revenue, comparisonData.revenue.sales_revenue),
              other_income: calculatePercentageChange(currentData.revenue.other_income, comparisonData.revenue.other_income),
              total_revenue: calculatePercentageChange(currentData.revenue.total_revenue, comparisonData.revenue.total_revenue),
            },
            expenses: {
              cost_of_goods_sold: calculatePercentageChange(currentData.expenses.cost_of_goods_sold, comparisonData.expenses.cost_of_goods_sold),
              total_operating_expenses: calculatePercentageChange(currentData.expenses.total_operating_expenses, comparisonData.expenses.total_operating_expenses),
              total_expenses: calculatePercentageChange(currentData.expenses.total_expenses, comparisonData.expenses.total_expenses),
            },
            net_profit: calculatePercentageChange(currentData.net_profit, comparisonData.net_profit),
            gross_profit: calculatePercentageChange(currentData.gross_profit, comparisonData.gross_profit),
            gross_margin: calculatePercentageChange(currentData.gross_margin, comparisonData.gross_margin),
            net_margin: calculatePercentageChange(currentData.net_margin, comparisonData.net_margin),
          }
        }]
      };

      return multiMonthComparisonData;

    } catch (err: any) {
      console.error('Error fetching date comparison data:', err);
      throw new Error(`Failed to fetch date comparison data: ${err.message}`);
    }
  };

  const fetchComparisonData = async (selectedMonths: string[]): Promise<MultiMonthComparisonData | null> => {
    try {
      const currentData = reportData;
      if (!currentData) {
        throw new Error('Current period data not available');
      }

      console.log('Fetching comparison data for months:', selectedMonths);

      // Fetch data for all selected months
      const monthDataPromises = selectedMonths.map(async (month) => {
        // Convert YYYY-MM format to start_date and end_date
        const [year, monthNum] = month.split('-');
        const startDate = `${year}-${monthNum}-01`;
        const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]; // Last day of month
        
        const params = new URLSearchParams();
        params.append('start_date', startDate);
        params.append('end_date', endDate);
        
        console.log(`Fetching data for month: ${month} with dates: ${startDate} to ${endDate}`);
        
        const res = await axios.get(`${API_BASE_URL}/financial/reports/profit-loss?${params}`);
        console.log(`Response for ${month}:`, res.data);
        
        if (!res.data.success) {
          throw new Error(`Failed to fetch data for ${month}`);
        }
        
        return {
          month,
          data: res.data.data
        };
      });

      const monthDataResults = await Promise.all(monthDataPromises);

      // Calculate comparison data for each month
      const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / Math.abs(previous)) * 100;
      };

      const formatMonthLabel = (monthValue: string) => {
        const [year, month] = monthValue.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
      };

      const comparisons = monthDataResults.map(({ month, data }) => ({
        month,
        monthLabel: formatMonthLabel(month),
        data,
        changes: {
          revenue: {
            sales_revenue: currentData.revenue.sales_revenue - data.revenue.sales_revenue,
            other_income: currentData.revenue.other_income - data.revenue.other_income,
            total_revenue: currentData.revenue.total_revenue - data.revenue.total_revenue,
          },
          expenses: {
            cost_of_goods_sold: currentData.expenses.cost_of_goods_sold - data.expenses.cost_of_goods_sold,
            total_operating_expenses: currentData.expenses.total_operating_expenses - data.expenses.total_operating_expenses,
            total_expenses: currentData.expenses.total_expenses - data.expenses.total_expenses,
          },
          net_profit: currentData.net_profit - data.net_profit,
          gross_profit: currentData.gross_profit - data.gross_profit,
          gross_margin: currentData.gross_margin - data.gross_margin,
          net_margin: currentData.net_margin - data.net_margin,
        },
        percentage_changes: {
          revenue: {
            sales_revenue: calculatePercentageChange(currentData.revenue.sales_revenue, data.revenue.sales_revenue),
            other_income: calculatePercentageChange(currentData.revenue.other_income, data.revenue.other_income),
            total_revenue: calculatePercentageChange(currentData.revenue.total_revenue, data.revenue.total_revenue),
          },
          expenses: {
            cost_of_goods_sold: calculatePercentageChange(currentData.expenses.cost_of_goods_sold, data.expenses.cost_of_goods_sold),
            total_operating_expenses: calculatePercentageChange(currentData.expenses.total_operating_expenses, data.expenses.total_operating_expenses),
            total_expenses: calculatePercentageChange(currentData.expenses.total_expenses, data.expenses.total_expenses),
          },
          net_profit: calculatePercentageChange(currentData.net_profit, data.net_profit),
          gross_profit: calculatePercentageChange(currentData.gross_profit, data.gross_profit),
          gross_margin: calculatePercentageChange(currentData.gross_margin, data.gross_margin),
          net_margin: calculatePercentageChange(currentData.net_margin, data.net_margin),
        }
      }));

      const multiMonthComparisonData: MultiMonthComparisonData = {
        current: currentData,
        comparisons
      };

      return multiMonthComparisonData;

    } catch (err: any) {
      console.error('Error fetching comparison data:', err);
      throw new Error(`Failed to fetch comparison data: ${err.message}`);
    }
  };

  const number_format = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };




  const getPeriodLabel = () => {
    switch (period) {
      case 'current_month':
        return 'Current Month';
      case 'last_month':
        return 'Last Month';
      case 'current_quarter':
        return 'Current Quarter';
      case 'current_year':
        return 'Current Year';
      case 'custom':
        return `Custom Period (${customStartDate} to ${customEndDate})`;
      default:
        return 'Current Month';
    }
  };


  const exportToCSV = () => {
    if (!reportData) return;

    // Helper function to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Helper function to format numbers for CSV (no commas, just decimals)
    const formatNumberForCSV = (amount: number): string => {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return '0.00';
      }
      return amount.toFixed(2);
    };

    const rows: string[][] = [
      ['Profit and Loss Report', getPeriodLabel()],
      [''],
      ['Revenue'],
      ['Sales Revenue', formatNumberForCSV(reportData.revenue.sales_revenue)],
      ['Other Income', formatNumberForCSV(reportData.revenue.other_income)],
      ['Total Revenue', formatNumberForCSV(reportData.revenue.total_revenue)],
      [''],
      ['Cost of Goods Sold', formatNumberForCSV(reportData.expenses.cost_of_goods_sold)],
      ['Gross Profit', formatNumberForCSV(reportData.gross_profit)],
      ['Gross Margin', formatPercentage(reportData.gross_margin)],
      [''],
      ['Operating Expenses'],
    ];

    // Add operating expenses breakdown with account codes (as shown on page)
    if (reportData.expenses.operating_expenses_breakdown && reportData.expenses.operating_expenses_breakdown.length > 0) {
      reportData.expenses.operating_expenses_breakdown.forEach(exp => {
        rows.push([`${exp.account_name} (${exp.account_code})`, formatNumberForCSV(exp.balance)]);
      });
    }

    rows.push(
      ['Total Operating Expenses', formatNumberForCSV(reportData.expenses.total_operating_expenses)],
      [''],
      ['Total Expenses', formatNumberForCSV(reportData.expenses.total_expenses)],
      [''],
      ['Net Profit', formatNumberForCSV(reportData.net_profit)],
      ['Net Margin', formatPercentage(reportData.net_margin)]
    );

    // Convert to CSV format with proper escaping
    const csvContent = rows
      .map(row => row.map(escapeCSV).join(','))
      .join('\n');

    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-report-${getPeriodLabel().toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              <h1 className="text-lg font-bold text-gray-900">Profit & Loss Report</h1>
              <p className="text-xs text-gray-600 mt-0.5">
                Financial performance analysis
                {enableComparison && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                    <TrendingUp className="w-2.5 h-2.5 mr-1" />
                    Comparison Mode
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowComparisonModal(true)}
                className="bg-blue-600 text-white px-3 py-1.5 text-xs rounded-lg hover:bg-blue-700 flex items-center"
              >
                <TrendingUp className="w-3 h-3 mr-1.5" />
                Compare with Previous Month
              </button>
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-3 py-1.5 text-xs rounded-lg hover:bg-green-700 flex items-center"
              >
                <Download className="w-3 h-3 mr-1.5" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center space-x-3 flex-wrap">
            <Filter className="w-3 h-3 text-gray-500" />
            <label className="text-xs font-medium text-gray-700">Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="current_year">Current Year</option>
              <option value="custom">Custom Period</option>
            </select>

            {period === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex items-center space-x-2 ml-3">
              <input
                type="checkbox"
                id="enableComparison"
                checked={enableComparison}
                onChange={(e) => setEnableComparison(e.target.checked)}
                className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableComparison" className="text-xs font-medium text-gray-700">
                Compare with Previous Period
              </label>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-xs rounded mb-4">
            {error}
          </div>
        ) : reportData ? (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg shadow p-3">
                <div className="flex items-center">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Total Revenue</p>
                    <p className="text-base font-bold text-gray-900">
                      {number_format(reportData.revenue.total_revenue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-3">
                <div className="flex items-center">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Gross Profit</p>
                    <p className="text-base font-bold text-gray-900">
                      {number_format(reportData.gross_profit)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-3">
                <div className="flex items-center">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Total Expenses</p>
                    <p className="text-base font-bold text-gray-900">
                      {number_format(reportData.expenses.total_expenses)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-3">
                <div className="flex items-center">
                  <div className={`p-1.5 rounded-lg ${reportData.net_profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <DollarSign className={`w-4 h-4 ${reportData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Net Profit</p>
                    <p className={`text-base font-bold ${reportData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {number_format(reportData.net_profit)}
                    </p>
                  </div>
                </div>
              </div>
            </div>


            {/* Detailed Report */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Profit & Loss Statement - {getPeriodLabel()}</h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {/* Revenue Section */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 mb-2">Revenue</h4>
                    <div className="space-y-2">
                      <div 
                        className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-1.5 rounded-md transition-colors"
                        onClick={() => setShowSalesRevenueModal(true)}
                        title="Click to view detailed breakdown"
                      >
                        <span className="text-xs text-gray-600">Sales Revenue</span>
                        <span className="text-xs font-medium text-green-600 hover:text-green-800">{number_format(reportData.revenue.sales_revenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Other Income</span>
                        <span className="text-xs font-medium">{number_format(reportData.revenue.other_income)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-xs font-semibold text-gray-900">Total Revenue</span>
                        <span className="text-xs font-bold text-gray-900">{number_format(reportData.revenue.total_revenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost of Goods Sold */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 mb-2">Cost of Goods Sold</h4>
                    <div 
                      className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-1.5 rounded-md transition-colors"
                      onClick={() => setShowCOGSModal(true)}
                      title="Click to view detailed breakdown"
                    >
                      <span className="text-xs text-gray-600">Cost of Goods Sold</span>
                      <span className="text-xs font-medium text-blue-600 hover:text-blue-800">{number_format(reportData.expenses.cost_of_goods_sold)}</span>
                    </div>
                  </div>

                  {/* Gross Profit */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-900">Gross Profit</span>
                      <span className="text-xs font-bold text-gray-900">{number_format(reportData.gross_profit)}</span>
                    </div>
                    <div 
                      className="flex justify-between items-center mt-1 cursor-pointer hover:bg-gray-50 p-1.5 rounded-md transition-colors"
                      onClick={() => setShowGrossMarginModal(true)}
                      title="Click to view detailed breakdown"
                    >
                      <span className="text-[10px] text-gray-500">Gross Margin</span>
                      <span className="text-[10px] font-medium text-gray-500 hover:text-gray-700">{formatPercentage(reportData.gross_margin)}</span>
                    </div>
                  </div>

                  {/* Operating Expenses */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 mb-2">Operating Expenses</h4>
                    <div className="space-y-2">
                      {reportData.expenses.operating_expenses_breakdown && reportData.expenses.operating_expenses_breakdown.length > 0 ? (
                        reportData.expenses.operating_expenses_breakdown.map((exp) => (
                          <div key={exp.account_code} className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">{exp.account_name} ({exp.account_code})</span>
                            <span className="text-xs font-medium">{number_format(exp.balance)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500">No operating expenses found.</div>
                      )}
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-xs font-semibold text-gray-900">Total Operating Expenses</span>
                        <span className="text-xs font-bold text-gray-900">{number_format(reportData.expenses.total_operating_expenses)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-900">Net Profit</span>
                      <span className={`text-xs font-bold ${reportData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {number_format(reportData.net_profit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-gray-500">Net Margin</span>
                      <span className={`text-[10px] font-medium ${reportData.net_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(reportData.net_margin)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* COGS Details Modal */}
      <COGSDetailsModal
        isOpen={showCOGSModal}
        onClose={() => setShowCOGSModal(false)}
        period={period}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
      />

      {/* Sales Revenue Details Modal */}
      <SalesRevenueDetailsModal
        isOpen={showSalesRevenueModal}
        onClose={() => setShowSalesRevenueModal(false)}
        period={period}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
      />

      <GrossMarginDetailsModal
        isOpen={showGrossMarginModal}
        onClose={() => setShowGrossMarginModal(false)}
        period={period}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
      />

        <MonthlyComparisonModal
          isOpen={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
          currentPeriodLabel={getPeriodLabel()}
          onFetchComparisonData={fetchComparisonData}
          onFetchDateComparisonData={fetchDateComparisonData}
        />
    </div>
  );
};

export default ProfitLossReportPage; 