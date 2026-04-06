import React, { useState, useEffect } from 'react';
import { merchandiseService, merchandiseCategoriesService } from '../services/merchandiseService';
import { storeService } from '../services/storeService';
import { staffService } from '../services/staffService';
import { Merchandise, MerchandiseCategory, MerchandiseStock, MerchandiseAssignment, CreateMerchandiseAssignment, MerchandiseLedger } from '../types/financial';
import { Staff } from '../services/staffService';
import { useAuth } from '../contexts/AuthContext';

const MerchandisePage: React.FC = () => {
  const { user } = useAuth();
  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [categories, setCategories] = useState<MerchandiseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Merchandise | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stores, setStores] = useState<{ id: number; store_name: string; store_code: string }[]>([]);
  const [currentStock, setCurrentStock] = useState<{ merchandise_id: number; store_id: number; quantity: number; merchandise_name: string; store_name: string }[]>([]);
  const [showCurrentStock, setShowCurrentStock] = useState(false);
  const [selectedStockStore, setSelectedStockStore] = useState<number | 'all'>('all');
  const [ledger, setLedger] = useState<MerchandiseLedger[]>([]);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedLedgerStore, setSelectedLedgerStore] = useState<number | 'all'>('all');
  const [selectedLedgerType, setSelectedLedgerType] = useState<string | 'all'>('all');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [assignments, setAssignments] = useState<MerchandiseAssignment[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);

  // Form states
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    description: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  const [stockForm, setStockForm] = useState({
    store_id: '',
    items: [{ merchandise_id: '', quantity: '', notes: '' }],
    general_notes: ''
  });

  const [assignmentForm, setAssignmentForm] = useState<CreateMerchandiseAssignment>({
    merchandise_id: 0,
    staff_id: 0,
    quantity_assigned: 0,
    date_assigned: new Date().toISOString().split('T')[0],
    comment: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data...', { currentPage, searchTerm, selectedCategory });
      
      const [merchandiseResponse, categoriesResponse, storesResponse, staffResponse] = await Promise.all([
        merchandiseService.getAll(currentPage, 10, searchTerm, selectedCategory === 'all' ? undefined : selectedCategory),
        merchandiseCategoriesService.getAll(),
        storeService.getAllStores(),
        staffService.getStaffList()
      ]);

      console.log('API Responses:', { merchandiseResponse, categoriesResponse, storesResponse, staffResponse });

      if (merchandiseResponse.success) {
        setMerchandise(merchandiseResponse.data);
        setTotalPages(merchandiseResponse.pagination?.total_pages || 1);
        setTotalItems(merchandiseResponse.pagination?.total_items || 0);
        console.log('Merchandise data set:', merchandiseResponse.data);
        console.log('Merchandise IDs available:', merchandiseResponse.data.map(item => ({ id: item.id, name: item.name })));
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
        console.log('Categories data set:', categoriesResponse.data);
      }

      if (storesResponse.success) {
        setStores(storesResponse.data || []);
        console.log('Stores data set:', storesResponse.data);
      }

      if (staffResponse) {
        setStaff(staffResponse);
        console.log('Staff data set:', staffResponse);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
      console.log('Loading finished, current state:', { merchandise: merchandise.length, categories: categories.length, stores: stores.length });
    }
  };

  const fetchCurrentStock = async () => {
    try {
      const response = await merchandiseService.getCurrentStock();
      if (response.success) {
        setCurrentStock(response.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch current stock');
    }
  };

  const getFilteredCurrentStock = () => {
    if (selectedStockStore === 'all') {
      return currentStock;
    }
    return currentStock.filter(item => item.store_id === selectedStockStore);
  };

  const fetchLedger = async () => {
    try {
      const response = await merchandiseService.getLedger();
      if (response.success) {
        setLedger(response.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch ledger');
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await merchandiseService.getAssignments();
      if (response.success) {
        setAssignments(response.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch assignments');
    }
  };

  const getFilteredLedger = () => {
    let filtered = ledger;
    
    if (selectedLedgerStore !== 'all') {
      filtered = filtered.filter(item => item.store_id === selectedLedgerStore);
    }
    
    if (selectedLedgerType !== 'all') {
      filtered = filtered.filter(item => item.transaction_type === selectedLedgerType);
    }
    
    return filtered;
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCategoryForm({ ...categoryForm, [e.target.name]: e.target.value });
  };

  const handleStockFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setStockForm({ ...stockForm, [e.target.name]: e.target.value });
  };

  const handleStockItemChange = (index: number, field: string, value: string) => {
    const newItems = [...stockForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setStockForm({ ...stockForm, items: newItems });
  };

  const handleAssignmentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'merchandise_id' || name === 'staff_id' || name === 'quantity_assigned') {
      setAssignmentForm(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    } else {
      setAssignmentForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const addStockItem = () => {
    setStockForm({
      ...stockForm,
      items: [...stockForm.items, { merchandise_id: '', quantity: '', notes: '' }]
    });
  };

  const removeStockItem = (index: number) => {
    if (stockForm.items.length > 1) {
      const newItems = stockForm.items.filter((_, i) => i !== index);
      setStockForm({ ...stockForm, items: newItems });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        category_id: Number(form.category_id)
      };

      if (editingItem) {
        await merchandiseService.update(editingItem.id, payload);
      } else {
        await merchandiseService.create(payload);
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save merchandise');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await merchandiseCategoriesService.create(categoryForm);
      setShowCategoryModal(false);
      setCategoryForm({ name: '', description: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create category');
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Filter out empty items
      const validItems = stockForm.items.filter(item => 
        item.merchandise_id && item.quantity
      );

      if (validItems.length === 0) {
        setError('Please add at least one merchandise item');
        return;
      }

      const payload = {
        store_id: Number(stockForm.store_id),
        items: validItems.map(item => ({
          merchandise_id: Number(item.merchandise_id),
          quantity: Number(item.quantity),
          notes: item.notes || undefined
        })),
        general_notes: stockForm.general_notes || undefined
      };

      await merchandiseService.addBulkStock(payload);
      setShowStockModal(false);
      resetStockForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add stock');
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Assignment form data:', assignmentForm);
      
      if (assignmentForm.merchandise_id <= 0 || assignmentForm.staff_id <= 0 || assignmentForm.quantity_assigned <= 0) {
        setError('Please fill in all required fields');
        return;
      }

      console.log('Sending assignment data:', assignmentForm);
      await merchandiseService.createAssignment(assignmentForm);
      setShowAssignmentModal(false);
      resetAssignmentForm();
      fetchAssignments();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create assignment');
    }
  };

  const handleEdit = (item: Merchandise) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category_id: item.category_id.toString(),
      description: item.description || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await merchandiseService.delete(id);
        fetchData();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete item');
      }
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await merchandiseService.deleteAssignment(id);
        fetchAssignments();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete assignment');
      }
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      category_id: '',
      description: ''
    });
  };

  const resetStockForm = () => {
    setStockForm({
      store_id: '',
      items: [{ merchandise_id: '', quantity: '', notes: '' }],
      general_notes: ''
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      merchandise_id: 0,
      staff_id: 0,
      quantity_assigned: 0,
      date_assigned: new Date().toISOString().split('T')[0],
      comment: ''
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openStockModal = () => {
    resetStockForm();
    setShowStockModal(true);
  };

  const openAssignmentModal = () => {
    resetAssignmentForm();
    setShowAssignmentModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowCategoryModal(false);
    setShowStockModal(false);
    setShowCurrentStock(false);
    setShowLedgerModal(false);
    setShowAssignmentModal(false);
    setShowAssignmentsModal(false);
    setSelectedStockStore('all');
    setSelectedLedgerStore('all');
    setSelectedLedgerType('all');
    setEditingItem(null);
    resetForm();
    resetStockForm();
    resetAssignmentForm();
  };

  if (loading && merchandise.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading merchandise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Merchandise Management</h1>
          <p className="mt-2 text-gray-600">Manage your merchandise inventory including t-shirts, displays, caps, and more</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right font-bold text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Debug Info */}
        <div className="mb-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <p>Debug: Loading: {loading.toString()}, Merchandise: {merchandise.length}, Categories: {categories.length}, Stores: {stores.length}</p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <input
              type="text"
              placeholder="Search merchandise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Add Category
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Add Merchandise
            </button>
            <button
              onClick={openStockModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Receive Stock
            </button>
            <button
              onClick={openAssignmentModal}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Assign to Staff
            </button>
            <button
              onClick={() => {
                setShowAssignmentsModal(!showAssignmentsModal);
                if (!showAssignmentsModal) {
                  fetchAssignments();
                }
              }}
              className={`px-4 py-2 rounded-md transition-colors ${
                showAssignmentsModal 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              {showAssignmentsModal ? 'Hide' : 'View'} Assignments
            </button>
            <button
              onClick={openAssignmentModal}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Assign to Staff
            </button>
            <button
              onClick={() => {
                setShowAssignmentsModal(!showAssignmentsModal);
                if (!showAssignmentsModal) {
                  fetchAssignments();
                }
              }}
              className={`px-4 py-2 rounded-md transition-colors ${
                showAssignmentsModal 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              {showAssignmentsModal ? 'Hide' : 'View'} Assignments
            </button>
                         <button
               onClick={() => {
                 setShowCurrentStock(!showCurrentStock);
                 if (!showCurrentStock) {
                   fetchCurrentStock();
                 }
               }}
               className={`px-4 py-2 rounded-md transition-colors ${
                 showCurrentStock 
                   ? 'bg-gray-600 text-white hover:bg-gray-700' 
                   : 'bg-purple-600 text-white hover:bg-purple-700'
               }`}
             >
               {showCurrentStock ? 'Hide' : 'View'} Current Stock
             </button>
             <button
               onClick={() => {
                 setShowLedgerModal(!showLedgerModal);
                 if (!showLedgerModal) {
                   fetchLedger();
                 }
               }}
               className={`px-4 py-2 rounded-md transition-colors ${
                 showLedgerModal 
                   ? 'bg-gray-600 text-white hover:bg-gray-700' 
                   : 'bg-orange-600 text-white hover:bg-orange-700'
               }`}
             >
               {showLedgerModal ? 'Hide' : 'View'} Ledger
             </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-4 flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></div>
            <span className="text-sm text-gray-600">Loading merchandise...</span>
          </div>
        )}

        {/* Merchandise Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mr-2"></div>
                        Loading merchandise...
                      </div>
                    </td>
                  </tr>
                ) : merchandise.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                      <div className="text-center">
                        <p className="text-gray-500 mb-2">No merchandise found</p>
                        <p className="text-xs text-gray-400">Click "Add Merchandise" to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  merchandise.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {categories.find(c => c.id === item.category_id)?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {item.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * 10, totalItems)}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-green-50 border-green-500 text-green-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>



        {/* Add/Edit Merchandise Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingItem ? 'Edit Merchandise' : 'Add New Merchandise'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      name="category_id"
                      value={form.category_id}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      {editingItem ? 'Update' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModals}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h3>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                    <input
                      type="text"
                      name="name"
                      value={categoryForm.name}
                      onChange={handleCategoryFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                      name="description"
                      value={categoryForm.description}
                      onChange={handleCategoryFormChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Add Category
                    </button>
                    <button
                      type="button"
                      onClick={closeModals}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Receive Stock Modal */}
        {showStockModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Receive Merchandise Stock</h3>
                <form onSubmit={handleStockSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                    <select
                      name="store_id"
                      value={stockForm.store_id}
                      onChange={handleStockFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select store</option>
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>{store.store_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Merchandise Items</label>
                      <button
                        type="button"
                        onClick={addStockItem}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        + Add Item
                      </button>
                    </div>
                    
                    {stockForm.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-3 mb-3">
                        <div className="flex gap-3 mb-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Item</label>
                            <select
                              value={item.merchandise_id}
                              onChange={(e) => handleStockItemChange(index, 'merchandise_id', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              required
                            >
                              <option value="">Select merchandise item</option>
                              {merchandise.map(merchItem => (
                                <option key={merchItem.id} value={merchItem.id}>{merchItem.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-24">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleStockItemChange(index, 'quantity', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              min="1"
                              required
                            />
                          </div>
                          <div className="w-8 flex items-end">
                            {stockForm.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeStockItem(index)}
                                className="px-2 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                                title="Remove item"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Item Notes (Optional)</label>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => handleStockItemChange(index, 'notes', e.target.value)}
                            placeholder="Specific notes for this item"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">General Notes (Optional)</label>
                    <textarea
                      name="general_notes"
                      value={stockForm.general_notes}
                      onChange={handleStockFormChange}
                      rows={3}
                      placeholder="Notes that apply to all items in this receipt"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Receive {stockForm.items.length} Item{stockForm.items.length !== 1 ? 's' : ''}
                    </button>
                    <button
                      type="button"
                      onClick={closeModals}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Current Stock Modal */}
        {showCurrentStock && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-[1200px] shadow-lg rounded-md bg-white">
              <div className="mt-3">
                                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-medium text-gray-900">Current Stock Levels</h3>
                   <button
                     onClick={() => setShowCurrentStock(false)}
                     className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                   >
                     ×
                   </button>
                 </div>
                 <p className="text-sm text-gray-600 mb-4">Real-time inventory across all stores</p>
                 
                 {/* Store Filter */}
                 <div className="mb-4">
                   <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Store</label>
                   <select
                     value={selectedStockStore}
                     onChange={(e) => setSelectedStockStore(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                     className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                   >
                     <option value="all">All Stores</option>
                     {stores.map(store => (
                       <option key={store.id} value={store.id}>{store.store_name}</option>
                     ))}
                   </select>
                 </div>
                
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchandise</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                                         <tbody className="bg-white divide-y divide-gray-200">
                       {getFilteredCurrentStock().map((item, index) => (
                         <tr key={index} className="hover:bg-gray-50">
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                             {item.merchandise_name}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                             {item.store_name}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                             <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                               item.quantity > 10 
                                 ? 'bg-green-100 text-green-800' 
                                 : item.quantity > 0 
                                 ? 'bg-yellow-100 text-yellow-800' 
                                 : 'bg-red-600 text-red-800'
                             }`}>
                               {item.quantity}
                             </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                             {item.quantity > 10 
                               ? 'In Stock' 
                               : item.quantity > 0 
                               ? 'Low Stock' 
                               : 'Out of Stock'
                             }
                           </td>
                         </tr>
                       ))}
                       {getFilteredCurrentStock().length === 0 && (
                         <tr>
                           <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                             {currentStock.length === 0 ? 'No stock records found' : 'No stock records for selected store'}
                           </td>
                         </tr>
                       )}
                     </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowCurrentStock(false)}
                    className="px-4 py-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
                     </div>
         )}

         {/* Ledger Modal */}
         {showLedgerModal && (
           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
             <div className="relative top-10 mx-auto p-6 border w-[1400px] shadow-lg rounded-md bg-white">
               <div className="mt-3">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-medium text-gray-900">Merchandise Ledger</h3>
                   <button
                     onClick={() => setShowLedgerModal(false)}
                     className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                   >
                     ×
                   </button>
                 </div>
                 <p className="text-sm text-gray-600 mb-4">Complete audit trail of all inventory movements</p>
                 
                 {/* Filters */}
                 <div className="mb-4 flex gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Store</label>
                     <select
                       value={selectedLedgerStore}
                       onChange={(e) => setSelectedLedgerStore(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                       className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     >
                       <option value="all">All Stores</option>
                       {stores.map(store => (
                         <option key={store.id} value={store.id}>{store.store_name}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Transaction Type</label>
                     <select
                       value={selectedLedgerType}
                       onChange={(e) => setSelectedLedgerType(e.target.value)}
                       className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     >
                       <option value="all">All Types</option>
                       <option value="RECEIVE">Receive</option>
                       <option value="ISSUE">Issue</option>
                       <option value="ADJUSTMENT">Adjustment</option>
                       <option value="TRANSFER">Transfer</option>
                     </select>
                   </div>
                 </div>
                 
                 <div className="overflow-x-auto max-h-[600px]">
                   <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50 sticky top-0">
                       <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchandise</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance After</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {getFilteredLedger().map((item, index) => (
                         <tr key={index} className="hover:bg-gray-50">
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                             {new Date(item.created_at).toLocaleDateString()}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                             {item.merchandise?.name || 'Unknown'}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                             {item.store?.store_name || 'Unknown'}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                             <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                               item.transaction_type === 'RECEIVE' 
                                 ? 'bg-green-100 text-green-800' 
                                 : item.transaction_type === 'ISSUE'
                                 ? 'bg-red-100 text-red-800'
                                 : item.transaction_type === 'ADJUSTMENT'
                                 ? 'bg-yellow-100 text-yellow-800'
                                 : 'bg-blue-100 text-blue-800'
                             }`}>
                               {item.transaction_type}
                             </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                             <span className={`font-medium ${
                               item.transaction_type === 'RECEIVE' ? 'text-green-600' : 'text-red-600'
                             }`}>
                               {item.transaction_type === 'RECEIVE' ? '+' : ''}{item.quantity}
                             </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                             <span className="font-medium">{item.balance_after}</span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                             {item.reference_type}
                           </td>
                           <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                             {item.notes || '-'}
                           </td>
                         </tr>
                       ))}
                       {getFilteredLedger().length === 0 && (
                         <tr>
                           <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                             {ledger.length === 0 ? 'No ledger records found' : 'No ledger records match the selected filters'}
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>

                 <div className="mt-6 flex justify-end">
                   <button
                     onClick={() => setShowLedgerModal(false)}
                     className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                   >
                     Close
                   </button>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Assignment Modal */}
         {showAssignmentModal && (
           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
             <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
               <div className="mt-3">
                 <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Merchandise to Staff</h3>
                 <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Merchandise Item</label>
                     <select
                       name="merchandise_id"
                       value={assignmentForm.merchandise_id || ''}
                       onChange={handleAssignmentFormChange}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                       required
                     >
                       <option value="">Select merchandise item</option>
                       {merchandise.map(item => (
                         <option key={item.id} value={item.id}>{item.name}</option>
                       ))}
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                     <select
                       name="staff_id"
                       value={assignmentForm.staff_id || ''}
                       onChange={handleAssignmentFormChange}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                       required
                     >
                       <option value="">Select staff member</option>
                                               {staff.map(staffMember => (
                          <option key={staffMember.id} value={staffMember.id}>
                            {staffMember.name} ({staffMember.empl_no})
                          </option>
                        ))}
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Assigned</label>
                     <input
                       type="number"
                       name="quantity_assigned"
                       value={assignmentForm.quantity_assigned || ''}
                       onChange={handleAssignmentFormChange}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                       min="1"
                       required
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Date Assigned</label>
                     <input
                       type="date"
                       name="date_assigned"
                       value={assignmentForm.date_assigned}
                       onChange={handleAssignmentFormChange}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                       required
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Comment (Optional)</label>
                     <textarea
                       name="comment"
                       value={assignmentForm.comment || ''}
                       onChange={handleAssignmentFormChange}
                       rows={3}
                       placeholder="Additional notes about this assignment"
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                     />
                   </div>

                   <div className="flex gap-3 pt-4">
                     <button
                       type="submit"
                       className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                     >
                       Assign Merchandise
                     </button>
                     <button
                       type="button"
                       onClick={closeModals}
                       className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                     >
                       Cancel
                     </button>
                   </div>
                 </form>
               </div>
             </div>
           </div>
         )}

         {/* View Assignments Modal */}
         {showAssignmentsModal && (
           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
             <div className="relative top-10 mx-auto p-6 border w-[1200px] shadow-lg rounded-md bg-white">
               <div className="mt-3">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-medium text-gray-900">Merchandise Assignments</h3>
                   <button
                     onClick={() => setShowAssignmentsModal(false)}
                     className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                   >
                     ×
                   </button>
                 </div>
                 <p className="text-sm text-gray-600 mb-4">Track all merchandise assigned to staff members</p>
                 
                 <div className="overflow-x-auto max-h-[600px]">
                   <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50 sticky top-0">
                       <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Assigned</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchandise</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {assignments.map((assignment, index) => (
                         <tr key={index} className="hover:bg-gray-50">
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                             {new Date(assignment.date_assigned).toLocaleDateString()}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                             {assignment.merchandise?.name || 'Unknown'}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                             {assignment.staff?.name || 'Unknown'} ({assignment.staff?.empl_no || 'N/A'})
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                             <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                               {assignment.quantity_assigned}
                             </span>
                           </td>
                           <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                             {assignment.comment || '-'}
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                             <button
                               onClick={() => handleDeleteAssignment(assignment.id)}
                               className="text-red-600 hover:text-red-900"
                             >
                               Delete
                             </button>
                           </td>
                         </tr>
                       ))}
                       {assignments.length === 0 && (
                         <tr>
                           <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                             No assignments found
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>

                 <div className="mt-6 flex justify-end">
                   <button
                     onClick={() => setShowAssignmentsModal(false)}
                     className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
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

export default MerchandisePage;
