import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Calendar, ChevronRight } from 'lucide-react';

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

interface ComparisonData {
  current: ProfitLossData;
  previous: ProfitLossData;
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
}

interface MonthlyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPeriodLabel: string;
  onFetchComparisonData: (selectedMonths: string[]) => Promise<MultiMonthComparisonData | null>;
  onFetchDateComparisonData: (startDate: string, endDate: string) => Promise<MultiMonthComparisonData | null>;
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

interface MonthOption {
  value: string;
  label: string;
  year: number;
  month: number;
}

const MonthlyComparisonModal: React.FC<MonthlyComparisonModalProps> = ({
  isOpen,
  onClose,
  currentPeriodLabel,
  onFetchComparisonData,
  onFetchDateComparisonData
}) => {
  const [comparisonMode, setComparisonMode] = useState<'months' | 'dates'>('months');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<MultiMonthComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Generate available months for comparison (last 12 months)
  const generateMonthOptions = (): MonthOption[] => {
    const options: MonthOption[] = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      options.push({
        value: `${year}-${month.toString().padStart(2, '0')}`,
        label: `${monthName} ${year}`,
        year,
        month
      });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  const handleMonthToggle = (monthValue: string) => {
    setSelectedMonths(prev => {
      if (prev.includes(monthValue)) {
        return prev.filter(m => m !== monthValue);
      } else {
        return [...prev, monthValue];
      }
    });
  };

  const handleCompare = async () => {
    if (comparisonMode === 'months' && selectedMonths.length === 0) return;
    if (comparisonMode === 'dates' && (!startDate || !endDate)) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let data: MultiMonthComparisonData | null = null;
      
      if (comparisonMode === 'months') {
        data = await onFetchComparisonData(selectedMonths);
      } else {
        data = await onFetchDateComparisonData(startDate, endDate);
      }
      
      if (data) {
        setComparisonData(data);
        setShowComparison(true);
      } else {
        setError(`No data available for the selected ${comparisonMode === 'months' ? 'months' : 'date range'}`);
      }
    } catch (err: any) {
      console.error('Error fetching comparison data:', err);
      setError(err.message || 'Failed to fetch comparison data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowComparison(false);
    setSelectedMonths([]);
    setStartDate('');
    setEndDate('');
    setComparisonData(null);
    setError(null);
    setComparisonMode('months');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const number_format = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatChange = (change: number, isPercentage = false) => {
    const sign = change >= 0 ? '+' : '';
    const value = isPercentage ? change.toFixed(1) : number_format(Math.abs(change));
    return `${sign}${value}${isPercentage ? '%' : ''}`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  const ComparisonRow = ({ 
    label, 
    currentValue, 
    previousValue, 
    change, 
    isPercentage = false,
    isBold = false,
    isTotal = false 
  }: {
    label: string;
    currentValue: number;
    previousValue: number;
    change: number;
    isPercentage?: boolean;
    isBold?: boolean;
    isTotal?: boolean;
  }) => (
    <div className={`flex items-center py-3 ${isTotal ? 'border-t-2 border-gray-300' : 'border-b border-gray-100'}`}>
      <div className={`flex-1 ${isBold ? 'font-semibold' : ''} ${isTotal ? 'text-lg' : ''}`}>
        {label}
      </div>
      <div className="w-40 text-right">
        <div className={`${isBold ? 'font-semibold' : ''} ${isTotal ? 'text-lg' : ''}`}>
          {isPercentage ? formatPercentage(previousValue) : number_format(previousValue)}
        </div>
        <div className="text-xs text-gray-500">Previous Period</div>
      </div>
      <div className="w-40 text-right">
        <div className={`${isBold ? 'font-semibold' : ''} ${isTotal ? 'text-lg' : ''}`}>
          {isPercentage ? formatPercentage(currentValue) : number_format(currentValue)}
        </div>
        <div className="text-xs text-gray-500">{currentPeriodLabel}</div>
      </div>
      <div className="w-32 text-right">
        <div className={`flex items-center justify-end space-x-1 ${getChangeColor(change)}`}>
          {getChangeIcon(change)}
          <span className="text-sm font-medium">
            {formatChange(change, isPercentage)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-none mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Monthly Comparison</h2>
            <p className="text-gray-600 mt-1">
              {showComparison ? 'Detailed period-over-period analysis' : 'Select a month to compare with'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-6">
            {!showComparison ? (
              /* Selection Interface */
              <div className="space-y-6">
                <div className="text-center">
                  <Calendar className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Compare Financial Data</h3>
                  <p className="text-gray-600 mb-6">
                    Choose comparison mode and select periods to compare with <strong>{currentPeriodLabel}</strong>
                  </p>
                </div>

                {/* Mode Toggle */}
                <div className="max-w-2xl mx-auto">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setComparisonMode('months')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        comparisonMode === 'months'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Compare Months
                    </button>
                    <button
                      onClick={() => setComparisonMode('dates')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        comparisonMode === 'dates'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Compare Date Ranges
                    </button>
                  </div>
                </div>

                {comparisonMode === 'months' ? (
                  /* Month Selection */
                  <div className="max-w-4xl mx-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Select Months ({selectedMonths.length} selected)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {monthOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleMonthToggle(option.value)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            selectedMonths.includes(option.value)
                              ? 'border-blue-500 bg-blue-50 text-blue-900'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{option.label}</span>
                            {selectedMonths.includes(option.value) && (
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Date Selection */
                  <div className="max-w-2xl mx-auto">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {startDate && endDate && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-700">
                            <strong>Selected Period:</strong> {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span>{error}</span>
                        <button
                          onClick={() => {
                            setError(null);
                            handleMonthSelect();
                          }}
                          className="ml-2 text-red-800 hover:text-red-900 underline text-sm"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-w-2xl mx-auto">
                  <button
                    onClick={handleCompare}
                    disabled={
                      (comparisonMode === 'months' && selectedMonths.length === 0) ||
                      (comparisonMode === 'dates' && (!startDate || !endDate)) ||
                      loading
                    }
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-5 h-5 mr-2" />
                        {comparisonMode === 'months' 
                          ? `Compare with ${selectedMonths.length} Selected Month${selectedMonths.length !== 1 ? 's' : ''}`
                          : 'Compare Date Ranges'
                        }
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Comparison Results */
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="font-semibold text-green-900">Revenue Trend</h3>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {number_format(comparisonData!.current.revenue.total_revenue)}
                    </div>
                    <div className="text-sm text-green-700">
                      Current Period: {currentPeriodLabel}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-blue-900">Gross Profit Trend</h3>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {number_format(comparisonData!.current.gross_profit)}
                    </div>
                    <div className="text-sm text-blue-700">
                      Current Period: {currentPeriodLabel}
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <TrendingDown className="w-5 h-5 text-purple-600 mr-2" />
                      <h3 className="font-semibold text-purple-900">Net Profit Trend</h3>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {number_format(comparisonData!.current.net_profit)}
                    </div>
                    <div className="text-sm text-purple-700">
                      Current Period: {currentPeriodLabel}
                    </div>
                  </div>
                </div>

                {/* Detailed Comparison Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Multi-Month Financial Comparison</h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left py-3 px-6 font-semibold text-gray-700">Financial Item</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">{currentPeriodLabel}</th>
                          {comparisonData!.comparisons.map((comp) => (
                            <th key={comp.month} className="text-right py-3 px-4 font-semibold text-gray-700">
                              {comp.monthLabel}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Revenue Section */}
                        <tr className="bg-gray-50">
                          <td colSpan={comparisonData!.comparisons.length + 2} className="px-6 py-3 font-semibold text-gray-900">
                            Revenue
                          </td>
                        </tr>
                        
                        <tr className="border-b border-gray-100">
                          <td className="px-6 py-3 text-gray-600">Sales Revenue</td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">
                            {number_format(comparisonData!.current.revenue.sales_revenue)}
                          </td>
                          {comparisonData!.comparisons.map((comp) => (
                            <td key={comp.month} className="px-4 py-3 text-right">
                              {number_format(comp.data.revenue.sales_revenue)}
                            </td>
                          ))}
                        </tr>
                        
                        <tr className="border-b border-gray-100">
                          <td className="px-6 py-3 text-gray-600">Other Income</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {number_format(comparisonData!.current.revenue.other_income)}
                          </td>
                          {comparisonData!.comparisons.map((comp) => (
                            <td key={comp.month} className="px-4 py-3 text-right">
                              {number_format(comp.data.revenue.other_income)}
                            </td>
                          ))}
                        </tr>
                        
                        <tr className="border-b-2 border-gray-300">
                          <td className="px-6 py-3 font-semibold text-gray-900">Total Revenue</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {number_format(comparisonData!.current.revenue.total_revenue)}
                          </td>
                          {comparisonData!.comparisons.map((comp) => (
                            <td key={comp.month} className="px-4 py-3 text-right font-semibold">
                              {number_format(comp.data.revenue.total_revenue)}
                            </td>
                          ))}
                        </tr>

                        {/* Cost of Goods Sold */}
                        <tr className="bg-gray-50">
                          <td colSpan={comparisonData!.comparisons.length + 2} className="px-6 py-3 font-semibold text-gray-900">
                            Cost of Goods Sold
                          </td>
                        </tr>
                        
                        <tr className="border-b-2 border-gray-300">
                          <td className="px-6 py-3 text-gray-600">Cost of Goods Sold</td>
                          <td className="px-4 py-3 text-right font-medium text-blue-600">
                            {number_format(comparisonData!.current.expenses.cost_of_goods_sold)}
                          </td>
                          {comparisonData!.comparisons.map((comp) => (
                            <td key={comp.month} className="px-4 py-3 text-right">
                              {number_format(comp.data.expenses.cost_of_goods_sold)}
                            </td>
                          ))}
                        </tr>

                        {/* Gross Profit */}
                        <tr className="bg-gray-50">
                          <td colSpan={comparisonData!.comparisons.length + 2} className="px-6 py-3 font-semibold text-gray-900">
                            Gross Profit
                          </td>
                        </tr>
                        
                        <tr className="border-b border-gray-100">
                          <td className="px-6 py-3 font-semibold text-gray-900">Gross Profit</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {number_format(comparisonData!.current.gross_profit)}
                          </td>
                          {comparisonData!.comparisons.map((comp) => (
                            <td key={comp.month} className="px-4 py-3 text-right font-semibold">
                              {number_format(comp.data.gross_profit)}
                            </td>
                          ))}
                        </tr>
                        
                        <tr className="border-b-2 border-gray-300">
                          <td className="px-6 py-3 text-gray-600">Gross Margin</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatPercentage(comparisonData!.current.gross_margin)}
                          </td>
                          {comparisonData!.comparisons.map((comp) => (
                            <td key={comp.month} className="px-4 py-3 text-right">
                              {formatPercentage(comp.data.gross_margin)}
                            </td>
                          ))}
                        </tr>

                        {/* Operating Expenses */}
                        <tr className="bg-gray-50">
                          <td colSpan={comparisonData!.comparisons.length + 2} className="px-6 py-3 font-semibold text-gray-900">
                            Operating Expenses
                          </td>
                        </tr>
                        
                        {comparisonData!.current.expenses.operating_expenses_breakdown.map((expense) => (
                          <tr key={expense.account_code} className="border-b border-gray-100">
                            <td className="px-6 py-3 text-gray-600">{expense.account_name} ({expense.account_code})</td>
                            <td className="px-4 py-3 text-right font-medium">
                              {number_format(expense.balance)}
                            </td>
                            {comparisonData!.comparisons.map((comp) => {
                              const compExpense = comp.data.expenses.operating_expenses_breakdown.find(
                                e => e.account_code === expense.account_code
                              );
                              return (
                                <td key={comp.month} className="px-4 py-3 text-right">
                                  {compExpense ? number_format(compExpense.balance) : '0.00'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        
                        <tr className="border-b-2 border-gray-300">
                          <td className="px-6 py-3 font-semibold text-gray-900">Total Operating Expenses</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {number_format(comparisonData!.current.expenses.total_operating_expenses)}
                          </td>
                          {comparisonData!.comparisons.map((comp) => (
                            <td key={comp.month} className="px-4 py-3 text-right font-semibold">
                              {number_format(comp.data.expenses.total_operating_expenses)}
                            </td>
                          ))}
                        </tr>

                        {/* Net Profit */}
                        <tr className="bg-gray-50">
                          <td colSpan={comparisonData!.comparisons.length + 2} className="px-6 py-3 font-semibold text-gray-900">
                            Net Profit
                          </td>
                        </tr>
                        
                        <tr className="border-b border-gray-100">
                          <td className="px-6 py-3 font-bold text-lg text-gray-900">Net Profit</td>
                          <td className="px-4 py-3 text-right font-bold text-lg text-gray-900">
                            {number_format(comparisonData!.current.net_profit)}
                          </td>
                          {comparisonData!.comparisons.map((comp) => (
                            <td key={comp.month} className="px-4 py-3 text-right font-bold text-lg">
                              {number_format(comp.data.net_profit)}
                            </td>
                          ))}
                        </tr>
                        
                        <tr className="border-b-2 border-gray-300">
                          <td className="px-6 py-3 text-gray-600">Net Margin</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatPercentage(comparisonData!.current.net_margin)}
                          </td>
                          {comparisonData!.comparisons.map((comp) => (
                            <td key={comp.month} className="px-4 py-3 text-right">
                              {formatPercentage(comp.data.net_margin)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
          {showComparison && (
            <button
              onClick={() => setShowComparison(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back to Month Selection
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyComparisonModal;