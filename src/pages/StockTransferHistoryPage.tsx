import React, { useEffect, useState } from 'react';
import { stockTransferService, productsService } from '../services/financialService';
import axios from 'axios';
import StockTransferPage from './StockTransferPage';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Store, 
  Package, 
  ArrowRight, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Eye,
  Clock,
  User,
  FileText,
  Tag
} from 'lucide-react';

const StockTransferHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    from_store_id: '',
    to_store_id: '',
    product_id: '',
    start_date: '',
    end_date: '',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(7);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalTransfers: 0,
    totalQuantity: 0,
    uniqueProducts: 0,
    uniqueStores: 0
  });

  useEffect(() => {
    fetchStores();
    fetchProducts();
    fetchHistory();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, [filters, page, pageSize]);

  const fetchStores = async () => {
    const res = await axios.get('/api/financial/stores');
    if (res.data.success) setStores(res.data.data);
  };
  
  const fetchProducts = async () => {
    const res = await axios.get('/api/financial/products');
    if (res.data.success) setProducts(res.data.data);
  };
  
  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filters.from_store_id) params.from_store_id = filters.from_store_id;
      if (filters.to_store_id) params.to_store_id = filters.to_store_id;
      if (filters.product_id) params.product_id = filters.product_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.search) params.search = filters.search;
      params.page = page;
      params.limit = pageSize;
      
      const res = await stockTransferService.getHistory(params);
      if (res.success && res.data) {
        setHistory(res.data);
        if (res.pagination && res.pagination.totalPages) setTotalPages(res.pagination.totalPages);
        else setTotalPages(1);
        
        // Use server-calculated stats if available (more accurate for filtered data)
        if (res.stats) {
          let uniqueStores = res.stats.uniqueStores || 0;
          
          // If uniqueStores is 0 but we have data, calculate from current page data
          // (This happens when search filter is used - server doesn't calculate unique stores for performance)
          if (uniqueStores === 0 && res.data.length > 0) {
            const storesSet = new Set();
            res.data.forEach((item: any) => {
              if (item.from_store_id) storesSet.add(item.from_store_id);
              if (item.to_store_id) storesSet.add(item.to_store_id);
            });
            uniqueStores = storesSet.size;
          }
          
          setStats({
            totalTransfers: res.stats.totalTransfers || res.pagination?.total || res.data.length,
            totalQuantity: res.stats.totalQuantity || 0,
            uniqueProducts: res.stats.uniqueProducts || 0,
            uniqueStores: uniqueStores
          });
        } else {
          // Fallback to client-side calculation
          calculateStats(res.data);
        }
      } else {
        setHistory([]);
        setTotalPages(1);
        setStats({ totalTransfers: 0, totalQuantity: 0, uniqueProducts: 0, uniqueStores: 0 });
      }
    } catch (err) {
      setError('Failed to fetch transfer history');
      setHistory([]);
      setTotalPages(1);
      setStats({ totalTransfers: 0, totalQuantity: 0, uniqueProducts: 0, uniqueStores: 0 });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: any[]) => {
    const totalQuantity = data.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const uniqueProducts = new Set(data.map(item => item.product_id)).size;
    const uniqueStores = new Set([...data.map(item => item.from_store_id), ...data.map(item => item.to_store_id)]).size;
    
    setStats({
      totalTransfers: data.length,
      totalQuantity,
      uniqueProducts,
      uniqueStores
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
    setPage(1); // Reset to first page when search changes
  };

  const clearFilters = () => {
    setFilters({
      from_store_id: '',
      to_store_id: '',
      product_id: '',
      start_date: '',
      end_date: '',
      search: ''
    });
    setPage(1);
  };

  const exportToCSV = () => {
    // CSV export functionality
    const headers = ['Date', 'From Store', 'To Store', 'Product', 'Quantity', 'Staff', 'Reference', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...history.map(t => [
        t.transfer_date ? new Date(t.transfer_date).toLocaleDateString() : '',
        t.from_store_name || '',
        t.to_store_name || '',
        t.product_name || '',
        t.quantity || '',
        t.staff_name || '',
        t.reference || '',
        t.notes || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_transfer_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stock Transfer History</h1>
              <p className="mt-2 text-gray-600">Track and manage all stock transfers between stores</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setShowModal(true)}
              >
                <Plus className="h-4 w-4" />
                New Transfer
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArrowRight className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Transfers</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalTransfers.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Quantity</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalQuantity.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Products</p>
                <p className="text-xl font-bold text-gray-900">{stats.uniqueProducts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Store className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Stores</p>
                <p className="text-xl font-bold text-gray-900">{stats.uniqueStores}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end">
            {/* Search Bar */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Search Transfers</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by reference, notes, or product name..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Clear Filters */}
            {(filters.from_store_id || filters.to_store_id || filters.product_id || filters.start_date || filters.end_date || filters.search) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">From Store</label>
                  <select 
                    name="from_store_id" 
                    value={filters.from_store_id} 
                    onChange={handleFilterChange} 
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Stores</option>
                    {stores.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.store_name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">To Store</label>
                  <select 
                    name="to_store_id" 
                    value={filters.to_store_id} 
                    onChange={handleFilterChange} 
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Stores</option>
                    {stores.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.store_name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
                  <select 
                    name="product_id" 
                    value={filters.product_id} 
                    onChange={handleFilterChange} 
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Products</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.product_name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="date" 
                      name="start_date" 
                      value={filters.start_date} 
                      onChange={handleDateChange} 
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="date" 
                      name="end_date" 
                      value={filters.end_date} 
                      onChange={handleDateChange} 
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transfer History Table */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading transfer history...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-red-600 text-lg font-medium">{error}</div>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transfers found</h3>
            <p className="text-gray-600">No stock transfers match your current filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Date & Time
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5" />
                        From Store
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className="h-3.5 w-3.5" />
                        To Store
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        Product
                      </div>
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        Staff
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        Reference
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Notes
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {history.map((transfer: any, index: number) => (
                    <tr 
                      key={transfer.id} 
                      className={`hover:bg-gray-50 transition-colors duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900 font-medium">
                          {formatDate(transfer.transfer_date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(transfer.transfer_date)}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">
                          {transfer.from_store_name}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">
                          {transfer.to_store_name}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">
                          {transfer.product_name}
                        </div>
                        {transfer.product_code && (
                          <div className="text-xs text-gray-500">
                            {transfer.product_code}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {transfer.quantity?.toLocaleString() || '0'}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {transfer.staff_name || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {transfer.reference ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              {transfer.reference}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-xs text-gray-900 max-w-xs truncate">
                          {transfer.notes ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800" title={transfer.notes}>
                              {transfer.notes}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Table Summary */}
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600">
                <span>
                  Showing {history.length} of {stats.totalTransfers} transfer{stats.totalTransfers !== 1 ? 's' : ''} 
                  {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
                </span>
                <span className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  Total Quantity: <span className="font-semibold text-gray-900">{stats.totalQuantity.toLocaleString()}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-600">
                Page <span className="font-semibold text-gray-900">{page}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                {' '}({stats.totalTransfers} total transfers)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  title="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      // Show all pages if 5 or fewer
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      // Show first 5 pages
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      // Show last 5 pages
                      pageNum = totalPages - 4 + i;
                    } else {
                      // Show pages around current page
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          pageNum === page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  title="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Add Transfer */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">New Stock Transfer</h2>
              <StockTransferPage
                onSuccess={() => {
                  setShowModal(false);
                  fetchHistory();
                }}
                isModal={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockTransferHistoryPage; 