import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { purchaseOrdersService } from '../services/financialService';
import { PurchaseOrder } from '../types/financial';

const PurchaseOrdersPage: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('draft');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('order_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(7);

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const supplierId = query.get('supplierId');

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrdersService.getAll();
      if (response.success) {
        setPurchaseOrders(response.data || []);
      } else {
        setError(response.error || 'Failed to fetch purchase orders');
      }
    } catch (err) {
      setError('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Draft', icon: '📝' },
      sent: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Sent', icon: '📤' },
      partially_received: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Partial', icon: '📦' },
      received: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Received', icon: '✅' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Cancelled', icon: '❌' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getDateFilterRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

    return { today, weekAgo, monthAgo, quarterAgo };
  };

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = purchaseOrders.filter(po => {
      // Status filter
      if (statusFilter !== 'all' && po.status !== statusFilter) return false;
      
      // Supplier filter
      if (supplierId && String(po.supplier_id) !== String(supplierId)) return false;
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesPO = po.po_number.toLowerCase().includes(search);
        const matchesSupplier = po.supplier_name?.toLowerCase().includes(search);
        const matchesNotes = po.notes?.toLowerCase().includes(search);
        if (!matchesPO && !matchesSupplier && !matchesNotes) return false;
      }
      
      // Date filter
      if (dateFilter === 'custom') {
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const orderDate = new Date(po.order_date);
          if (orderDate < start || orderDate > end) return false;
        } else {
          return false; // Should not happen if custom is selected
        }
      } else if (dateFilter !== 'all') {
        const { today, weekAgo, monthAgo, quarterAgo } = getDateFilterRange();
        const orderDate = new Date(po.order_date);
        
        switch (dateFilter) {
          case 'today':
            if (orderDate < today) return false;
            break;
          case 'week':
            if (orderDate < weekAgo) return false;
            break;
          case 'month':
            if (orderDate < monthAgo) return false;
            break;
          case 'quarter':
            if (orderDate < quarterAgo) return false;
            break;
        }
      }
      
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'po_number':
          aValue = a.po_number;
          bValue = b.po_number;
          break;
        case 'total_amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        case 'order_date':
        default:
          aValue = new Date(a.order_date);
          bValue = new Date(b.order_date);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [purchaseOrders, statusFilter, supplierId, searchTerm, dateFilter, sortBy, sortOrder, startDate, endDate]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedOrders.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedOrders = filteredAndSortedOrders.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, dateFilter, sortBy, sortOrder, startDate, endDate, recordsPerPage]);

  const getStatusCounts = () => {
    const counts = { all: 0, draft: 0, sent: 0, partially_received: 0, received: 0, cancelled: 0 };
    purchaseOrders.forEach(po => {
      counts.all++;
      counts[po.status as keyof typeof counts]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-xs">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-xs font-medium text-red-800">Error Loading Purchase Orders</h3>
                <div className="mt-1 text-xs text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h1 className="text-sm font-bold text-gray-900">Purchase Orders</h1>
              <p className="mt-0.5 text-xs text-gray-600">
                Manage and track all purchase orders from suppliers
              </p>
            </div>
            <Link
              to="/financial/purchase-order"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Purchase Order
            </Link>
          </div>
        </div>

        {/* Filter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 mb-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={`bg-white rounded-md shadow-sm border p-2 text-left transition-all duration-200 hover:shadow-md ${
              statusFilter === 'all' 
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-[9px] font-medium text-gray-600">Total Orders</div>
            <div className={`text-xs font-bold ${statusFilter === 'all' ? 'text-green-600' : 'text-gray-900'}`}>
              {statusCounts.all}
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`bg-white rounded-md shadow-sm border p-2 text-left transition-all duration-200 hover:shadow-md ${
              statusFilter === 'draft' 
                ? 'border-gray-500 bg-gray-50 ring-2 ring-gray-200' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-[9px] font-medium text-gray-600">Draft</div>
            <div className={`text-xs font-bold ${statusFilter === 'draft' ? 'text-gray-600' : 'text-gray-500'}`}>
              {statusCounts.draft}
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('sent')}
            className={`bg-white rounded-md shadow-sm border p-2 text-left transition-all duration-200 hover:shadow-md ${
              statusFilter === 'sent' 
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-[9px] font-medium text-gray-600">Sent</div>
            <div className={`text-xs font-bold ${statusFilter === 'sent' ? 'text-blue-600' : 'text-blue-600'}`}>
              {statusCounts.sent}
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('partially_received')}
            className={`bg-white rounded-md shadow-sm border p-2 text-left transition-all duration-200 hover:shadow-md ${
              statusFilter === 'partially_received' 
                ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-[9px] font-medium text-gray-600">Partial</div>
            <div className={`text-xs font-bold ${statusFilter === 'partially_received' ? 'text-yellow-600' : 'text-yellow-600'}`}>
              {statusCounts.partially_received}
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('received')}
            className={`bg-white rounded-md shadow-sm border p-2 text-left transition-all duration-200 hover:shadow-md ${
              statusFilter === 'received' 
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-[9px] font-medium text-gray-600">Received</div>
            <div className={`text-xs font-bold ${statusFilter === 'received' ? 'text-green-600' : 'text-green-600'}`}>
              {statusCounts.received}
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`bg-white rounded-md shadow-sm border p-2 text-left transition-all duration-200 hover:shadow-md ${
              statusFilter === 'cancelled' 
                ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-[9px] font-medium text-gray-600">Cancelled</div>
            <div className={`text-xs font-bold ${statusFilter === 'cancelled' ? 'text-red-600' : 'text-red-600'}`}>
              {statusCounts.cancelled}
            </div>
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-2.5 mb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Search */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Search</label>
              <input
                type="text"
                placeholder="PO number, supplier, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="partially_received">Partially Received</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 mb-1.5"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
              
              {dateFilter === 'custom' && (
                <div className="space-y-1.5">
                  <input
                    type="date"
                    placeholder="Start Date"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="End Date"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="order_date">Order Date</option>
                <option value="po_number">PO Number</option>
                <option value="total_amount">Total Amount</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count and Records Per Page */}
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <p className="text-[9px] text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedOrders.length)} of {filteredAndSortedOrders.length} purchase orders
            </p>
            <div className="flex items-center gap-1.5">
              <label className="text-[9px] text-gray-600">Records per page:</label>
              <select
                value={recordsPerPage}
                onChange={(e) => {
                  setRecordsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value={7}>7</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => {
              setStatusFilter('all');
              setSearchTerm('');
              setDateFilter('all');
              setStartDate(undefined);
              setEndDate(undefined);
              setSortBy('order_date');
              setSortOrder('desc');
              setCurrentPage(1);
            }}
            className="text-[9px] text-gray-500 hover:text-gray-700 underline"
          >
            Clear all filters
          </button>
        </div>

        {/* Purchase Orders Table */}
        {filteredAndSortedOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xs font-medium text-gray-900 mb-1.5">No purchase orders found</h3>
            <p className="text-xs text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first purchase order.'
              }
            </p>
            <Link
              to="/create-purchase-order"
              className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Create Purchase Order
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Order
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Expected Delivery
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-3 py-2 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-3 py-2 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-2">
                            <div className="text-xs font-medium text-gray-900">{po.po_number}</div>
                            <div className="text-[10px] text-gray-500">ID: {po.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{po.supplier_name || 'Unknown Supplier'}</div>
                        <div className="text-[10px] text-gray-500">{po.supplier_code || 'N/A'}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {getStatusBadge(po.status)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{formatDate(po.order_date)}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {po.expected_delivery_date ? (
                          <div className="text-xs text-gray-900">{formatDate(po.expected_delivery_date)}</div>
                        ) : (
                          <span className="text-xs text-gray-400">Not specified</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {po.items && po.items.length > 0 ? (
                            <div>
                              <span className="font-medium text-xs">{po.items.length}</span> <span className="text-[10px]">item{po.items.length !== 1 ? 's' : ''}</span>
                              {po.items.length > 0 && (
                                <div className="text-[9px] text-gray-500 mt-0.5">
                                  {po.items.slice(0, 2).map((item, index) => (
                                    <div key={index} className="truncate max-w-32">
                                      {item.product?.product_name || `Item ${index + 1}`}
                                    </div>
                                  ))}
                                  {po.items.length > 2 && (
                                    <div className="text-gray-400">+{po.items.length - 2} more</div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400">No items</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="text-xs text-gray-900 font-medium">{formatCurrency(po.total_amount)}</div>
                        <div className="text-[9px] text-gray-500">
                          Sub: {formatCurrency(po.subtotal)} | Tax: {formatCurrency(po.tax_amount)}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <Link
                            to={`/purchase-orders/${po.id}`}
                            className="inline-flex items-center px-2 py-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                          >
                            View
                          </Link>
                          
                          {po.status === 'received' && (
                            <Link
                              to={`/supplier-invoice/${po.id}`}
                              className="inline-flex items-center px-2 py-1 text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                              title="View Supplier Invoice"
                            >
                              Invoice
                            </Link>
                          )}
                          
                          {(po.status === 'sent') && (
                            <Link
                              to={`/receive-items/${po.id}`}
                              className="inline-flex items-center px-2 py-1 text-[10px] font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                            >
                              Receive
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-0.5 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-0.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <span className="px-1.5 text-[10px] text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors ${
                            currentPage === page
                              ? 'bg-green-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-0.5 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
            
            <div className="text-[9px] text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrdersPage; 