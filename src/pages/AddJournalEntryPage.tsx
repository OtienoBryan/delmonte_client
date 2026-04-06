import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: number;
  is_active?: boolean;
}

interface JournalEntryLine {
  account_id: number;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

interface JournalEntry {
  entry_date: string;
  reference: string;
  description: string;
  lines: JournalEntryLine[];
}

const AddJournalEntryPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [entry, setEntry] = useState<JournalEntry>({
    entry_date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [
      { account_id: 0, debit_amount: 0, credit_amount: 0, description: '' },
      { account_id: 0, debit_amount: 0, credit_amount: 0, description: '' }
    ]
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/financial/accounts');
      const data = await response.json();
      if (data.success) {
        setAccounts(data.data.filter((acc: Account) => acc.is_active));
      }
    } catch (err) {
      setError('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const addLine = () => {
    setEntry(prev => ({
      ...prev,
      lines: [...prev.lines, { account_id: 0, debit_amount: 0, credit_amount: 0, description: '' }]
    }));
  };

  const removeLine = (index: number) => {
    if (entry.lines.length > 2) {
      setEntry(prev => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index)
      }));
    }
  };

  const updateLine = (index: number, field: keyof JournalEntryLine, value: any) => {
    setEntry(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
  };

  const calculateTotals = () => {
    const totalDebit = entry.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
    return { totalDebit, totalCredit };
  };

  const validateEntry = () => {
    const { totalDebit, totalCredit } = calculateTotals();
    
    if (!entry.entry_date) {
      setError('Entry date is required');
      return false;
    }
    
    if (!entry.reference.trim()) {
      setError('Reference is required');
      return false;
    }
    
    if (!entry.description.trim()) {
      setError('Description is required');
      return false;
    }
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      setError(`Debits (${totalDebit.toFixed(2)}) must equal credits (${totalCredit.toFixed(2)})`);
      return false;
    }
    
    for (let i = 0; i < entry.lines.length; i++) {
      const line = entry.lines[i];
      if (!line.account_id) {
        setError(`Line ${i + 1}: Account is required`);
        return false;
      }
      if (line.debit_amount === 0 && line.credit_amount === 0) {
        setError(`Line ${i + 1}: Either debit or credit amount must be greater than 0`);
        return false;
      }
      if (line.debit_amount > 0 && line.credit_amount > 0) {
        setError(`Line ${i + 1}: Cannot have both debit and credit amounts`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEntry()) {
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/financial/journal-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Journal entry created successfully!');
        setEntry({
          entry_date: new Date().toISOString().split('T')[0],
          reference: '',
          description: '',
          lines: [
            { account_id: 0, debit_amount: 0, credit_amount: 0, description: '' },
            { account_id: 0, debit_amount: 0, credit_amount: 0, description: '' }
          ]
        });
      } else {
        setError(data.error || 'Failed to create journal entry');
      }
    } catch (err) {
      setError('Failed to create journal entry');
    } finally {
      setSaving(false);
    }
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Add Journal Entry</h1>
            <p className="mt-1 text-sm text-gray-600">
              Create a new journal entry with multiple debit and credit lines
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Date *
                </label>
                <input
                  type="date"
                  value={entry.entry_date}
                  onChange={(e) => setEntry(prev => ({ ...prev, entry_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference *
                </label>
                <input
                  type="text"
                  value={entry.reference}
                  onChange={(e) => setEntry(prev => ({ ...prev, reference: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., JE-001"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={entry.description}
                  onChange={(e) => setEntry(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Monthly depreciation"
                  required
                />
              </div>
            </div>

            {/* Journal Entry Lines */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Journal Entry Lines</h3>
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Line
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Debit Amount
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credit Amount
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entry.lines.map((line, index) => (
                      <tr key={index}>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <select
                            value={line.account_id}
                            onChange={(e) => updateLine(index, 'account_id', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value={0}>Select Account</option>
                            {accounts.map(account => (
                              <option key={account.id} value={account.id}>
                                {account.account_code} - {account.account_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.debit_amount || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              updateLine(index, 'debit_amount', value);
                              if (value > 0) {
                                updateLine(index, 'credit_amount', 0);
                              }
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.credit_amount || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              updateLine(index, 'credit_amount', value);
                              if (value > 0) {
                                updateLine(index, 'debit_amount', 0);
                              }
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateLine(index, 'description', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Line description"
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {entry.lines.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeLine(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Total Debits:</span>
                  <span className={`ml-2 text-lg font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    KES {totalDebit.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Total Credits:</span>
                  <span className={`ml-2 text-lg font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    KES {totalCredit.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm font-medium text-gray-700">Balance:</span>
                <span className={`ml-2 text-lg font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                  KES {(totalDebit - totalCredit).toFixed(2)}
                </span>
                {isBalanced && (
                  <span className="ml-2 text-sm text-green-600">✓ Balanced</span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !isBalanced}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Journal Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddJournalEntryPage; 