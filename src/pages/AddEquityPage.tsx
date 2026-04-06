import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface EquityAccount {
  id: number;
  account_code: string;
  account_name: string;
}

interface EquityEntry {
  id: number;
  entry_date: string;
  amount: number;
  description: string;
  account_name: string;
  account_code: string;
}

const AddEquityPage: React.FC = () => {
  const [equityAccounts, setEquityAccounts] = useState<EquityAccount[]>([]);
  const [entries, setEntries] = useState<EquityEntry[]>([]);
  const [form, setForm] = useState({
    account_id: '',
    amount: '',
    date: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEquityAccounts();
    fetchEquityEntries();
  }, []);

  const fetchEquityAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/accounts?parent_account_id=3`);
      if (res.data.success) {
        setEquityAccounts(res.data.data);
      }
    } catch (err) {
      setError('Failed to load equity accounts');
    }
  };

  const fetchEquityEntries = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/equity-entries`);
      if (res.data.success) {
        setEntries(res.data.data);
      }
    } catch (err) {
      setError('Failed to load equity entries');
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
        amount: Number(form.amount),
      };
      await axios.post(`${API_BASE_URL}/financial/equity-entries`, payload);
      setSuccess(true);
      setForm({ account_id: '', amount: '', date: '', description: '' });
      fetchEquityEntries();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add equity entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-8">
      <div className="bg-white shadow rounded-lg p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Add & Manage Equity</h2>
        {success && <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">Equity entry added successfully!</div>}
        {error && <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Equity Account</label>
            <select
              name="account_id"
              value={form.account_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select equity account</option>
              {equityAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.account_code} - {acc.account_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Amount</label>
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
            <label className="block text-gray-700 font-medium mb-1">Date</label>
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
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Equity Entry'}
          </button>
        </form>
        <h3 className="text-lg font-semibold mb-2">Equity Journal Entries</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700 border rounded">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left">Date</th>
                <th className="px-2 py-1 text-left">Account</th>
                <th className="px-2 py-1 text-left">Description</th>
                <th className="px-2 py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={entry.id || idx} className="border-b last:border-b-0">
                  <td className="px-2 py-1">{entry.entry_date}</td>
                  <td className="px-2 py-1">{entry.account_name} ({entry.account_code})</td>
                  <td className="px-2 py-1">{entry.description}</td>
                  <td className="px-2 py-1 text-right">{entry.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AddEquityPage; 