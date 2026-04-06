import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface CashAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: number;
  balance: number;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface LedgerEntry {
  id: number;
  journal_entry_id: number;
  entry_date: string;
  reference: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
  entry_number: string;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CashAccountDetailsPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [account, setAccount] = useState<CashAccount | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [search, setSearch] = useState('');

  // Get account info from navigation state or fetch it
  useEffect(() => {
    const stateAccount = location.state?.account;
    if (stateAccount) {
      setAccount(stateAccount);
    } else {
      fetchAccountInfo();
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      fetchAccountLedger();
    }
  }, [accountId, startDate, endDate]);

  useEffect(() => {
    filterEntries();
  }, [entries, startDate, endDate, search]);

  const fetchAccountInfo = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/cash-equivalents/accounts`);
      if (res.data.success) {
        const foundAccount = res.data.data.find((acc: CashAccount) => acc.id === parseInt(accountId!));
        if (foundAccount) {
          setAccount(foundAccount);
        } else {
          setError('Account not found');
        }
      }
    } catch (err: any) {
      setError('Failed to fetch account information');
    }
  };

  const fetchAccountLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const res = await axios.get(`${API_BASE_URL}/financial/cash-equivalents/accounts/${accountId}/ledger?${params}`);
      if (res.data.success) {
        setEntries(res.data.data);
      } else {
        setError(res.data.error || 'Failed to fetch account ledger');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch account ledger');
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = entries;

    if (startDate) {
      filtered = filtered.filter(entry => entry.entry_date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(entry => entry.entry_date <= endDate);
    }

    if (search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(entry =>
        (entry.description && entry.description.toLowerCase().includes(q)) ||
        (entry.reference && entry.reference.toLowerCase().includes(q)) ||
        (entry.entry_number && entry.entry_number.toLowerCase().includes(q))
      );
    }

    setFilteredEntries(filtered);
  };

  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (balance < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const calculateSummary = () => {
    const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
    const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
    const netChange = totalDebits - totalCredits;
    const startingBalance = filteredEntries.length > 0 ? filteredEntries[0].running_balance - netChange : 0;
    const endingBalance = filteredEntries.length > 0 ? filteredEntries[filteredEntries.length - 1].running_balance : 0;

    return {
      totalDebits,
      totalCredits,
      netChange,
      startingBalance,
      endingBalance,
      transactionCount: filteredEntries.length
    };
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented');
  };

  const handleRefresh = () => {
    fetchAccountLedger();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/cash-equivalents')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Cash Accounts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/cash-equivalents')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Account Details</h1>
                <p className="text-gray-600 mt-1">
                  {account?.account_code} - {account?.account_name}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button 
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Account Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Account Code</p>
              <p className="text-lg font-semibold text-gray-900">{account?.account_code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Account Name</p>
              <p className="text-lg font-semibold text-gray-900">{account?.account_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Current Balance</p>
              <p className={`text-lg font-semibold ${getBalanceColor(account?.balance || 0)}`}>
                {formatCurrency(account?.balance || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                account?.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {account?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Date Range Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Date Range:</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Start Date"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="End Date"
                  />
                </div>
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search description, reference, entry number..."
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Debits</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalDebits)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalCredits)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Change</p>
                <p className={`text-2xl font-bold ${getBalanceColor(summary.netChange)}`}>
                  {formatCurrency(summary.netChange)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.transactionCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Transaction History ({filteredEntries.length} entries)
            </h3>
            {(startDate || endDate) && (
              <p className="text-sm text-gray-600 mt-1">
                Filtered from {startDate || 'beginning'} to {endDate || 'end'}
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Running Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(entry.entry_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div>
                          <p className="font-medium">{entry.entry_number}</p>
                          <p className="text-xs text-gray-500">{entry.reference}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="max-w-xs truncate" title={entry.description}>
                          {entry.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {entry.debit_amount > 0 ? (
                          <span className="text-green-600 font-medium">
                            {formatCurrency(entry.debit_amount)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {entry.credit_amount > 0 ? (
                          <span className="text-red-600 font-medium">
                            {formatCurrency(entry.credit_amount)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {getBalanceIcon(entry.running_balance)}
                          <span className={`font-medium ${getBalanceColor(entry.running_balance)}`}>
                            {formatCurrency(entry.running_balance)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No transactions found for the selected date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashAccountDetailsPage; 