import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, Tag } from 'lucide-react';

interface Sku {
  id: number;
  sku: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

const SkusPage: React.FC = () => {
  const [skus, setSkus] = useState<Sku[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newSku, setNewSku] = useState('');
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const filteredSkus = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return skus;
    return skus.filter(s => s.sku.toLowerCase().includes(q));
  }, [skus, search]);

  const fetchSkus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/financial/skus');
      if (res.data?.success) setSkus(Array.isArray(res.data.data) ? res.data.data : []);
      else setError(res.data?.error || 'Failed to load SKUs');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load SKUs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkus();
  }, []);

  const addSku = async () => {
    const sku = newSku.trim();
    if (!sku) return;
    setSaving(true);
    setError(null);
    try {
      const res = await axios.post('/api/financial/skus', { sku });
      if (res.data?.success && res.data.data) {
        setSkus(prev => [res.data.data as Sku, ...prev]);
        setNewSku('');
      } else {
        setError(res.data?.error || 'Failed to add SKU');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add SKU');
    } finally {
      setSaving(false);
    }
  };

  const updateSku = async (skuId: number, patch: Partial<Pick<Sku, 'sku' | 'is_active'>>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await axios.put(`/api/financial/skus/${skuId}`, patch);
      if (res.data?.success && res.data.data) {
        setSkus(prev => prev.map(s => s.id === skuId ? { ...s, ...res.data.data } : s));
      } else {
        setError(res.data?.error || 'Failed to update SKU');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update SKU');
    } finally {
      setSaving(false);
    }
  };

  const deleteSku = async (skuRow: Sku) => {
    if (!confirm(`Delete SKU "${skuRow.sku}"?`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await axios.delete(`/api/financial/skus/${skuRow.id}`);
      if (res.data?.success) {
        setSkus(prev => prev.filter(s => s.id !== skuRow.id));
      } else {
        setError(res.data?.error || 'Failed to delete SKU');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to delete SKU');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-900">SKUs</h1>
              <p className="text-xs text-gray-600 mt-1">Create and manage your master SKU list.</p>
            </div>
            <button
              type="button"
              onClick={fetchSkus}
              className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-xs mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex-1">
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search SKU..."
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Add SKU</label>
              <div className="flex items-center gap-2">
                <input
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter SKU..."
                  disabled={saving}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSku();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addSku}
                  disabled={saving || !newSku.trim()}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-600">Loading SKUs...</p>
            </div>
          ) : filteredSkus.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <Tag className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No SKUs found</p>
              <p className="text-xs mt-1">Add one using the form above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider w-48">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredSkus.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="text-xs font-medium text-gray-900">{row.sku}</div>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => updateSku(row.id, { is_active: row.is_active ? 0 : 1 })}
                          disabled={saving}
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            row.is_active
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {row.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const next = prompt('Edit SKU', row.sku);
                              if (next === null) return;
                              const v = next.trim();
                              if (!v) return;
                              updateSku(row.id, { sku: v });
                            }}
                            className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                            disabled={saving}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSku(row)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                            disabled={saving}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkusPage;

