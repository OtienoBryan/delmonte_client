import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Calendar } from 'lucide-react';

interface Receipt {
  id: number;
  receipt_number: string;
  receipt_date: string;
  client_id: number;
  client_name: string;
  account_id?: number;
  account_name?: string;
  payment_method: string;
  amount: number;
  reference: string;
  notes: string;
  status: string;
  created_at: string;
}

const CollectionReportPage: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: '',
    clientName: '',
    accountName: ''
  });
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [receipts, filters]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/financial/receipts?status=confirmed');
      const data = await response.json();
      
      if (data.success) {
        setReceipts(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch receipts');
      }
    } catch (err: any) {
      console.error('Error fetching receipts:', err);
      setError('Failed to fetch receipts');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...receipts];

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(receipt => 
        new Date(receipt.receipt_date) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(receipt => 
        new Date(receipt.receipt_date) <= new Date(filters.endDate)
      );
    }

    // Filter by payment method
    if (filters.paymentMethod) {
      filtered = filtered.filter(receipt => 
        receipt.payment_method.toLowerCase().includes(filters.paymentMethod.toLowerCase())
      );
    }

    // Filter by client name
    if (filters.clientName) {
      filtered = filtered.filter(receipt => 
        receipt.client_name.toLowerCase().includes(filters.clientName.toLowerCase())
      );
    }

    // Filter by account name
    if (filters.accountName) {
      filtered = filtered.filter(receipt => 
        receipt.account_name && receipt.account_name.toLowerCase().includes(filters.accountName.toLowerCase())
      );
    }

    setFilteredReceipts(filtered);
  };

  const calculateTotals = () => {
    const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + Number(receipt.amount), 0);
    const totalReceipts = filteredReceipts.length;
    
    // Group by payment method
    const byPaymentMethod = filteredReceipts.reduce((acc, receipt) => {
      const method = receipt.payment_method || 'Unknown';
      acc[method] = (acc[method] || 0) + Number(receipt.amount);
      return acc;
    }, {} as Record<string, number>);

    // Group by account
    const byAccount = filteredReceipts.reduce((acc, receipt) => {
      const account = receipt.account_name || `Account ${receipt.account_id || 'Unknown'}`;
      acc[account] = (acc[account] || 0) + Number(receipt.amount);
      return acc;
    }, {} as Record<string, number>);

    return { totalAmount, totalReceipts, byPaymentMethod, byAccount };
  };

  const exportToCSV = () => {
    const headers = [
      'Receipt #',
      'Date',
      'Client Name',
      'Account',
      'Payment Method',
      'Amount',
      'Reference',
      'Notes'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredReceipts.map(receipt => [
        receipt.receipt_number,
        new Date(receipt.receipt_date).toLocaleDateString(),
        receipt.client_name,
        receipt.account_name || `Account ${receipt.account_id || 'Unknown'}`,
        receipt.payment_method,
        receipt.amount,
        receipt.reference || '',
        receipt.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatKES = (amount: number) => {
    return Number(amount).toLocaleString(undefined, { 
      style: 'currency', 
      currency: 'KES' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading collection report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchReceipts}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Collection Report</h1>
              <p className="text-gray-600">All confirmed payments received</p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collections</p>
              <p className="text-2xl font-bold text-green-600">{formatKES(totals.totalAmount)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Receipts</p>
              <p className="text-2xl font-bold text-blue-600">{totals.totalReceipts}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Payment Methods</p>
              <p className="text-2xl font-bold text-purple-600">{Object.keys(totals.byPaymentMethod).length}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accounts</p>
              <p className="text-2xl font-bold text-indigo-600">{Object.keys(totals.byAccount).length}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <input
              type="text"
              placeholder="e.g., Cash, Bank"
              value={filters.paymentMethod}
              onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input
              type="text"
              placeholder="Search client name"
              value={filters.clientName}
              onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
            <select
              value={filters.accountName}
              onChange={(e) => setFilters({ ...filters, accountName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Accounts</option>
              {Array.from(new Set(receipts
                .map(receipt => receipt.account_name || `Account ${receipt.account_id || 'Unknown'}`)
                .filter(Boolean)
              )).sort().map(accountName => (
                <option key={accountName} value={accountName}>
                  {accountName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 hidden">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Collections by Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(totals.byPaymentMethod).map(([method, amount]) => (
            <div key={method} className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">{method}</p>
              <p className="text-xl font-bold text-green-600">{formatKES(amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Accounts Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 hidden">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Collections by Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(totals.byAccount).map(([account, amount]) => (
            <div key={account} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 truncate">{account}</p>
              <p className="text-lg font-bold text-indigo-600">{formatKES(amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Receipts ({filteredReceipts.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No receipts found
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {receipt.receipt_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(receipt.receipt_date)}
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       {receipt.client_name || `Client ${receipt.client_id || 'Unknown'}`}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       {receipt.account_name || `Account ${receipt.account_id || 'Unknown'}`}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                         {receipt.payment_method}
                       </span>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                      {formatKES(receipt.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.reference || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {receipt.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollectionReportPage;
