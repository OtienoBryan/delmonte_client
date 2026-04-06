import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Search, Tag, X, AlertCircle } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';

interface Brand {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const BrandsPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDescription, setNewBrandDescription] = useState('');
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [editingBrandName, setEditingBrandName] = useState('');
  const [editingBrandDescription, setEditingBrandDescription] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/brands', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setBrands(res.data.data);
      } else {
        setError(res.data.error || 'Failed to fetch brands');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch brands');
    }
    setLoading(false);
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) {
      setError('Brand name is required');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.post('/api/brands', {
        name: newBrandName.trim(),
        description: newBrandDescription.trim() || null,
        is_active: true
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setBrands([...brands, res.data.data]);
        setNewBrandName('');
        setNewBrandDescription('');
        setAddModalOpen(false);
      } else {
        setError(res.data.error || 'Failed to add brand');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add brand');
    }
    setSubmitting(false);
  };

  const handleEditBrand = async (id: number) => {
    if (!editingBrandName.trim()) {
      setError('Brand name is required');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.put(`/api/brands/${id}`, {
        name: editingBrandName.trim(),
        description: editingBrandDescription.trim() || null
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setBrands(brands.map(b => b.id === id ? res.data.data : b));
        setEditingBrandId(null);
        setEditingBrandName('');
        setEditingBrandDescription('');
      } else {
        setError(res.data.error || 'Failed to update brand');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update brand');
    }
    setSubmitting(false);
  };

  const handleDeleteBrand = async (id: number) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.delete(`/api/brands/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setBrands(brands.filter(b => b.id !== id));
        setShowDeleteConfirm(null);
      } else {
        setError(res.data.error || 'Failed to delete brand');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to delete brand');
    }
    setSubmitting(false);
  };

  const startEditing = (brand: Brand) => {
    setEditingBrandId(brand.id);
    setEditingBrandName(brand.name);
    setEditingBrandDescription(brand.description || '');
  };

  const cancelEditing = () => {
    setEditingBrandId(null);
    setEditingBrandName('');
    setEditingBrandDescription('');
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (brand.description && brand.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm font-bold text-gray-900 mb-1">Product Brands</h1>
              <p className="text-xs text-gray-600">Manage product brands</p>
            </div>
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 transition-colors duration-200"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              Add Brand
            </button>
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
                    placeholder="Search brands..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  <span>{filteredBrands.length} brands</span>
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

        {/* Brands Table */}
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
          ) : filteredBrands.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Tag className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-900 mb-1.5">
                {searchTerm ? 'No brands found' : 'No brands yet'}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by creating your first brand'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-3 h-3 mr-1.5" />
                  Add Your First Brand
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-12 gap-3 text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-5">Brand Name</div>
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {filteredBrands.map(brand => (
                  <div key={brand.id} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-12 gap-3 items-center">
                      {/* Brand Name */}
                      <div className="col-span-5">
                        {editingBrandId === brand.id ? (
                          <input
                            className="w-full text-xs font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            value={editingBrandName}
                            onChange={e => setEditingBrandName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleEditBrand(brand.id);
                              if (e.key === 'Escape') cancelEditing();
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center">
                            <Tag className="w-3 h-3 text-gray-400 mr-1.5" />
                            <span className="text-xs font-medium text-gray-900">{brand.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="col-span-5">
                        {editingBrandId === brand.id ? (
                          <input
                            className="w-full text-xs text-gray-600 border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            value={editingBrandDescription}
                            onChange={e => setEditingBrandDescription(e.target.value)}
                            placeholder="Description (optional)"
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleEditBrand(brand.id);
                              if (e.key === 'Escape') cancelEditing();
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-600">
                            {brand.description || <span className="text-gray-400 italic">No description</span>}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-2">
                        <div className="flex items-center justify-end gap-1.5">
                          {editingBrandId === brand.id ? (
                            <>
                              <button
                                onClick={() => handleEditBrand(brand.id)}
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
                                onClick={() => startEditing(brand)}
                                className="p-0.5 text-blue-600 hover:text-blue-700 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(brand.id)}
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

        {/* Add Brand Modal */}
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
                      Add New Brand
                    </Dialog.Title>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Brand Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newBrandName}
                          onChange={(e) => setNewBrandName(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter brand name"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description (Optional)
                        </label>
                        <textarea
                          value={newBrandDescription}
                          onChange={(e) => setNewBrandDescription(e.target.value)}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter brand description"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddModalOpen(false);
                          setNewBrandName('');
                          setNewBrandDescription('');
                          setError(null);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddBrand}
                        disabled={submitting || !newBrandName.trim()}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Adding...' : 'Add Brand'}
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
                      Are you sure you want to delete this brand? This action cannot be undone.
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
                        onClick={() => showDeleteConfirm && handleDeleteBrand(showDeleteConfirm)}
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
      </div>
    </div>
  );
};

export default BrandsPage;
