import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Save, X, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface EquityEntry {
  id?: number;
  account_id: number;
  amount: number;
  description: string;
  entry_date: string;
  reference?: string;
}

interface ChartOfAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string | number;
}

const EquityEntryPage: React.FC = () => {
  const [equityAccounts, setEquityAccounts] = useState<ChartOfAccount[]>([]);
  const [entries, setEntries] = useState<EquityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('');

  useEffect(() => {
    fetchEquityAccounts();
    fetchEquityEntries();
  }, []);

  const fetchEquityAccounts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/financial/accounts`);
      
      if (response.data.success) {
        // Filter for equity accounts where account_type is 13 (number or string)
        const equityAccounts = response.data.data.filter(
          (account: ChartOfAccount) => account.account_type === 13 || account.account_type === '13'
        );
        setEquityAccounts(equityAccounts);
      } else {
        setError('Failed to fetch equity accounts');
      }
    } catch (err) {
      console.error('Error fetching equity accounts:', err);
      setError('Failed to fetch equity accounts');
    }
  };

  const fetchEquityEntries = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/financial/equity-entries`);
      if (response.data.success) {
        setEntries(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching equity entries:', err);
      // Don't set error here as entries might not exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = () => {
    // Validate all required fields
    if (!selectedAccount || selectedAccount === '') {
      setError('Please select an equity account');
      return;
    }
    
    if (!amount || amount === '' || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    
    if (!description || description.trim() === '') {
      setError('Please enter a description');
      return;
    }
    
    if (!entryDate) {
      setError('Please select an entry date');
      return;
    }

    const newEntry: EquityEntry = {
      account_id: Number(selectedAccount), // Ensure it's a number
      amount: parseFloat(amount),
      description: description.trim(),
      entry_date: entryDate,
      reference: reference.trim() || undefined
    };

    console.log('Adding new entry:', newEntry);
    setEntries([...entries, newEntry]);
    
    // Reset form
    setSelectedAccount('');
    setAmount('');
    setDescription('');
    setReference('');
    setError(null);
  };

  const handleRemoveEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleSaveEntries = async () => {
    if (entries.length === 0) {
      setError('No entries to save');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Log the payload for debugging
      console.log('Sending entries to backend:', entries);
      
      const response = await axios.post(`${API_BASE_URL}/financial/equity-entries/bulk`, {
        entries
      });

      if (response.data.success) {
        setSuccess('Equity entries posted successfully!');
        setEntries([]);
        // Refresh the list
        await fetchEquityEntries();
      } else {
        setError(response.data.error || 'Failed to post equity entries');
      }
    } catch (err: any) {
      console.error('Error posting equity entries:', err);
      setError(err.response?.data?.error || 'Failed to post equity entries');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountName = (accountId: number) => {
    const account = equityAccounts.find(acc => acc.id === accountId);
    return account ? `${account.account_code} - ${account.account_name}` : 'Unknown Account';
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
              <h1 className="text-3xl font-bold text-gray-900">Equity Entry Management</h1>
              <p className="text-gray-600 mt-1">Post equity entries to your financial records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-green-700">{success}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Entry Form */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add Equity Entry</h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equity Account *
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an equity account</option>
                  {equityAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Initial capital investment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Entry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Date *
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g., INV-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddEntry}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </button>
            </div>
          </div>

          {/* Entries List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Pending Entries</h3>
              <p className="text-sm text-gray-600 mt-1">
                {entries.length} entry{entries.length !== 1 ? 'ies' : 'y'} ready to post
              </p>
            </div>
            <div className="p-6">
              {entries.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No entries added yet</p>
                  <p className="text-sm">Add equity entries using the form on the left</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {getAccountName(entry.account_id)}
                          </div>
                          <div className="text-sm text-gray-600">{entry.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Date: {entry.entry_date}
                            {entry.reference && ` • Ref: ${entry.reference}`}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(entry.amount)}
                          </div>
                          <button
                            onClick={() => handleRemoveEntry(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-medium text-gray-900">Total</div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(entries.reduce((sum, entry) => sum + entry.amount, 0))}
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveEntries}
                    disabled={saving}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Posting Entries...' : 'Post All Entries'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Existing Entries */}
        {entries.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Equity Entries</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.entry_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getAccountName(entry.account_id)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {entry.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.reference || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(entry.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquityEntryPage; 