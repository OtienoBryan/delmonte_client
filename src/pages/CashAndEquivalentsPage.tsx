import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  BarChart3,
  Plus
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

interface CashSummary {
  total_balance: number;
  positive_accounts: number;
  negative_accounts: number;
  zero_balance_accounts: number;
}

interface OpeningBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: CashAccount[];
  onSubmit: (data: { account_id: number; amount: number; opening_date: string; description: string }) => void;
  loading: boolean;
}

const OpeningBalanceModal: React.FC<OpeningBalanceModalProps> = ({ 
  isOpen, 
  onClose, 
  accounts, 
  onSubmit, 
  loading 
}) => {
  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    opening_date: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.amount || !formData.opening_date) {
      return;
    }
    onSubmit({
      account_id: parseInt(formData.account_id),
      amount: parseFloat(formData.amount),
      opening_date: formData.opening_date,
      description: formData.description
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Set Opening Balance</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account *
              </label>
              <select
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opening Date *
              </label>
              <input
                type="date"
                value={formData.opening_date}
                onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Opening balance description"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Setting...' : 'Set Opening Balance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CashAndEquivalentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [allCashAccounts, setAllCashAccounts] = useState<CashAccount[]>([]);
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState('');
  const [showZeroBalance, setShowZeroBalance] = useState(false);
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [openingBalanceLoading, setOpeningBalanceLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'balances' | 'all'>('balances');

  useEffect(() => {
    fetchCashAccounts();
    fetchAllCashAccounts();
  }, [asOfDate]);

  const fetchCashAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (asOfDate) params.append('as_of_date', asOfDate);
      const res = await axios.get(`${API_BASE_URL}/financial/cash-equivalents?${params}`);
      if (res.data.success) {
        setAccounts(res.data.data.accounts);
        setSummary(res.data.data.summary);
      } else {
        setError(res.data.error || 'Failed to fetch cash accounts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cash accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCashAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/cash-equivalents/accounts`);
      if (res.data.success) {
        setAllCashAccounts(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch all cash accounts:', err);
    }
  };

  const handleViewDetails = (account: CashAccount) => {
    navigate(`/cash-account-details/${account.id}`, { 
      state: { 
        account,
        asOfDate 
      } 
    });
  };

  const handleSetOpeningBalance = async (data: { account_id: number; amount: number; opening_date: string; description: string }) => {
    setOpeningBalanceLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/financial/cash-equivalents/opening-balance`, data);
      if (res.data.success) {
        setShowOpeningBalanceModal(false);
        fetchCashAccounts(); // Refresh the data
        alert('Opening balance set successfully!');
      } else {
        alert(res.data.error || 'Failed to set opening balance');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to set opening balance');
    } finally {
      setOpeningBalanceLoading(false);
    }
  };

  const number_format = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  const filteredAccounts = showZeroBalance 
    ? accounts 
    : accounts.filter(account => Math.abs(account.balance) > 0);

  const filteredAllAccounts = showZeroBalance 
    ? allCashAccounts 
    : allCashAccounts.filter(account => {
        const accountWithBalance = accounts.find(acc => acc.id === account.id);
        return accountWithBalance && Math.abs(accountWithBalance.balance) > 0;
      });

  const handleRefresh = () => {
    fetchCashAccounts();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented');
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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cash and Equivalents</h1>
              <p className="text-gray-600 mt-1">
                Current cash and bank account balances
                {asOfDate && ` as of ${asOfDate}`}
              </p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowOpeningBalanceModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Opening Balance
              </button>
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

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-6">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">As of Date:</label>
              <input
                type="date"
                value={asOfDate}
                onChange={e => setAsOfDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showZeroBalance"
                checked={showZeroBalance}
                onChange={e => setShowZeroBalance(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showZeroBalance" className="text-sm text-gray-700">
                Show zero balance accounts
              </label>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('balances')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'balances'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Account Balances ({filteredAccounts.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Cash Accounts ({filteredAllAccounts.length})
              </button>
            </nav>
          </div>
        </div>

        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards - Only show for balances tab */}
            {activeTab === 'balances' && summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Balance</p>
                      <p className={`text-2xl font-bold ${getBalanceColor(summary.total_balance)}`}>
                        {number_format(summary.total_balance)}
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
                      <p className="text-sm font-medium text-gray-600">Positive Accounts</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary.positive_accounts}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Negative Accounts</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary.negative_accounts}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Zero Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary.zero_balance_accounts}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Accounts Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {activeTab === 'balances' 
                    ? `Cash and Bank Accounts with Balances (${filteredAccounts.length})`
                    : `All Cash and Bank Accounts (${filteredAllAccounts.length})`
                  }
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account Name
                      </th>
                      {activeTab === 'balances' && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
                        </th>
                      )}
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {activeTab === 'all' && (
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Active
                        </th>
                      )}
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeTab === 'balances' ? (
                      filteredAccounts.length > 0 ? (
                        filteredAccounts.map((account) => (
                          <tr key={account.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {account.account_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {account.account_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {getBalanceIcon(account.balance)}
                                <span className={`font-medium ${getBalanceColor(account.balance)}`}>
                                  {number_format(account.balance)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                account.balance > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : account.balance < 0 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {account.balance > 0 ? 'Positive' : account.balance < 0 ? 'Negative' : 'Zero'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleViewDetails(account)}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            No cash accounts with balances found.
                          </td>
                        </tr>
                      )
                    ) : (
                      filteredAllAccounts.length > 0 ? (
                        filteredAllAccounts.map((account) => {
                          const accountWithBalance = accounts.find(acc => acc.id === account.id);
                          const balance = accountWithBalance ? accountWithBalance.balance : 0;
                          
                          return (
                            <tr key={account.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {account.account_code}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {account.account_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  balance > 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : balance < 0 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {balance > 0 ? 'Positive' : balance < 0 ? 'Negative' : 'Zero'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  account.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {account.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                  onClick={() => handleViewDetails(account)}
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            No cash accounts found.
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Opening Balance Modal */}
      <OpeningBalanceModal
        isOpen={showOpeningBalanceModal}
        onClose={() => setShowOpeningBalanceModal(false)}
        accounts={allCashAccounts}
        onSubmit={handleSetOpeningBalance}
        loading={openingBalanceLoading}
      />
    </div>
  );
};

export default CashAndEquivalentsPage; 