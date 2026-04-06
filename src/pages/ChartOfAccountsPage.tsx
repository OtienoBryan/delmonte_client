import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Save
} from 'lucide-react';
import { chartOfAccountsService } from '../services/financialService';
import { ChartOfAccount } from '../types/financial';

const ChartOfAccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [accountTypes, setAccountTypes] = useState<{ [key: number]: { name: string; color: string } }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<number | 'all'>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
  const [editForm, setEditForm] = useState({ account_name: '', account_type: 1, description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAccountTypes();
    fetchAccounts();
  }, []);

  const fetchAccountTypes = async () => {
    try {
      const response = await chartOfAccountsService.getAccountTypes();
      if (response.success && response.data) {
        // Convert array to object with account_type as key
        const typesMap: { [key: number]: { name: string; color: string } } = {};
        response.data.forEach(type => {
          typesMap[type.id] = { name: type.name, color: type.color };
        });
        setAccountTypes(typesMap);
      }
    } catch (err: any) {
      console.error('Error fetching account types:', err);
      // Set a fallback if fetch fails
      setAccountTypes({
        1: { name: 'Asset', color: 'bg-green-100 text-green-800' },
        2: { name: 'Liability', color: 'bg-red-100 text-red-800' },
        4: { name: 'Revenue', color: 'bg-blue-100 text-blue-800' },
        5: { name: 'Expense', color: 'bg-orange-100 text-orange-800' },
        6: { name: 'Assets', color: 'bg-green-100 text-green-800' },
        7: { name: 'Accounts Receivable', color: 'bg-cyan-100 text-cyan-800' },
        8: { name: 'Other Assets', color: 'bg-green-200 text-green-900' },
        9: { name: 'Cash', color: 'bg-emerald-100 text-emerald-800' },
        10: { name: 'Current Liability', color: 'bg-red-100 text-red-800' },
        11: { name: 'Non-Current Liability', color: 'bg-red-200 text-red-900' },
        12: { name: 'Long-term Liability', color: 'bg-red-300 text-red-950' },
        13: { name: 'Equity', color: 'bg-purple-100 text-purple-800' },
        14: { name: 'Retained Earnings', color: 'bg-purple-200 text-purple-900' },
        15: { name: 'Accounts Payable', color: 'bg-rose-100 text-rose-800' },
        16: { name: 'Expense Account', color: 'bg-amber-100 text-amber-800' },
        17: { name: 'Depreciation', color: 'bg-gray-100 text-gray-800' },
        18: { name: 'Other Expense', color: 'bg-orange-200 text-orange-900' },
        19: { name: 'Other Revenue', color: 'bg-blue-200 text-blue-900' }
      });
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await chartOfAccountsService.getAll();
      if (response.success && response.data) {
        setAccounts(response.data);
      } else {
        setError(response.error || 'Failed to fetch chart of accounts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch chart of accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewGeneralLedger = (accountCode: string) => {
    navigate(`/dashboard/reports/general-ledger?account=${encodeURIComponent(accountCode)}`);
  };

  const handleEdit = (account: ChartOfAccount) => {
    setEditingAccount(account);
    setEditForm({
      account_name: account.account_name,
      account_type: account.account_type,
      description: account.description || ''
    });
  };

  const handleCloseEdit = () => {
    setEditingAccount(null);
    setEditForm({ account_name: '', account_type: 1, description: '' });
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingAccount) return;

    if (!editForm.account_name.trim()) {
      setError('Account name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await chartOfAccountsService.update(editingAccount.id, {
        account_code: editingAccount.account_code, // Keep existing account code
        account_name: editForm.account_name.trim(),
        account_type: editForm.account_type,
        parent_account_id: editingAccount.parent_account_id || null, // Keep existing parent account
        description: editForm.description.trim() || null
      });

      if (response.success) {
        // Refresh accounts list
        await fetchAccounts();
        handleCloseEdit();
      } else {
        setError(response.error || 'Failed to update account');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = () => {
    if (!filteredAccounts.length) return;

    const headers = ['Account Code', 'Account Name', 'Account Type', 'Status', 'Description'];
    const rows = filteredAccounts.map(acc => [
      acc.account_code,
      acc.account_name,
      accountTypes[acc.account_type]?.name || `Type ${acc.account_type}`,
      acc.is_active ? 'Active' : 'Inactive',
      acc.description || ''
    ]);

    const csvContent = [
      ['Chart of Accounts'],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      headers,
      ...rows
    ]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `chart_of_accounts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = !searchTerm || 
      acc.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.description && acc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || acc.account_type === filterType;
    const matchesActive = showInactive || acc.is_active;
    
    return matchesSearch && matchesType && matchesActive;
  });

  // Group accounts by type
  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const type = account.account_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {} as { [key: number]: ChartOfAccount[] });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading chart of accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Error Loading Accounts</h3>
          <p className="text-xs text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAccounts}
            className="inline-flex items-center px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Chart of Accounts</h1>
                <p className="text-xs text-gray-600">
                  {filteredAccounts.length} of {accounts.length} accounts
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={exportToCSV}
                disabled={!filteredAccounts.length}
                className="inline-flex items-center px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3 h-3 mr-1.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 hidden">
            {Object.entries(accountTypes).map(([typeNum, typeInfo]) => {
              const count = accounts.filter(acc => acc.account_type === parseInt(typeNum) && acc.is_active).length;
              return (
                <div key={typeNum} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-600">{typeInfo.name}</div>
                  <div className="text-lg font-bold text-gray-900">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                <Search className="w-3 h-3 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                placeholder="Code, name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Account Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Types</option>
                {Object.entries(accountTypes).map(([typeNum, typeInfo]) => (
                  <option key={typeNum} value={typeNum}>
                    {typeInfo.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-gray-700">
                  Show inactive accounts
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Accounts Table - Grouped by Type */}
        {Object.entries(groupedAccounts).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium">No accounts found</p>
              <p className="text-xs">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedAccounts)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([typeNum, accountsList]) => {
              const typeInfo = accountTypes[parseInt(typeNum)] || { 
                name: `Type ${typeNum}`, 
                color: 'bg-gray-100 text-gray-800' 
              };
              
              return (
                <div key={typeNum} className="bg-white rounded-lg shadow-sm mb-4">
                  {/* Type Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeInfo.color}`}>
                          {typeInfo.name}
                        </span>
                        <span className="text-gray-600 text-xs">
                          {accountsList.length} account{accountsList.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accounts Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                            Account Code
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                            Account Name
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {accountsList.map((account) => (
                          <tr key={account.id} className={`hover:bg-gray-50 ${!account.is_active ? 'opacity-60' : ''}`}>
                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                              {account.account_code}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-gray-900">
                              {account.account_name}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              <div className="max-w-md truncate">
                                {account.description || '-'}
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              {account.is_active ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-2.5 h-2.5 mr-1" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800">
                                  <XCircle className="w-2.5 h-2.5 mr-1" />
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleEdit(account)}
                                  className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                                  title="Edit Account"
                                >
                                  <Edit className="w-3 h-3 mr-0.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleViewGeneralLedger(account.account_code)}
                                  className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                  title="View General Ledger"
                                >
                                  <Eye className="w-3 h-3 mr-0.5" />
                                  View Ledger
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
        )}

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>
            Total: {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''} displayed
          </p>
        </div>
      </div>

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Edit Account</h2>
              <button
                onClick={handleCloseEdit}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={saving}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              {error && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Account Code
                </label>
                <input
                  type="text"
                  value={editingAccount.account_code}
                  disabled
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-[10px] text-gray-500">Account code cannot be changed</p>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.account_name}
                  onChange={(e) => setEditForm({ ...editForm, account_name: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={saving}
                  placeholder="Enter account name"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.account_type}
                  onChange={(e) => setEditForm({ ...editForm, account_type: parseInt(e.target.value) })}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={saving}
                >
                  {Object.entries(accountTypes).map(([typeNum, typeInfo]) => (
                    <option key={typeNum} value={typeNum}>
                      {typeInfo.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  disabled={saving}
                  placeholder="Enter account description (optional)"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCloseEdit}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editForm.account_name.trim()}
                  className="inline-flex items-center px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 mr-1.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccountsPage;

