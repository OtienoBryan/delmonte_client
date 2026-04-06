import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Asset {
  id: number;
  name: string;
  purchase_date: string;
  purchase_value: number;
  description?: string;
}

interface DepreciationAccount {
  id: number;
  account_code: string;
  account_name: string;
}

const AssetDepreciationPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [depreciationAccounts, setDepreciationAccounts] = useState<DepreciationAccount[]>([]);
  const [form, setForm] = useState({
    asset_id: '',
    amount: '',
    date: '',
    description: '',
    depreciation_account_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingAssets, setFetchingAssets] = useState(false);

  useEffect(() => {
    fetchAssets();
    fetchDepreciationAccounts();
  }, []);

  const fetchAssets = async () => {
    setFetchingAssets(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/assets`);
      if (res.data.success) {
        setAssets(res.data.data);
      }
    } catch (err) {
      setError('Failed to load assets');
    } finally {
      setFetchingAssets(false);
    }
  };

  const fetchDepreciationAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/depreciation-accounts`);
      if (res.data.success) {
        setDepreciationAccounts(res.data.data);
      }
    } catch (err) {
      setError('Failed to load depreciation accounts');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = {
        ...form,
        asset_id: Number(form.asset_id),
        amount: Number(form.amount),
        depreciation_account_id: Number(form.depreciation_account_id),
      };
      await axios.post(`${API_BASE_URL}/financial/depreciation`, payload);
      setSuccess(true);
      setForm({ asset_id: '', amount: '', date: '', description: '', depreciation_account_id: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record depreciation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-8">
      <div className="bg-white shadow rounded-lg p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Record Asset Depreciation</h2>
        {success && <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">Depreciation recorded successfully!</div>}
        {error && <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Asset</label>
            <select
              name="asset_id"
              value={form.asset_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
              disabled={fetchingAssets}
            >
              <option value="">Select asset</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} (Purchased: {asset.purchase_date}, Value: {asset.purchase_value})
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
              onChange={handleChange}
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
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Depreciation Account</label>
            <select
              name="depreciation_account_id"
              value={form.depreciation_account_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select depreciation account</option>
              {depreciationAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.account_code} - {acc.account_name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Recording...' : 'Record Depreciation'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssetDepreciationPage; 