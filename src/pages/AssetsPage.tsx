import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, X, Save } from 'lucide-react';

interface Asset {
  id: number;
  account_id: number;
  name: string;
  category?: string;
  purchase_date: string;
  purchase_value: number;
  description?: string;
  created_at: string;
  updated_at: string;
  total_depreciation?: number;
  current_value?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [assetAccounts, setAssetAccounts] = useState<{ id: number; account_code: string; account_name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/financial/assets-with-depreciation`);
        if (res.data.success) {
          setAssets(res.data.data);
        } else {
          setError(res.data.error || 'Failed to fetch assets');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch assets');
      } finally {
        setLoading(false);
      }
    };
    const fetchTotalValue = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/financial/assets-total-value`);
        if (res.data.success) {
          setTotalValue(res.data.total_value);
        }
      } catch {}
    };
    const fetchAssetAccounts = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/financial/asset-accounts`);
        if (res.data.success) {
          setAssetAccounts(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch asset accounts:', err);
      }
    };
    fetchAssets();
    fetchTotalValue();
    fetchAssetAccounts();
  }, []);

  // Helper to format date as 'MMM dd, yyyy'
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  // Filtered assets based on search
  const filteredAssets = assets.filter(asset => {
    const searchLower = search.toLowerCase();
    return (
      asset.name.toLowerCase().includes(searchLower) ||
      (asset.description?.toLowerCase().includes(searchLower) ?? false) ||
      asset.purchase_date.toLowerCase().includes(searchLower)
    );
  });

  // Get unique categories from existing assets
  const categories = Array.from(new Set(assets.map(a => a.category).filter(Boolean))) as string[];
  const defaultCategories = ['Equipment', 'Vehicle', 'Building', 'Furniture', 'Computer', 'Other'];

  const handleOpenModal = () => {
    setShowAddModal(true);
    setFormError(null);
    setFormData({
      name: '',
      category: '',
      description: ''
    });
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setFormError(null);
    setFormData({
      name: '',
      category: '',
      description: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Item name is required');
      return;
    }

    if (!formData.category) {
      setFormError('Category is required');
      return;
    }

    if (!formData.description.trim()) {
      setFormError('Description is required');
      return;
    }

    if (assetAccounts.length === 0) {
      setFormError('No asset accounts available. Please contact administrator.');
      return;
    }

    setSubmitting(true);

    try {
      // Combine category and description
      const fullDescription = formData.category 
        ? `Category: ${formData.category}${formData.description ? `\n${formData.description}` : ''}`
        : formData.description;

      // Use default values that won't affect financial accounts
      // Use first available asset account
      const defaultAccountId = assetAccounts[0].id;
      const today = new Date().toISOString().split('T')[0];
      
      const payload = {
        account_id: Number(defaultAccountId),
        name: formData.name.trim(),
        purchase_date: today,
        purchase_value: 0.01, // Small non-zero value (backend may reject 0)
        description: fullDescription || null
      };

      await axios.post(`${API_BASE_URL}/financial/assets`, payload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Refresh assets list
      const res = await axios.get(`${API_BASE_URL}/financial/assets-with-depreciation`);
      if (res.data.success) {
        setAssets(res.data.data);
      }

      // Refresh total value
      const totalRes = await axios.get(`${API_BASE_URL}/financial/assets-total-value`);
      if (totalRes.data.success) {
        setTotalValue(totalRes.data.total_value);
      }

      handleCloseModal();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Failed to add asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-lg font-bold mb-4 text-gray-800">All Assets</h1>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        {totalValue !== null && (
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 inline-block shadow">
            <div className="text-gray-700 text-[10px] font-medium mb-1">Total Current Value of All Assets</div>
            <div className="text-lg font-bold text-blue-800">{
              new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(totalValue)
            }</div>
          </div>
        )}
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 bg-white border border-blue-300 rounded-lg px-3 py-1.5 shadow hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-semibold text-blue-700">Add Asset</span>
        </button>

        <Link
          to="/assets/depreciation"
          className="flex items-center gap-1.5 bg-white border border-blue-300 rounded-lg px-3 py-1.5 shadow hover:bg-blue-50 transition-colors"
          style={{ minWidth: 0 }}
        >
          <Plus className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-semibold text-blue-700">Asset Depreciation Report</span>
        </Link>
      </div>
      <div className="mb-3 flex justify-end">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search assets..."
          className="border border-gray-300 rounded px-2 py-1.5 text-xs w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      {loading ? (
        <div className="text-xs text-gray-600">Loading assets...</div>
      ) : error ? (
        <div className="text-xs text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg shadow">
            <thead>
              <tr>
                <th className="px-3 py-2 border-b text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 border-b text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 border-b text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Purchase Date</th>
                <th className="px-3 py-2 border-b text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Purchase Value</th>
                <th className="px-3 py-2 border-b text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Total Depreciation</th>
                <th className="px-3 py-2 border-b text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Current Value</th>
                <th className="px-3 py-2 border-b text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-3 text-center text-xs text-gray-500">No assets found.</td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.id}>
                    <td className="px-3 py-2 border-b text-xs text-gray-900">{asset.name}</td>
                    <td className="px-3 py-2 border-b text-xs text-gray-700">{asset.category || '-'}</td>
                    <td className="px-3 py-2 border-b text-xs text-gray-700">{formatDate(asset.purchase_date)}</td>
                    <td className="px-3 py-2 border-b text-xs text-gray-900">{asset.purchase_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 border-b text-xs text-gray-900">{asset.total_depreciation?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}</td>
                    <td className="px-3 py-2 border-b text-xs text-gray-900">{asset.current_value?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? asset.purchase_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 border-b text-xs text-gray-700">{asset.description || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Add New Asset</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={submitting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4">
                {formError && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">{formError}</p>
                  </div>
                )}

                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={submitting}
                    placeholder="Enter asset name"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={submitting}
                    required
                  >
                    <option value="">Select category</option>
                    {[...new Set([...defaultCategories, ...categories])].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    disabled={submitting}
                    placeholder="Enter asset description"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.name.trim() || !formData.category || !formData.description.trim()}
                    className="inline-flex items-center px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3 mr-1.5" />
                        Add Asset
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsPage; 