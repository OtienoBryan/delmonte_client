import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar } from 'lucide-react';

interface ProductSaleData {
  id: number;
  product_name: string;
  product_code: string;
  category_name: string;
  total_quantity: number;
  total_amount: number;
  total_orders: number;
  average_price: number;
}

interface FilterState {
  startDate: string;
  endDate: string;
  category: string;
  searchQuery: string;
}

const ProductsSaleReportPage: React.FC = () => {
  const [products, setProducts] = useState<ProductSaleData[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductSaleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Get first and last day of current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [filters, setFilters] = useState<FilterState>({
    startDate: firstDayOfMonth,
    endDate: lastDayOfMonth,
    category: '',
    searchQuery: ''
  });

  // For modal temp state
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);

  useEffect(() => {
    fetchProductsSaleData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filters]);

  const fetchProductsSaleData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching products sale data...');
      console.log('Date range:', filters.startDate, 'to', filters.endDate);
      
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      const url = `/api/financial/products-sale-report?${params}`;
      console.log('API URL:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch products sale data`);
      }
      
      const data = await response.json();
      console.log('Products sale data received:', data);
      
      if (data.success) {
        console.log('Products data:', data.data);
        console.log('Number of products:', data.data?.length || 0);
        setProducts(data.data || []);
        
        // Extract unique categories for filter
        const uniqueCategories = Array.from(new Set(data.data.map((p: ProductSaleData) => p.category_name).filter(Boolean))) as string[];
        setCategories(uniqueCategories);
        console.log('Unique categories:', uniqueCategories);
      } else {
        throw new Error(data.error || 'Failed to fetch products sale data');
      }
    } catch (err: any) {
      console.error('Error fetching products sale data:', err);
      setError(err.message || 'Failed to fetch products sale data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Apply search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.product_name.toLowerCase().includes(query) ||
        product.product_code.toLowerCase().includes(query) ||
        product.category_name.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(product => product.category_name === filters.category);
    }

    setFilteredProducts(filtered);
  };

  const openFilterModal = () => {
    setTempFilters(filters);
    setShowFilterModal(true);
  };

  const closeFilterModal = () => setShowFilterModal(false);

  const applyFilterChanges = () => {
    setFilters(tempFilters);
    setShowFilterModal(false);
    fetchProductsSaleData(); // Refetch data with new date filters
  };

  const resetFilters = () => {
    const resetFilters: FilterState = {
      startDate: firstDayOfMonth,
      endDate: lastDayOfMonth,
      category: '',
      searchQuery: ''
    };
    setFilters(resetFilters);
    setTempFilters(resetFilters);
    setShowFilterModal(false);
    fetchProductsSaleData();
  };

  const exportToCSV = async () => {
    if (exporting) return;
    
    try {
      setExporting(true);
      
      const headers = [
        'Product Name', 
        'Product Code', 
        'Category', 
        'Total Quantity Sold', 
        'Total Amount', 
        'Total Orders', 
        'Average Price'
      ];
      
      const csvData = filteredProducts.map(product => [
        product.product_name,
        product.product_code,
        product.category_name,
        product.total_quantity,
        product.total_amount.toFixed(2),
        product.total_orders,
        product.average_price.toFixed(2)
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filterInfo = [];
      if (filters.startDate !== firstDayOfMonth) filterInfo.push(`From-${filters.startDate}`);
      if (filters.endDate !== lastDayOfMonth) filterInfo.push(`To-${filters.endDate}`);
      if (filters.category) filterInfo.push(`Category-${filters.category}`);
      
      const filterSuffix = filterInfo.length > 0 ? `-${filterInfo.join('-')}` : '';
      a.download = `products-sale-report-${dateStr}${filterSuffix}.csv`;
      
      a.click();
      window.URL.revokeObjectURL(url);
      
      console.log('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'KES' 
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products sale data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error</p>
          <p>{error}</p>
          <button
            onClick={fetchProductsSaleData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Products Sale Report</h1>
          <p className="mt-2 text-sm text-gray-700">
            Products sold from {filters.startDate} to {filters.endDate}
          </p>
          {/* Debug Info */}
          <div className="mt-4 p-4 bg-gray-100 rounded hidden">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info:</h3>
            <p className="text-xs text-gray-600">Total Products: {products.length}</p>
            <p className="text-xs text-gray-600">Filtered Products: {filteredProducts.length}</p>
            <p className="text-xs text-gray-600">Loading: {loading ? 'Yes' : 'No'}</p>
            <p className="text-xs text-gray-600">Error: {error || 'None'}</p>
            <p className="text-xs text-gray-600">Categories: {categories.length}</p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex gap-2">
          <button
            onClick={exportToCSV}
            disabled={exporting || filteredProducts.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
              placeholder="Search products by name, code, or category..."
            />
          </div>
        </div>
        <div className="sm:w-48">
          <button
            type="button"
            onClick={openFilterModal}
            className="flex items-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
          >
            <Filter className="h-4 w-4" />
            Filters
            {(() => {
              const activeFilters = [
                filters.startDate !== firstDayOfMonth,
                filters.endDate !== lastDayOfMonth,
                filters.category !== ''
              ].filter(Boolean).length;
              return activeFilters > 0 ? ` (${activeFilters})` : '';
            })()}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {filteredProducts.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">P</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatNumber(filteredProducts.length)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">Q</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Quantity</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatNumber(filteredProducts.reduce((sum, p) => sum + p.total_quantity, 0))}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">O</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatNumber(filteredProducts.reduce((sum, p) => sum + p.total_orders, 0))}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">$</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(filteredProducts.reduce((sum, p) => sum + p.total_amount, 0))}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg font-medium">No products found</p>
                <p className="mt-2">No products were sold in the selected date range.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Product Name</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Product Code</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantity Sold</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total Amount</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Orders</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Average Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                        {product.product_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {product.product_code}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {product.category_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {formatNumber(product.total_quantity)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                        {formatCurrency(product.total_amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {formatNumber(product.total_orders)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {formatCurrency(product.average_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Filter Products</h2>
              <button
                onClick={closeFilterModal}
                className="text-gray-400 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={tempFilters.startDate} 
                  onChange={e => setTempFilters({ ...tempFilters, startDate: e.target.value })} 
                  className="border rounded px-3 py-2 w-full focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={tempFilters.endDate} 
                  onChange={e => setTempFilters({ ...tempFilters, endDate: e.target.value })} 
                  className="border rounded px-3 py-2 w-full focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={tempFilters.category} 
                  onChange={e => setTempFilters({ ...tempFilters, category: e.target.value })} 
                  className="border rounded px-3 py-2 w-full focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reset
              </button>
              <button
                onClick={closeFilterModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancel
              </button>
              <button
                onClick={applyFilterChanges}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsSaleReportPage; 