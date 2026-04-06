import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Search, Building2, X, AlertCircle, Target, Layout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';

interface OutletAccount {
  id: number;
  name: string;
  planogram_compliance?: number;
}

const OutletAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<OutletAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [editingAccountName, setEditingAccountName] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sosTargetsModalOpen, setSosTargetsModalOpen] = useState(false);
  const [selectedOutletAccount, setSelectedOutletAccount] = useState<OutletAccount | null>(null);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [sosTargets, setSosTargets] = useState<{ id: number; brand_id: number; brand_name: string; target_percentage: number }[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<number | ''>('');
  const [targetPercentage, setTargetPercentage] = useState<string>('');
  const [savingTarget, setSavingTarget] = useState(false);
  const [planogramModalOpen, setPlanogramModalOpen] = useState(false);
  const [savingPlanogram, setSavingPlanogram] = useState(false);
  const [products, setProducts] = useState<{ id: number; product_name: string }[]>([]);
  const [planogramCompliances, setPlanogramCompliances] = useState<{ id: number; product_id: number; product_name: string; compliance_quantity: number }[]>([]);
  const [loadingPlanogram, setLoadingPlanogram] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [complianceQuantity, setComplianceQuantity] = useState<string>('');

  useEffect(() => {
    fetchAccounts();
    fetchBrands();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/financial/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await axios.get('/api/brands', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setBrands(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const fetchSosTargets = async (outletAccountId: number) => {
    setLoadingTargets(true);
    try {
      const res = await axios.get(`/api/brand-sos-targets/outlet-account/${outletAccountId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setSosTargets(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch SOS targets:', err);
      setSosTargets([]);
    }
    setLoadingTargets(false);
  };

  const openSosTargetsModal = (account: OutletAccount) => {
    setSelectedOutletAccount(account);
    setSosTargetsModalOpen(true);
    setSelectedBrandId('');
    setTargetPercentage('');
    fetchSosTargets(account.id);
  };

  const fetchPlanogramCompliance = async (outletAccountId: number) => {
    setLoadingPlanogram(true);
    try {
      const res = await axios.get(`/api/planogram-compliance/outlet-account/${outletAccountId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setPlanogramCompliances(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch planogram compliance:', err);
      setPlanogramCompliances([]);
    }
    setLoadingPlanogram(false);
  };

  const openPlanogramModal = (account: OutletAccount) => {
    setSelectedOutletAccount(account);
    setPlanogramModalOpen(true);
    setSelectedProductId('');
    setComplianceQuantity('');
    setError(null);
    fetchPlanogramCompliance(account.id);
  };

  const handleSavePlanogramCompliance = async () => {
    if (!selectedOutletAccount || !selectedProductId || !complianceQuantity) {
      setError('Please select a product and enter a compliance quantity');
      return;
    }

    const quantity = parseInt(complianceQuantity, 10);
    if (isNaN(quantity) || quantity < 0) {
      setError('Compliance quantity must be a positive number');
      return;
    }

    setSavingPlanogram(true);
    setError(null);
    try {
      const res = await axios.post('/api/planogram-compliance', {
        outlet_account_id: selectedOutletAccount.id,
        product_id: selectedProductId,
        compliance_quantity: quantity
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        await fetchPlanogramCompliance(selectedOutletAccount.id);
        setSelectedProductId('');
        setComplianceQuantity('');
      } else {
        setError(res.data.error || 'Failed to save planogram compliance');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save planogram compliance');
    }
    setSavingPlanogram(false);
  };

  const handleDeletePlanogramCompliance = async (id: number) => {
    try {
      const res = await axios.delete(`/api/planogram-compliance/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success && selectedOutletAccount) {
        await fetchPlanogramCompliance(selectedOutletAccount.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to delete planogram compliance');
    }
  };

  const handleSaveSosTarget = async () => {
    if (!selectedOutletAccount || !selectedBrandId || !targetPercentage) {
      setError('Please select a brand and enter a target percentage');
      return;
    }

    const percentage = parseFloat(targetPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      setError('Target percentage must be between 0 and 100');
      return;
    }

    setSavingTarget(true);
    setError(null);
    try {
      const res = await axios.post('/api/brand-sos-targets', {
        outlet_account_id: selectedOutletAccount.id,
        brand_id: selectedBrandId,
        target_percentage: percentage
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        await fetchSosTargets(selectedOutletAccount.id);
        setSelectedBrandId('');
        setTargetPercentage('');
      } else {
        setError(res.data.error || 'Failed to save SOS target');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save SOS target');
    }
    setSavingTarget(false);
  };

  const handleDeleteSosTarget = async (id: number) => {
    try {
      const res = await axios.delete(`/api/brand-sos-targets/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success && selectedOutletAccount) {
        await fetchSosTargets(selectedOutletAccount.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to delete SOS target');
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/outlet-accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setAccounts(res.data.data);
      } else {
        setError(res.data.error || 'Failed to fetch outlet accounts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch outlet accounts');
    }
    setLoading(false);
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      setError('Outlet account name is required');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.post('/api/outlet-accounts', {
        name: newAccountName.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setAccounts([...accounts, res.data.data]);
        setNewAccountName('');
        setAddModalOpen(false);
      } else {
        setError(res.data.error || 'Failed to add outlet account');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add outlet account');
    }
    setSubmitting(false);
  };

  const handleEditAccount = async (id: number) => {
    if (!editingAccountName.trim()) {
      setError('Outlet account name is required');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.put(`/api/outlet-accounts/${id}`, {
        name: editingAccountName.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setAccounts(accounts.map(a => a.id === id ? res.data.data : a));
        setEditingAccountId(null);
        setEditingAccountName('');
      } else {
        setError(res.data.error || 'Failed to update outlet account');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update outlet account');
    }
    setSubmitting(false);
  };

  const handleDeleteAccount = async (id: number) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.delete(`/api/outlet-accounts/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setAccounts(accounts.filter(a => a.id !== id));
        setShowDeleteConfirm(null);
      } else {
        setError(res.data.error || 'Failed to delete outlet account');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to delete outlet account');
    }
    setSubmitting(false);
  };

  const startEditing = (account: OutletAccount) => {
    setEditingAccountId(account.id);
    setEditingAccountName(account.name);
  };

  const cancelEditing = () => {
    setEditingAccountId(null);
    setEditingAccountName('');
  };

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm font-bold text-gray-900 mb-1">Outlet Accounts</h1>
              <p className="text-xs text-gray-600">Manage outlet account types</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/brand-sos-targets"
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-purple-500 transition-colors duration-200"
              >
                <Target className="w-3 h-3 mr-1.5" />
                View All Targets
              </Link>
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 transition-colors duration-200"
              >
                <Plus className="w-3 h-3 mr-1.5" />
                Add Outlet Account
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-3">
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    placeholder="Search outlet accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" />
                  <span>{filteredAccounts.length} accounts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-2.5">
            <div className="flex">
              <AlertCircle className="w-4 h-4 text-red-400 mr-2 mt-0.5" />
              <div>
                <h3 className="text-xs font-medium text-red-800">Error</h3>
                <div className="mt-0.5 text-xs text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Accounts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-900 mb-1.5">
                {searchTerm ? 'No outlet accounts found' : 'No outlet accounts yet'}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by creating your first outlet account'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-3 h-3 mr-1.5" />
                  Add Your First Outlet Account
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-12 gap-3 text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-10">Account Name</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {filteredAccounts.map(account => (
                  <div key={account.id} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-12 gap-3 items-center">
                      {/* Account Name */}
                      <div className="col-span-10">
                        {editingAccountId === account.id ? (
                          <input
                            className="w-full text-xs font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            value={editingAccountName}
                            onChange={e => setEditingAccountName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleEditAccount(account.id);
                              if (e.key === 'Escape') cancelEditing();
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center">
                            <Building2 className="w-3 h-3 text-gray-400 mr-1.5" />
                            <span className="text-xs font-medium text-gray-900">{account.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-2">
                        <div className="flex items-center justify-end gap-1.5">
                          {editingAccountId === account.id ? (
                            <>
                              <button
                                onClick={() => handleEditAccount(account.id)}
                                disabled={submitting}
                                className="p-0.5 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                                title="Save"
                              >
                                <X className="w-3.5 h-3.5 rotate-45" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openSosTargetsModal(account)}
                                className="p-0.5 text-purple-600 hover:text-purple-700 transition-colors"
                                title="Set Brand SOS Targets"
                              >
                                <Target className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openPlanogramModal(account)}
                                className="p-0.5 text-green-600 hover:text-green-700 transition-colors"
                                title="Set Planogram Compliance"
                              >
                                <Layout className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => startEditing(account)}
                                className="p-0.5 text-blue-600 hover:text-blue-700 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(account.id)}
                                className="p-0.5 text-red-600 hover:text-red-700 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Add Account Modal */}
        <Transition show={addModalOpen} as={React.Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setAddModalOpen(false)}>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-4 shadow-xl transition-all">
                    <Dialog.Title className="text-sm font-bold text-gray-900 mb-3">
                      Add New Outlet Account
                    </Dialog.Title>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Account Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newAccountName}
                          onChange={(e) => setNewAccountName(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter account name"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddModalOpen(false);
                          setNewAccountName('');
                          setError(null);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddAccount}
                        disabled={submitting || !newAccountName.trim()}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Adding...' : 'Add Account'}
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Delete Confirmation Modal */}
        <Transition show={showDeleteConfirm !== null} as={React.Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowDeleteConfirm(null)}>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-4 shadow-xl transition-all">
                    <Dialog.Title className="text-sm font-bold text-gray-900 mb-2">
                      Confirm Delete
                    </Dialog.Title>
                    <p className="text-xs text-gray-600 mb-4">
                      Are you sure you want to delete this outlet account? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => showDeleteConfirm && handleDeleteAccount(showDeleteConfirm)}
                        disabled={submitting}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Brand SOS Targets Modal */}
        <Transition show={sosTargetsModalOpen} as={React.Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setSosTargetsModalOpen(false)}>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-sm font-bold text-gray-900">
                          Brand SOS Targets - {selectedOutletAccount?.name}
                        </Dialog.Title>
                        <button
                          onClick={() => {
                            setSosTargetsModalOpen(false);
                            setSelectedOutletAccount(null);
                            setSosTargets([]);
                            setSelectedBrandId('');
                            setTargetPercentage('');
                            setError(null);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Error Message */}
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-800">{error}</p>
                        </div>
                      )}

                      {/* Add New Target Form */}
                      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                        <h3 className="text-xs font-medium text-gray-700 mb-2">Add New Target</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Brand <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={selectedBrandId}
                              onChange={(e) => setSelectedBrandId(e.target.value ? Number(e.target.value) : '')}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select brand</option>
                              {brands
                                .filter(brand => !sosTargets.some(target => target.brand_id === brand.id))
                                .map(brand => (
                                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Target Percentage <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={targetPercentage}
                                onChange={(e) => setTargetPercentage(e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0-100"
                              />
                              <span className="text-xs text-gray-500">%</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={handleSaveSosTarget}
                          disabled={savingTarget || !selectedBrandId || !targetPercentage}
                          className="w-full px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingTarget ? 'Saving...' : 'Add Target'}
                        </button>
                      </div>

                      {/* Existing Targets List */}
                      <div>
                        <h3 className="text-xs font-medium text-gray-700 mb-2">Current Targets</h3>
                        {loadingTargets ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                            <p className="text-xs text-gray-600 mt-2">Loading targets...</p>
                          </div>
                        ) : sosTargets.length === 0 ? (
                          <div className="text-center py-4 bg-gray-50 rounded-lg">
                            <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-600">No SOS targets set for this outlet account</p>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Brand</th>
                                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">Target %</th>
                                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {sosTargets.map(target => (
                                    <tr key={target.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2">
                                        <span className="text-xs font-medium text-gray-900">{target.brand_name}</span>
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <span className="text-xs font-semibold text-purple-600">{target.target_percentage}%</span>
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <button
                                          onClick={() => handleDeleteSosTarget(target.id)}
                                          className="p-0.5 text-red-600 hover:text-red-700 transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSosTargetsModalOpen(false);
                          setSelectedOutletAccount(null);
                          setSosTargets([]);
                          setSelectedBrandId('');
                          setTargetPercentage('');
                          setError(null);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Close
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Planogram Compliance Modal */}
        <Transition show={planogramModalOpen} as={React.Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setPlanogramModalOpen(false)}>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <Dialog.Title className="text-sm font-bold text-gray-900">
                          Planogram Compliance - {selectedOutletAccount?.name}
                        </Dialog.Title>
                        <button
                          onClick={() => {
                            setPlanogramModalOpen(false);
                            setSelectedOutletAccount(null);
                            setPlanogramCompliances([]);
                            setSelectedProductId('');
                            setComplianceQuantity('');
                            setError(null);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Error Message */}
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-800">{error}</p>
                        </div>
                      )}

                      {/* Add New Compliance Form */}
                      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                        <h3 className="text-xs font-medium text-gray-700 mb-2">Add New Compliance</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Product <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={selectedProductId}
                              onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : '')}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-green-500 focus:border-transparent"
                            >
                              <option value="">Select product</option>
                              {products
                                .filter(product => !planogramCompliances.some(pc => pc.product_id === product.id))
                                .map(product => (
                                  <option key={product.id} value={product.id}>{product.product_name}</option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Compliance Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={complianceQuantity}
                              onChange={(e) => setComplianceQuantity(e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-green-500 focus:border-transparent"
                              placeholder="Enter quantity"
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleSavePlanogramCompliance}
                          disabled={savingPlanogram || !selectedProductId || !complianceQuantity}
                          className="w-full px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingPlanogram ? 'Saving...' : 'Add Compliance'}
                        </button>
                      </div>

                      {/* Existing Compliance List */}
                      <div>
                        <h3 className="text-xs font-medium text-gray-700 mb-2">Current Compliance</h3>
                        {loadingPlanogram ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                            <p className="text-xs text-gray-600 mt-2">Loading compliance...</p>
                          </div>
                        ) : planogramCompliances.length === 0 ? (
                          <div className="text-center py-4 bg-gray-50 rounded-lg">
                            <Layout className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-600">No planogram compliance set for this outlet account</p>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Product</th>
                                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">Target Quantity</th>
                                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {planogramCompliances.map(compliance => (
                                    <tr key={compliance.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2">
                                        <span className="text-xs font-medium text-gray-900">{compliance.product_name}</span>
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <span className="text-xs font-semibold text-green-600">{compliance.compliance_quantity}</span>
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <button
                                          onClick={() => handleDeletePlanogramCompliance(compliance.id)}
                                          className="p-0.5 text-red-600 hover:text-red-700 transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setPlanogramModalOpen(false);
                          setSelectedOutletAccount(null);
                          setPlanogramCompliances([]);
                          setSelectedProductId('');
                          setComplianceQuantity('');
                          setError(null);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Close
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
};

export default OutletAccountsPage;
