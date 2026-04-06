import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storeService } from '../services/storeService';
import { StoreInventory, StoreInventorySummary, Product } from '../types/financial';
import { inventoryAsOfService, categoriesService, productsService } from '../services/financialService';

const StoreInventoryPage: React.FC = () => {
  const [inventorySummary, setInventorySummary] = useState<StoreInventorySummary[]>([]);
  const [allInventory, setAllInventory] = useState<StoreInventory[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [stores, setStores] = useState<{ id: number; store_name: string; store_code: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [asOfInventory, setAsOfInventory] = useState<any[] | null>(null);
  const [stockSummaryData, setStockSummaryData] = useState<any>(null);
  const [stockSummaryCategoryFilter, setStockSummaryCategoryFilter] = useState<string>('all');
  const [showStoreOverview, setShowStoreOverview] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(20);
  const [sortField, setSortField] = useState<string>('category');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [inTransitProducts, setInTransitProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Set Delta Corner as default store when stores are loaded
  useEffect(() => {
    if (stores.length > 0) {
      console.log('Available stores:', stores);
      const deltaCornerStore = stores.find(store => 
        store.store_name.toLowerCase().includes('delta corner') || 
        store.store_code.toLowerCase().includes('delta')
      );
      console.log('Delta Corner store found:', deltaCornerStore);
      if (deltaCornerStore) {
        setSelectedStore(deltaCornerStore.id);
      } else {
        // If Delta Corner not found, select the first available store
        console.log('Delta Corner not found, selecting first store:', stores[0]);
        setSelectedStore(stores[0].id);
      }
    }
  }, [stores]);

  useEffect(() => {
    if (allInventory.length > 0 && stores.length > 0) {
      console.log('stores:', stores);
      console.log('allInventory:', allInventory);
      allInventory.forEach(item => {
        const found = stores.find(s => Number(s.id) === Number(item.store_id));
        if (!found) {
          console.log('No match for store_id:', item.store_id);
        }
      });
    }
  }, [stores, allInventory]);

  useEffect(() => {
    if (selectedDate) {
      fetchInventoryAsOf(selectedDate, selectedStore);
    } else {
      setAsOfInventory(null);
    }
  }, [selectedDate, selectedStore]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStore, selectedCategory, selectedDate]);

  // Reset to first page when sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortField, sortDirection]);

  const fetchInventoryAsOf = async (date: string, store: number | 'all') => {
    try {
      const params: any = { date };
      if (store !== 'all') params.store_id = store;
      const response = await inventoryAsOfService.getAll(params);
      if (response.success && response.data) {
        setAsOfInventory(response.data);
      } else {
        setAsOfInventory([]);
      }
    } catch {
      setAsOfInventory([]);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch inventory summary
      const summaryResponse = await storeService.getInventorySummaryByStore();
      if (summaryResponse.success) {
        setInventorySummary(summaryResponse.data || []);
      }

      // Fetch all stores
      const storesResponse = await storeService.getAllStores();
      if (storesResponse.success) {
        setStores(storesResponse.data || []);
      }

      // Fetch all inventory
      const inventoryResponse = await storeService.getAllStoresInventory();
      if (inventoryResponse.success) {
        setAllInventory(inventoryResponse.data || []);
      }

      // Fetch all categories
      const categoriesResponse = await categoriesService.getAll();
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
      }

      // Fetch all products
      const productsResponse = await productsService.getAll();
      if (productsResponse.success) {
        setProducts(productsResponse.data || []);
      }

      // Fetch stock summary data
      const stockSummaryResponse = await storeService.getStockSummary();
      if (stockSummaryResponse.success) {
        setStockSummaryData(stockSummaryResponse.data);
      }

      // Fetch in-transit products
      const inTransitResponse = await storeService.getInTransitProducts();
      if (inTransitResponse.success) {
        setInTransitProducts(inTransitResponse.data || []);
      }
    } catch (err) {
      setError('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredInventory = () => {
    let filtered = asOfInventory || allInventory;
    console.log('Initial filtered data:', filtered.length, 'items');
    console.log('Selected store:', selectedStore);
    console.log('Selected category:', selectedCategory);
    
    // Filter by store
    if (selectedStore !== 'all') {
      const beforeStoreFilter = filtered.length;
      filtered = filtered.filter(item => Number(item.store_id) === Number(selectedStore));
      console.log(`After store filter (${selectedStore}): ${beforeStoreFilter} -> ${filtered.length} items`);
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      const beforeCategoryFilter = filtered.length;
      filtered = filtered.filter(item => item.category === selectedCategory);
      console.log(`After category filter (${selectedCategory}): ${beforeCategoryFilter} -> ${filtered.length} items`);
    }
    
    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      // Convert to string for comparison if needed
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    console.log('Final filtered data:', filtered.length, 'items');
    return filtered;
  };

  const getFilteredStockSummary = () => {
    if (!stockSummaryData || !stockSummaryData.products) {
      return [];
    }
    
    if (stockSummaryCategoryFilter === 'all') {
      return stockSummaryData.products;
    }
    
    return stockSummaryData.products.filter((product: any) => 
      product.category === stockSummaryCategoryFilter
    );
  };

  const getStoreName = (storeId: number) => {
    const store = stores.find(s => Number(s.id) === Number(storeId));
    return store ? store.store_name : 'Unknown Store';
  };

  const getInTransitQuantity = (productId: number) => {
    const inTransitProduct = inTransitProducts.find(item => item.product_id === productId);
    return inTransitProduct ? inTransitProduct.in_transit_quantity : 0;
  };

  const number_format = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getLowStockItems = () => {
    return getFilteredInventory().filter(item => item.quantity <= 10);
  };

  const getTotalInventoryValue = () => {
    return getFilteredInventory().reduce((total, item) => {
      return total + (Number(item.inventory_value) || 0);
    }, 0);
  };

  const getTotalItems = () => {
    return getFilteredInventory().reduce((total, item) => {
      return total + (Number(item.quantity) || 0);
    }, 0);
  };

  const getTotalProducts = () => {
    return new Set(getFilteredInventory().map(item => item.product_id)).size;
  };

  // Pagination functions
  const getPaginatedInventory = () => {
    const filtered = getFilteredInventory();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(getFilteredInventory().length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < getTotalPages()) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-xs text-gray-600 font-medium">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 shadow-lg">
            <div className="flex items-center">
              <div className="p-1.5 bg-red-100 rounded-xl mr-3">
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-red-800">Error Loading Data</h3>
                <div className="mt-0.5 text-xs text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredInventory = getFilteredInventory();
  const paginatedInventory = getPaginatedInventory();
  const lowStockItems = getLowStockItems();
  const totalPages = getTotalPages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
         
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            <div>
                <h1 className="text-sm font-bold text-gray-900">Store Inventory</h1>
                <p className="mt-1 text-xs text-gray-600">
                  Track inventory levels across all stores with real-time insights
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Link
                to="/update-stock-quantity"
                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Update Stock
              </Link>
              <Link
                to="/stock-transfer"
                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Stock Transfer
              </Link>
              <Link
                to="/stock-take"
                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Stock Take
              </Link>
              <Link
                to="/inventory-transactions"
                className="inline-flex items-center px-3 py-1.5 border-2 border-indigo-300 text-indigo-700 text-xs font-semibold rounded-xl hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Transactions
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-600">Total Products</p>
                <p className="text-base font-bold text-blue-600">{getTotalProducts().toLocaleString()}</p>
                    </div>
              <div className="p-2 bg-blue-100 rounded-xl">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                    </div>
                  </div>
                </div>

          <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-600">Total Items</p>
                <p className="text-base font-bold text-green-600">{getTotalItems().toLocaleString()}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-xl">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-600">Total Value</p>
                <p className="text-base font-bold text-purple-600">{getTotalInventoryValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              
            </div>
            </div>

          <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-gray-600">Low Stock Items</p>
                <p className="text-base font-bold text-red-600">{lowStockItems.length.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-xl">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
                </div>
              </div>

        {/* Store Overview Button */}
        {selectedStore === 'all' && inventorySummary.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowStoreOverview(true)}
              className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              View Store Overview
            </button>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100 mb-4">
          <div className="flex items-center mb-3">
            <div className="p-1.5 bg-indigo-100 rounded-xl mr-2">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </div>
            <h2 className="text-xs font-bold text-gray-900">Filters & Search</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
              <label htmlFor="store-filter" className="block text-[10px] font-semibold text-gray-700 mb-1.5">
                Store
            </label>
            <select
              id="store-filter"
              value={selectedStore}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedStore(value === 'all' ? 'all' : Number(value));
              }}
                className="block w-full border-2 border-gray-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            >
              <option value="all">All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.store_name} ({store.store_code})
                </option>
              ))}
            </select>
          </div>
            
          <div>
              <label htmlFor="category-filter" className="block text-[10px] font-semibold text-gray-700 mb-1.5">
                Category
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedCategory(value);
              }}
                className="block w-full border-2 border-gray-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

            <div>
              <label htmlFor="date-filter" className="block text-[10px] font-semibold text-gray-700 mb-1.5">
                As of Date
            </label>
            <input
              id="date-filter"
              type="date"
                className="block w-full border-2 border-gray-200 rounded-xl px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

          {/* Active Filters */}
          <div className="mt-3 flex flex-wrap gap-2">
          {selectedStore !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 text-[9px] font-semibold rounded-full">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              Store: {getStoreName(selectedStore as number)}
            </span>
          )}
          {selectedCategory !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-800 text-[9px] font-semibold rounded-full">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              Category: {selectedCategory}
            </span>
          )}
            {selectedDate && (
              <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 text-[9px] font-semibold rounded-full">
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date: {new Date(selectedDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-1.5 bg-green-100 rounded-xl mr-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-xs font-bold text-gray-900">Inventory Details</h2>
              </div>
              <div className="text-[10px] text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredInventory.length)} of {filteredInventory.length} items
              </div>
            </div>
          </div>

        {filteredInventory.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              </div>
              <h3 className="text-xs font-medium text-gray-900 mb-1.5">No inventory found</h3>
              <p className="text-xs text-gray-500">
                {selectedStore === 'all' 
                  ? 'No inventory items found across all stores.' 
                  : 'No inventory items found for the selected store.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {selectedStore === 'all' && (
                      <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-600 uppercase tracking-wider">
                        Store
                      </th>
                    )}
                    <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th 
                      className="px-3 py-2 text-left text-[9px] font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Category</span>
                        {sortField === 'category' && (
                          <div className="flex flex-col">
                            <svg 
                              className={`w-2.5 h-2.5 ${sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            <svg 
                              className={`w-2.5 h-2.5 ${sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {sortField !== 'category' && (
                          <svg className="w-2.5 h-2.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-600 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-600 uppercase tracking-wider">
                      In Transit
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-600 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-600 uppercase tracking-wider">
                      Cost Price
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-600 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedInventory.map((item) => (
                    <tr key={`${item.store_id}-${item.product_id}`} className="hover:bg-gray-50 transition-colors duration-150">
                      {selectedStore === 'all' && (
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-1.5 bg-blue-100 rounded-lg mr-2">
                              <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-gray-900">{getStoreName(item.store_id)}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-1.5 bg-green-100 rounded-lg mr-2">
                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-900">{item.product_name}</div>
                            <div className="text-[10px] text-gray-500">{item.product_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-gray-100 text-gray-800">
                        {item.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.quantity <= 10 
                            ? 'bg-red-100 text-red-800' 
                            : item.quantity <= 50 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.quantity.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {(() => {
                          const inTransitQty = getInTransitQuantity(item.product_id);
                          return inTransitQty > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {inTransitQty.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {item.unit_of_measure}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {item.cost_price ? (item.cost_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-xs font-semibold text-gray-900">
                                                     {item.inventory_value ? (item.inventory_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredInventory.length > itemsPerPage && (
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1.5">
                  {/* Previous Button */}
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors duration-200 ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors duration-200 ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors duration-200 ${
                      currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Store Overview Modal */}
      {showStoreOverview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <div className="flex items-center">
                <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-xs font-bold text-gray-900">Store Overview</h2>
              </div>
              <button
                onClick={() => setShowStoreOverview(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-3 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {inventorySummary.map((store) => (
                  <div key={store.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-3 border border-blue-100 hover:shadow-xl transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span className="text-[9px] font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full shadow-sm">
                        {store.store_code}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-3">{store.store_name}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-white rounded-xl shadow-sm">
                        <span className="text-[10px] text-gray-600">Products</span>
                        <span className="text-xs font-semibold text-blue-600">{store.total_products.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-xl shadow-sm">
                        <span className="text-[10px] text-gray-600">Items</span>
                        <span className="text-xs font-semibold text-green-600">{(store.total_items || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white rounded-xl shadow-sm">
                        <span className="text-[10px] text-gray-600">Value</span>
                        <span className="text-xs font-semibold text-purple-600">
                          {(store.total_inventory_value || 0).toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowStoreOverview(false)}
                className="px-3 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreInventoryPage; 