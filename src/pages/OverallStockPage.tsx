import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storeService } from '../services/storeService';
import { categoriesService } from '../services/financialService';
import { StockSummaryData } from '../services/storeService';
import { StoreInventory } from '../types/financial';

interface OverallStockStats {
  totalProducts: number;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  averageStockPerProduct: number;
}

const OverallStockPage: React.FC = () => {
  const [stockStats, setStockStats] = useState<OverallStockStats>({
    totalProducts: 0,
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    averageStockPerProduct: 0
  });
  const [storeInventory, setStoreInventory] = useState<StoreInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockSummaryData, setStockSummaryData] = useState<StockSummaryData | null>(null);
  const [stockSummaryCategoryFilter, setStockSummaryCategoryFilter] = useState<string>('all');
  const [stockSummarySearchTerm, setStockSummarySearchTerm] = useState<string>('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetchOverallStockData();
  }, []);

  const fetchOverallStockData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        inventoryResponse,
        stockSummaryResponse,
        categoriesResponse
      ] = await Promise.all([
        storeService.getAllStoresInventory(),
        storeService.getStockSummary(),
        categoriesService.getAll()
      ]);

      // Process inventory data
      if (inventoryResponse.success) {
        const inventory = inventoryResponse.data || [];
        setStoreInventory(inventory);

        // Calculate overall stock stats
        const uniqueProducts = new Set(inventory.map(item => item.product_id));
        const totalProducts = uniqueProducts.size;
        const totalItems = inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        const totalValue = inventory.reduce((sum, item) => {
          const value = Number(item.inventory_value);
          return sum + (isNaN(value) ? 0 : value);
        }, 0);
        
        // Group by product to find low/out of stock items
        const productStockMap = new Map<number, number>();
        inventory.forEach(item => {
          const currentStock = productStockMap.get(item.product_id) || 0;
          productStockMap.set(item.product_id, currentStock + (item.quantity || 0));
        });

        const productStocks = Array.from(productStockMap.values());
        const lowStockItems = productStocks.filter(stock => stock <= 10 && stock > 0).length;
        const outOfStockItems = productStocks.filter(stock => stock === 0).length;
        const averageStockPerProduct = totalProducts > 0 ? totalItems / totalProducts : 0;

        setStockStats({
          totalProducts,
          totalItems,
          totalValue,
          lowStockItems,
          outOfStockItems,
          averageStockPerProduct
        });
      }

      if (stockSummaryResponse.success) {
        setStockSummaryData(stockSummaryResponse.data || null);
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
      }

    } catch (err) {
      setError('Failed to fetch overall stock data');
      console.error('Overall stock data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'KES 0';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num === null || num === undefined || isNaN(num)) {
      return '0';
    }
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getFilteredStockSummary = () => {
    if (!stockSummaryData || !stockSummaryData.products) {
      return [];
    }

    let filteredProducts = stockSummaryData.products;

    // Apply category filter
    if (stockSummaryCategoryFilter !== 'all') {
      filteredProducts = filteredProducts.filter((product: any) =>
        product.category === stockSummaryCategoryFilter
      );
    }

    // Apply search filter
    if (stockSummarySearchTerm.trim()) {
      const searchLower = stockSummarySearchTerm.toLowerCase();
      filteredProducts = filteredProducts.filter((product: any) =>
        product.product_name?.toLowerCase().includes(searchLower) ||
        product.product_code?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      );
    }

    // Sort products by category alphabetically
    return filteredProducts.sort((a: any, b: any) => {
      const categoryA = a.category || '';
      const categoryB = b.category || '';
      return categoryA.localeCompare(categoryB);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-xs text-gray-600">Loading overall stock data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-red-200 rounded-xl p-3 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-xs font-semibold text-red-800">Error Loading Overall Stock</h3>
                <div className="mt-0.5 text-xs text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* Header Section */}
        <div className="mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h1 className="text-sm font-bold text-gray-900 mb-1">Overall Stock</h1>
              <p className="text-xs text-gray-600">Complete inventory overview across all stores</p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Link
                to="/store-inventory"
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Store Inventory
              </Link>

              <Link
                to="/update-stock-quantity"
                className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Update Stock
              </Link>

              <Link
                to="/stock-transfer"
                className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Stock Transfer
              </Link>

              <Link
                to="/inventory-transactions"
                className="inline-flex items-center px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Transactions
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-[10px] font-medium text-gray-600">Total Products</p>
                <p className="text-base font-bold text-gray-900">{formatNumber(stockStats.totalProducts)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-14 0h14" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-[10px] font-medium text-gray-600">Total Items</p>
                <p className="text-base font-bold text-gray-900">{formatNumber(stockStats.totalItems)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-[10px] font-medium text-gray-600">Total Value</p>
                <p className="text-base font-bold text-gray-900">{formatCurrency(stockStats.totalValue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-[10px] font-medium text-gray-600">Low Stock</p>
                <p className="text-base font-bold text-gray-900">{formatNumber(stockStats.lowStockItems)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-[10px] font-medium text-gray-600">Out of Stock</p>
                <p className="text-base font-bold text-gray-900">{formatNumber(stockStats.outOfStockItems)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-[10px] font-medium text-gray-600">Avg Stock/Product</p>
                <p className="text-base font-bold text-gray-900">{formatNumber(Math.round(stockStats.averageStockPerProduct))}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Summary Table */}
        {stockSummaryData && stockSummaryData.products.length > 0 && (
          <div className="mb-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <h2 className="text-xs font-bold text-gray-900">Overall Stock Summary Across All Stores</h2>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Bar */}
                    <div className="flex-shrink-0">
                      <label htmlFor="stock-summary-search" className="block text-[10px] font-medium text-gray-700 mb-1">
                        Search Products
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="stock-summary-search"
                          placeholder="Search by name, code, or category..."
                          value={stockSummarySearchTerm}
                          onChange={(e) => setStockSummarySearchTerm(e.target.value)}
                          className="block w-64 pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs"
                        />
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        {stockSummarySearchTerm && (
                          <button
                            onClick={() => setStockSummarySearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex-shrink-0">
                      <label htmlFor="stock-summary-category-filter" className="block text-[10px] font-medium text-gray-700 mb-1">
                        Filter by Category
                      </label>
                      <select
                        id="stock-summary-category-filter"
                        value={stockSummaryCategoryFilter}
                        onChange={(e) => setStockSummaryCategoryFilter(e.target.value)}
                        className="block w-64 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs px-2.5 py-1.5"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Count and Filter Indicators */}
              <div className={`px-3 py-2 border-b ${(stockSummaryCategoryFilter !== 'all' || stockSummarySearchTerm.trim()) ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {stockSummaryCategoryFilter !== 'all' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-purple-100 text-purple-800">
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                        </svg>
                        Category: {stockSummaryCategoryFilter}
                      </span>
                    )}
                    {stockSummarySearchTerm.trim() && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-blue-100 text-blue-800">
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search: "{stockSummarySearchTerm}"
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-600">
                    Showing {getFilteredStockSummary().length} of {stockSummaryData?.products?.length || 0} products
                  </div>
                </div>
              </div>

              {/* Table Content */}
              {getFilteredStockSummary().length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="mt-3 text-xs font-medium text-gray-900">No products found</h3>
                  <p className="mt-1.5 text-xs text-gray-500">
                    {stockSummarySearchTerm.trim() && stockSummaryCategoryFilter !== 'all'
                      ? `No products found for search "${stockSummarySearchTerm}" in category "${stockSummaryCategoryFilter}".`
                      : stockSummarySearchTerm.trim()
                        ? `No products found for search "${stockSummarySearchTerm}".`
                        : stockSummaryCategoryFilter !== 'all'
                          ? `No products found for category "${stockSummaryCategoryFilter}".`
                          : 'No products found in the stock summary.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                          Product
                        </th>
                        <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-600 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-600 uppercase tracking-wider">
                          Total Stock
                        </th>
                        {stockSummaryData.stores.map((store: any) => (
                          <th key={store.id} className="px-3 py-2 text-left text-[9px] font-semibold text-gray-600 uppercase tracking-wider">
                            {store.store_name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredStockSummary().map((product: any) => {
                        const totalStock = stockSummaryData.stores.reduce((total: number, store: any) => {
                          return total + (product.store_quantities[store.id] || 0);
                        }, 0);

                        return (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 sticky left-0 bg-white z-10">
                              {product.product_name}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-gray-100 text-gray-800">
                                {product.category || 'Uncategorized'}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-gray-900">
                              {formatNumber(totalStock)}
                            </td>
                            {stockSummaryData.stores.map((store: any) => {
                              const quantity = product.store_quantities[store.id] || 0;
                              return (
                                <td key={store.id} className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold ${quantity <= 10
                                      ? 'bg-red-100 text-red-800'
                                      : quantity <= 50
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                    {formatNumber(quantity)}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverallStockPage;

