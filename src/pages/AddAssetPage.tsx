import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AssetAccount {
  id: number;
  account_code: string;
  account_name: string;
}

const AddAssetPage: React.FC = () => {
  const [assetAccounts, setAssetAccounts] = useState<AssetAccount[]>([]);
  const [form, setForm] = useState({
    account_id: '',
    name: '',
    purchase_date: '',
    purchase_value: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssetAccounts();
  }, []);

  const fetchAssetAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/asset-accounts`);
      if (res.data.success) {
        setAssetAccounts(res.data.data);
      }
    } catch (err) {
      setError('Failed to load asset accounts');
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
        account_id: Number(form.account_id),
        purchase_value: Number(form.purchase_value),
      };
      await axios.post(`${API_BASE_URL}/financial/assets`, payload);
      setSuccess(true);
      setForm({ account_id: '', name: '', purchase_date: '', purchase_value: '', description: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-8">
      <div className="bg-white shadow rounded-lg p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Add Company Asset</h2>
        {success && <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">Asset added successfully!</div>}
        {error && <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Asset Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Asset Account</label>
            <select
              name="account_id"
              value={form.account_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select account</option>
              {assetAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.account_code} - {acc.account_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Purchase Date</label>
            <input
              type="date"
              name="purchase_date"
              value={form.purchase_date}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Purchase Value</label>
            <input
              type="number"
              name="purchase_value"
              value={form.purchase_value}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              min="0"
              step="0.01"
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
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Asset'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAssetPage; 