import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  FileText,
  Calculator,
  Eye,
  Download,
  Calendar,
  PieChart,
  LineChart,
  AlertCircle,
  Receipt,
  BookOpen,
  FileText as TaxIcon
} from 'lucide-react';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  route: string;
  features: string[];
  lastUpdated?: string;
}

const FinancialReportsIndexPage: React.FC = () => {
  const reports: ReportCard[] = [
    {
      id: 'profit-loss',
      title: 'Profit & Loss Statement',
      description: 'Comprehensive income statement showing revenue, expenses, and profitability over a specified period.',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-blue-500',
      route: '/dashboard/reports/profit-loss',
      features: [
        'Revenue breakdown by source',
        'Expense categorization',
        'Gross and net profit margins',
        'Period-over-period comparison',
        'Depreciation expense tracking'
      ],
      lastUpdated: '2024-01-15'
    },
    {
      id: 'balance-sheet',
      title: 'Balance Sheet',
      description: 'Complete financial position statement showing assets, liabilities, and equity as of a specific date.',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'bg-green-500',
      route: '/dashboard/reports/balance-sheet',
      features: [
        'Current and non-current asset categorization',
        'Liability classification',
        'Equity breakdown',
        'Financial ratios and analysis',
        'Comparative period data',
        'Notes and disclosures',
        'Drill-down capabilities'
      ],
      lastUpdated: '2024-01-15'
    },
    {
      id: 'cash-flow',
      title: 'Cash Flow Statement',
      description: 'Detailed cash flow analysis showing operating, investing, and financing activities.',
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-purple-500',
      route: '/dashboard/reports/cash-flow',
      features: [
        'Operating cash flow analysis',
        'Investing activity tracking',
        'Financing cash flows',
        'Net cash flow calculation',
        'Cash flow metrics and ratios',
        'Period selection options'
      ],
      lastUpdated: '2024-01-15'
    },
    {
      id: 'journal-entries',
      title: 'Journal Entries',
      description: 'View and search all accounting journal entries with filters for date, account, reference, and description.',
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-yellow-500',
      route: '/journal-entries',
      features: [
        'Full journal entry listing',
        'Date range and account filters',
        'Reference and description search',
        'Debit and credit breakdown',
        'Export and audit support'
      ],
      lastUpdated: '2024-07-01'
    },
    {
      id: 'general-ledger',
      title: 'General Ledger',
      description: 'Detailed listing of all account transactions with running balances for full auditability.',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'bg-indigo-500',
      route: '/dashboard/reports/general-ledger',
      features: [
        'All account transactions',
        'Running balance calculation',
        'Date, account, and reference details',
        'Full audit trail',
        'Export support'
      ],
      lastUpdated: '2024-07-01'
    },
    {
      id: 'chart-of-accounts',
      title: 'Chart of Accounts',
      description: 'Complete listing of all accounts with codes, names, types, and descriptions organized by category.',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'bg-cyan-500',
      route: '/dashboard/reports/chart-of-accounts',
      features: [
        'All accounts with codes',
        'Account types and categories',
        'Active/inactive status',
        'Quick ledger access',
        'Search and filter',
        'Export to CSV'
      ],
      lastUpdated: '2024-10-26'
    },
    {
      id: 'sales-tax',
      title: 'Sales Tax Report',
      description: 'Detailed report of all sales tax transactions from journal entries for Sales Tax Payable account.',
      icon: <TaxIcon className="w-5 h-5" />,
      color: 'bg-red-500',
      route: '/dashboard/reports/sales-tax',
      features: [
        'Sales tax payable transactions',
        'Date range filtering',
        'Debit and credit breakdown',
        'Net tax payable calculation',
        'Entry search and filtering',
        'Export capabilities'
      ],
      lastUpdated: '2024-01-15'
    },
    {
      id: 'trial-balance',
      title: 'Trial Balance',
      description: 'Comprehensive trial balance report showing all account balances with debits and credits.',
      icon: <Calculator className="w-5 h-5" />,
      color: 'bg-teal-500',
      route: '/dashboard/reports/trial-balance',
      features: [
        'All account balances',
        'Debit and credit totals',
        'Date range selection',
        'Account hierarchy view',
        'Balance verification',
        'Export to Excel/PDF'
      ],
      lastUpdated: '2024-01-15'
    },
    // {
    //   id: 'sales-report',
    //   title: 'Sales Report',
    //   description: 'Detailed report of all sales orders, including totals, status, and outstanding balances.',
    //   icon: <BarChart3 className="w-8 h-8" />, // reuse icon for now
    //   color: 'bg-orange-500',
    //   route: '/reports/sales-report',
    //   features: [
    //     'Sales order listing',
    //     'Date and status filters',
    //     'Summary totals',
    //     'Outstanding balances',
    //     'CSV export',
    //   ],
    //   lastUpdated: '2024-06-10'
    // },
            {
          id: 'collection-report',
          title: 'Collection Report',
          description: 'Comprehensive report of all confirmed payments received, with filtering and analysis capabilities.',
          icon: <DollarSign className="w-5 h-5" />,
          color: 'bg-green-500',
          route: '/dashboard/reports/collection-report',
          features: [
            'All confirmed payments',
            'Date range filtering',
            'Payment method breakdown',
            'Client-wise collections',
            'CSV export',
            'Summary statistics'
          ],
          lastUpdated: '2024-01-15'
        },
        // {
        //   id: 'unconfirmed-payments',
        //   title: 'Unconfirmed Payments',
        //   description: 'Track all payments pending confirmation with detailed filtering and analysis.',
        //   icon: <AlertCircle className="w-8 h-8" />,
        //   color: 'bg-orange-500',
        //   route: '/reports/unconfirmed-payments',
        //   features: [
        //     'Pending payment confirmations',
        //     'Date range filtering',
        //     'Payment method breakdown',
        //     'Account-wise pending amounts',
        //     'CSV export',
        //     'Summary statistics'
        //   ],
        //   lastUpdated: '2024-01-15'
        // }
  ];

  const quickActions = [
    {
      title: 'Journal Entries',
      description: 'View and search all accounting journal entries',
      icon: <FileText className="w-6 h-6" />,
      action: () => window.location.href = '/journal-entries'
    },
    {
      title: 'Export All Reports',
      description: 'Download comprehensive financial package',
      icon: <Download className="w-6 h-6" />,
      action: () => console.log('Export all reports')
    },
    {
      title: 'Schedule Reports',
      description: 'Set up automated report generation',
      icon: <Calendar className="w-6 h-6" />,
      action: () => console.log('Schedule reports')
    },
    {
      title: 'Report Analytics',
      description: 'View report usage and trends',
      icon: <LineChart className="w-6 h-6" />,
      action: () => console.log('Report analytics')
    }
  ];

  const number_format = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-3">
            <div>
              <h1 className="text-base font-bold text-gray-600">Moonsun Trade International</h1>
              <h2 className="text-base font-bold text-gray-600">Financial Reports</h2>
              <p className="text-xs text-gray-600 mt-0.5">Comprehensive financial reporting and analysis tools</p>
            </div>
            <div className="flex space-x-2">
               
              <Link
                to="/financial"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
        {/* Quick Actions */}
        {/* <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {action.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div> */}

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Header */}
              <div className={`${report.color} p-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <div className="text-white">
                      {React.cloneElement(report.icon as React.ReactElement, { className: 'w-4 h-4' })}
                    </div>
                    <h3 className="text-xs font-semibold text-white">{report.title}</h3>
                  </div>
                  <Link
                    to={report.route}
                    className="bg-white bg-opacity-20 text-white px-1.5 py-0.5 rounded text-[10px] font-medium hover:bg-opacity-30 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>

              {/* Content */}
              <div className="p-2">
                <p className="text-gray-600 text-[10px] mb-2 leading-tight">{report.description}</p>
                
                <div className="mb-2">
                  <h4 className="text-[10px] font-medium text-gray-900 mb-1">Key Features:</h4>
                  <ul className="space-y-0.5">
                    {report.features.map((feature, index) => (
                      <li key={index} className="text-[9px] text-gray-600 flex items-center">
                        <div className="w-0.5 h-0.5 bg-gray-400 rounded-full mr-1"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-2 py-1.5 border-t">
                <div className="flex justify-between items-center">
                  <Link
                    to={report.route}
                    className="text-[10px] font-medium text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <Eye className="w-2.5 h-2.5 mr-0.5" />
                    View Full Report
                  </Link>
                  {/* <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </button> */}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        {/* <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">About Financial Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Report Standards</h3>
              <p className="text-sm text-gray-600">
                All reports follow Generally Accepted Accounting Principles (GAAP) and provide 
                comprehensive financial analysis for informed decision-making.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Data Sources</h3>
              <p className="text-sm text-gray-600">
                Reports are generated from real-time financial data including journal entries, 
                accounts payable/receivable, inventory, and asset management systems.
              </p>
            </div>
          </div>
        </div> */}

        {/* Report Usage Tips */}
        {/* <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-blue-900 mb-3">💡 Report Usage Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <strong>Compare Periods:</strong> Use comparative dates to track financial trends over time.
            </div>
            <div>
              <strong>Drill Down:</strong> Click on account items to view detailed transaction history.
            </div>
            <div>
              <strong>Export Data:</strong> Download reports in PDF or Excel format for external analysis.
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default FinancialReportsIndexPage; 