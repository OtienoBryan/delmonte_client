import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, DollarSign, FileText, Plus, Search, Filter } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Asset {
  id: number;
  name: string;
  purchase_date: string;
  purchase_value: number;
  description?: string;
  account_code?: string;
  account_name?: string;
}

interface DepreciationAccount {
  id: number;
  account_code: string;
  account_name: string;
}

interface DepreciationEntry {
  id: number;
  asset_id: number;
  asset_name: string;
  amount: number;
  date: string;
  description: string;
  depreciation_account_name: string;
  created_at: string;
}

const DepreciationManagementPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [depreciationAccounts, setDepreciationAccounts] = useState<DepreciationAccount[]>([]);
  const [depreciationHistory, setDepreciationHistory] = useState<DepreciationEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsset, setFilterAsset] = useState('');

  // Form state
  const [form, setForm] = useState({
    asset_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    depreciation_account_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetchingData(true);
    try {
      await Promise.all([
        fetchAssets(),
        fetchDepreciationAccounts(),
        fetchDepreciationHistory()
      ]);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setFetchingData(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/assets`);
      if (res.data.success) {
        setAssets(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load assets:', err);
    }
  };

  const fetchDepreciationAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/depreciation-accounts`);
      if (res.data.success) {
        setDepreciationAccounts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load depreciation accounts:', err);
    }
  };

  const fetchDepreciationHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/depreciation-history`);
      if (res.data.success) {
        setDepreciationHistory(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load depreciation history:', err);
      // If endpoint doesn't exist, we'll handle it gracefully
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...form,
        asset_id: Number(form.asset_id),
        amount: Number(form.amount),
        depreciation_account_id: Number(form.depreciation_account_id),
      };

      await axios.post(`${API_BASE_URL}/financial/depreciation`, payload);
      setSuccess('Depreciation recorded successfully!');
      setForm({
        asset_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        depreciation_account_id: '',
      });
      setShowForm(false);
      fetchDepreciationHistory(); // Refresh history
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record depreciation');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
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

  const filteredHistory = depreciationHistory.filter(entry => {
    const matchesSearch = entry.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAsset = !filterAsset || entry.asset_id.toString() === filterAsset;
    return matchesSearch && matchesAsset;
  });

  if (fetchingData) {
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
              <h1 className="text-3xl font-bold text-gray-900">Depreciation Management</h1>
              <p className="text-gray-600 mt-1">Record and manage asset depreciation</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Depreciation
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Record Depreciation Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Record New Depreciation</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Asset</label>
                  <select
                    name="asset_id"
                    value={form.asset_id}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="">Select asset</option>
                    {assets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} - {formatCurrency(asset.purchase_value)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Depreciation Account</label>
                  <select
                    name="depreciation_account_id"
                    value={form.depreciation_account_id}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="">Select depreciation account</option>
                    {depreciationAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_code} - {acc.account_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Depreciation Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Depreciation Date</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                  placeholder="Enter description for this depreciation entry..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Recording...' : 'Record Depreciation'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by asset name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <select
                value={filterAsset}
                onChange={(e) => setFilterAsset(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Assets</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id.toString()}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Depreciation History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Depreciation History</h3>
          </div>
          <div className="overflow-x-auto">
            {filteredHistory.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.asset_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.depreciation_account_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {entry.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No depreciation entries</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by recording your first depreciation entry.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Record Depreciation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepreciationManagementPage; 