import React, { useEffect, useState, Fragment } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Search, DollarSign, Tag, X, Check, AlertCircle } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';

interface Category {
  id: number;
  name: string;
}

interface PriceOption {
  id: number; // Added id for deletion
  label: string;
  value: number;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [priceOptions, setPriceOptions] = useState<PriceOption[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [newPriceLabel, setNewPriceLabel] = useState('');
  const [newPriceValue, setNewPriceValue] = useState('');
  const [allCategoryPrices, setAllCategoryPrices] = useState<Record<number, PriceOption[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch all category prices on mount and after price modal closes
  useEffect(() => {
    const fetchAllPrices = async () => {
      try {
        const res = await axios.get('/api/financial/categories');
        if (res.data.success) {
          const cats: Category[] = res.data.data;
          const prices: Record<number, PriceOption[]> = {};
          await Promise.all(
            cats.map(async (cat) => {
              try {
                const pres = await axios.get(`/api/financial/categories/${cat.id}/price-options`);
                if (pres.data.success) prices[cat.id] = pres.data.data;
                else prices[cat.id] = [];
              } catch {
                prices[cat.id] = [];
              }
            })
          );
          setAllCategoryPrices(prices);
        }
      } catch {}
    };
    fetchAllPrices();
  }, [priceModalOpen]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/financial/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      } else {
        setError(res.data.error || 'Failed to fetch categories');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
    }
    setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await axios.post('/api/financial/categories', { name: newCategory });
      if (res.data.success) {
        setCategories([...categories, res.data.data]);
        setNewCategory('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
    }
  };

  const handleEditCategory = async (id: number) => {
    if (!editingCategoryName.trim()) return;
    try {
      await axios.put(`/api/financial/categories/${id}`, { name: editingCategoryName });
      setCategories(categories.map(c => c.id === id ? { ...c, name: editingCategoryName } : c));
      setEditingCategoryId(null);
      setEditingCategoryName('');
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await axios.delete(`/api/financial/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    }
  };

  const openPriceModal = async (category: Category) => {
    setSelectedCategory(category);
    setPriceLoading(true);
    setPriceError(null);
    setPriceModalOpen(true);
    try {
      const res = await axios.get(`/api/financial/categories/${category.id}/price-options`);
      if (res.data.success) {
        setPriceOptions(res.data.data);
      } else {
        setPriceError(res.data.error || 'Failed to fetch price options');
      }
    } catch (err: any) {
      setPriceError(err.message || 'Failed to fetch price options');
    }
    setPriceLoading(false);
  };
  const closePriceModal = () => {
    setSelectedCategory(null);
    setPriceModalOpen(false);
    setNewPriceLabel('');
    setNewPriceValue('');
    setPriceOptions([]);
    setPriceError(null);
  };
  const handleAddPriceOption = async () => {
    if (!selectedCategory || !newPriceLabel.trim() || !newPriceValue) return;
    try {
      const res = await axios.post(`/api/financial/categories/${selectedCategory.id}/price-options`, {
        label: newPriceLabel,
        value: Number(newPriceValue),
      });
      if (res.data.success) {
        setPriceOptions([...priceOptions, res.data.data]);
        setNewPriceLabel('');
        setNewPriceValue('');
      } else {
        setPriceError(res.data.error || 'Failed to add price option');
      }
    } catch (err: any) {
      setPriceError(err.message || 'Failed to add price option');
    }
  };
  const handleDeletePriceOption = async (id: number) => {
    try {
      await axios.delete(`/api/financial/price-options/${id}`);
      setPriceOptions(priceOptions.filter(opt => opt.id !== id));
    } catch (err: any) {
      setPriceError(err.message || 'Failed to delete price option');
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-sm font-bold text-gray-900 mb-1">Categories</h1>
              <p className="text-xs text-gray-600">Manage product categories and their pricing options</p>
            </div>
        <button
          onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 transition-colors duration-200"
        >
              <Plus className="w-3 h-3 mr-1.5" />
          Add Category
        </button>
      </div>
        </div>

        {/* Search and Stats */}
        <div className="mb-3">
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  <span>{filteredCategories.length} categories</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>{Object.values(allCategoryPrices).flat().length} price options</span>
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

        {/* Categories Table */}
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
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Tag className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-xs font-medium text-gray-900 mb-1.5">
                {searchTerm ? 'No categories found' : 'No categories yet'}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by creating your first category'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-3 h-3 mr-1.5" />
                  Add Your First Category
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-12 gap-3 text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Category Name</div>
                  <div className="col-span-3">Price Options</div>
                  <div className="col-span-3">Preview</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {filteredCategories.map(category => (
                  <div key={category.id} className="px-3 py-2 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-12 gap-3 items-center">
                      {/* Category Name */}
                      <div className="col-span-4">
                        {editingCategoryId === category.id ? (
                  <input
                            className="w-full text-xs font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    value={editingCategoryName}
                    onChange={e => setEditingCategoryName(e.target.value)}
                            onBlur={() => handleEditCategory(category.id)}
                            onKeyDown={e => { if (e.key === 'Enter') handleEditCategory(category.id); }}
                    autoFocus
                  />
                ) : (
                          <div className="flex items-center">
                            <Tag className="w-3 h-3 text-gray-400 mr-1.5" />
                            <span className="text-xs font-medium text-gray-900">{category.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Price Options Count */}
                      <div className="col-span-3">
                        <div className="flex items-center">
                          <span className="text-xs text-gray-600">
                            {(allCategoryPrices[category.id] || []).length} options
                          </span>
                        </div>
                      </div>

                      {/* Price Preview */}
                      <div className="col-span-3">
                        <div className="flex flex-wrap gap-1">
                          {(allCategoryPrices[category.id] || []).length > 0 ? (
                            (allCategoryPrices[category.id] || []).slice(0, 2).map(option => (
                        <span
                                key={option.id}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-blue-100 text-blue-800"
                        >
                                {option.label}: {option.value}
                        </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-gray-400 italic">No options</span>
                          )}
                          {(allCategoryPrices[category.id] || []).length > 2 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-gray-100 text-gray-600">
                              +{(allCategoryPrices[category.id] || []).length - 2} more
                    </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2">
                        <div className="flex items-center justify-end gap-1.5">
                          {editingCategoryId === category.id ? (
                            <button 
                              onClick={() => setEditingCategoryId(null)} 
                              className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Cancel editing"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                ) : (
                  <>
                              <button 
                                onClick={() => { setEditingCategoryId(category.id); setEditingCategoryName(category.name); }} 
                                className="p-0.5 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit category"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => setShowDeleteConfirm(category.id)} 
                                className="p-0.5 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                    <button
                                onClick={() => openPriceModal(category)}
                                className="inline-flex items-center px-2 py-0.5 border border-gray-300 text-[10px] font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 transition-colors"
                                title="Manage prices"
                    >
                                Prices
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

        {/* Add Category Modal */}
      {addModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-3 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-gray-900">Add New Category</h3>
            <button
              onClick={() => setAddModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
            >
                    <X className="h-4 w-4" />
            </button>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Category Name
                  </label>
            <input
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter category name"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { handleAddCategory(); setAddModalOpen(false); } }}
                    autoFocus
            />
                </div>
            <div className="flex justify-end gap-2">
              <button
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </button>
              <button
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => { handleAddCategory(); setAddModalOpen(false); }}
                disabled={!newCategory.trim()}
              >
                    Add Category
              </button>
                </div>
            </div>
          </div>
        </div>
      )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-3 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-gray-900">Delete Category</h3>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mb-3">
                  <div className="flex items-center mb-1.5">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-1.5" />
                    <p className="text-xs text-gray-700">
                      Are you sure you want to delete this category? This action cannot be undone.
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    All associated price options will also be deleted.
                  </p>
                </div>
                  <div className="flex justify-end gap-2">
                    <button
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                    onClick={() => setShowDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                    <button
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded"
                    onClick={() => {
                      handleDeleteCategory(showDeleteConfirm);
                      setShowDeleteConfirm(null);
                    }}
                  >
                    Delete Category
                    </button>
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* Price Options Modal */}
      {priceModalOpen && selectedCategory && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-3 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-medium text-gray-900">Price Options</h3>
                    <p className="text-[10px] text-gray-500">Manage pricing for {selectedCategory.name}</p>
                  </div>
            <button
              onClick={closePriceModal}
                    className="text-gray-400 hover:text-gray-600"
            >
                    <X className="h-4 w-4" />
            </button>
                </div>

                {/* Price Options List */}
                <div className="mb-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Current Price Options</h4>
                {priceLoading ? (
                      <div className="text-center py-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-xs text-gray-500">Loading price options...</p>
                      </div>
                ) : priceError ? (
                      <div className="text-center py-3">
                        <AlertCircle className="h-4 w-4 text-red-500 mx-auto mb-1.5" />
                        <p className="text-xs text-red-600">{priceError}</p>
                      </div>
                    ) : (priceOptions || []).length === 0 ? (
                      <div className="text-center py-3">
                        <p className="text-xs text-gray-500">No price options set</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {(priceOptions || []).map((option) => (
                          <div key={option.id} className="flex items-center justify-between bg-white rounded-lg p-2 border">
                            <div className="flex-1">
                              <span className="text-xs font-medium text-gray-900">{option.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">{option.value}</span>
                        <button
                                onClick={() => handleDeletePriceOption(option.id)}
                                className="text-red-600 hover:text-red-800 p-0.5"
                                title="Delete price option"
                        >
                                <Trash2 className="h-3.5 w-3.5" />
                        </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Add New Price Option */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Add New Price Option</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Label</label>
              <input
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="e.g., Small, Medium, Large"
                value={newPriceLabel}
                onChange={e => setNewPriceLabel(e.target.value)}
              />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-700 mb-1">Price</label>
              <input
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs"
                        placeholder="0.00"
                type="number"
                        step="0.01"
                value={newPriceValue}
                onChange={e => setNewPriceValue(e.target.value)}
              />
                    </div>
            </div>
            <div className="flex justify-end">
              <button
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAddPriceOption}
                disabled={!newPriceLabel.trim() || !newPriceValue || priceLoading}
              >
                Add Price Option
              </button>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end mt-3">
                  <button
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                    onClick={closePriceModal}
                  >
                    Close
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CategoriesPage; 