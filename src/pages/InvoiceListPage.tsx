import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { salesOrdersService } from '../services/financialService';
import { receiptsService } from '../services/financialService';
import { SalesOrder } from '../types/financial';
import { Search, Filter, Download, Eye, FileText, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const InvoiceListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('1'); // Default to approved (status 1)
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [amountsPaid, setAmountsPaid] = useState<{[key: number]: number}>({});
  const [loadingAmounts, setLoadingAmounts] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Get client_id from URL params
  const clientIdParam = searchParams.get('client_id');
  const clientId = clientIdParam ? parseInt(clientIdParam, 10) : undefined;

  // Fetch orders when component mounts or when status filter or client_id changes
  useEffect(() => {
    fetchSalesOrders();
  }, [statusFilter, clientId]);

  // Apply client-side filters (search and date only)
  useEffect(() => {
    filterOrders();
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [salesOrders, searchTerm, dateFilter, customStartDate, customEndDate]);

  // No longer needed - amounts_paid is now included in the sales orders response
  // useEffect(() => {
  //   if (salesOrders.length > 0) {
  //     fetchAmountsPaid();
  //   }
  // }, [salesOrders]);

  // OPTIMIZED: Fetch only the selected status from backend
  const fetchSalesOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Pass status filter and client_id to API - only fetch what's needed
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (clientId) {
        params.client_id = clientId;
      }
      
      console.log('Fetching orders with params:', params);
      const response = await salesOrdersService.getAll(params);
      
      if (response.success) {
        const orders = response.data || [];
        console.log(`Fetched ${orders.length} orders with status: ${statusFilter}`);
        
        setSalesOrders(orders);
        
        // OPTIMIZED: Extract amounts_paid directly from the orders response
        // The backend now includes amount_paid in the sales orders query
        const amounts: {[key: number]: number} = {};
        orders.forEach(order => {
          amounts[order.id] = parseFloat(order.amount_paid || 0);
        });
        setAmountsPaid(amounts);
        
      } else {
        setError('Failed to fetch sales orders');
      }
    } catch (err) {
      setError('Error fetching sales orders');
      console.error('Error fetching sales orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAmountsPaid = async () => {
    try {
      setLoadingAmounts(true);
      
      if (salesOrders.length === 0) {
        setAmountsPaid({});
        return;
      }

      // OPTIMIZED: Fetch amounts paid for all invoices in a single API call
      const invoiceIds = salesOrders.map(order => order.id);
      const response = await receiptsService.getBulkAmountsPaid(invoiceIds);
      
      if (response.success && response.data) {
        setAmountsPaid(response.data);
      } else {
        // Set all amounts to 0 if request failed
        const amounts: {[key: number]: number} = {};
        salesOrders.forEach(order => {
          amounts[order.id] = 0;
        });
        setAmountsPaid(amounts);
      }
    } catch (err) {
      console.error('Error fetching amounts paid:', err);
      // Set all amounts to 0 if there's a general error
      const amounts: {[key: number]: number} = {};
      salesOrders.forEach(order => {
        amounts[order.id] = 0;
      });
      setAmountsPaid(amounts);
    } finally {
      setLoadingAmounts(false);
    }
  };

  const refreshAmountsPaid = async () => {
    if (salesOrders.length > 0) {
      await fetchAmountsPaid();
    }
  };

  // OPTIMIZED: Only client-side filters (search and date)
  // Status filtering is now done at the backend level
  const filterOrders = () => {
    let filtered = [...salesOrders];

    // Search filter (client-side for instant feedback)
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.so_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.salesrep?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter (client-side)
    if (dateFilter !== 'all') {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.order_date);
        
        switch (dateFilter) {
          case 'today':
            return orderDate.toDateString() === today.toDateString();
          case 'week':
            return orderDate >= sevenDaysAgo;
          case 'month':
            return orderDate >= thirtyDaysAgo;
          case 'custom':
            // Custom date range filtering
            if (customStartDate && customEndDate) {
              const startDate = new Date(customStartDate);
              const endDate = new Date(customEndDate);
              // Set end date to end of day
              endDate.setHours(23, 59, 59, 999);
              return orderDate >= startDate && orderDate <= endDate;
            } else if (customStartDate) {
              const startDate = new Date(customStartDate);
              return orderDate >= startDate;
            } else if (customEndDate) {
              const endDate = new Date(customEndDate);
              endDate.setHours(23, 59, 59, 999);
              return orderDate <= endDate;
            }
            return true;
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const formatCurrency = (amount: number | undefined | null) => {
    // Handle invalid values safely
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const safeNumber = (value: any): number => {
    if (value === undefined || value === null || value === '') {
      return 0;
    }
    // Handle string numbers
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return 0;
      const num = parseFloat(trimmed);
      return isNaN(num) ? 0 : num;
    }
    // Handle numbers
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : value;
    }
    // Handle other types
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (myStatus: number) => {
    const statusConfig = {
      1: { label: 'APPROVED', color: 'bg-green-100 text-green-800' },
      2: { label: 'ASSIGNED', color: 'bg-blue-100 text-blue-800' },
      3: { label: 'IN TRANSIT', color: 'bg-purple-100 text-purple-800' }
    };

    const config = statusConfig[myStatus as keyof typeof statusConfig];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        {config?.label || `STATUS ${myStatus}`}
      </span>
    );
  };

  const getStatusBadgeText = (myStatus: number) => {
    const statusConfig = {
      1: 'APPROVED',
      2: 'ASSIGNED', 
      3: 'IN TRANSIT'
    };

    return statusConfig[myStatus as keyof typeof statusConfig] || `STATUS ${myStatus}`;
  };

  const exportToCSV = () => {
    const headers = ['SO Number', 'Customer', 'Sales Rep', 'Order Date', 'Approval Status', 'Subtotal', 'Tax', 'Total Amount', 'Amount Paid', 'Balance'];
    const csvData = filteredOrders.map(order => [
      order.so_number,
      order.customer_name || 'N/A',
      order.salesrep || 'N/A',
      formatDate(order.order_date),
      getStatusBadgeText(order.my_status || 0),
      formatCurrency(safeNumber(order.total_amount) - safeNumber(order.tax_amount)),
      formatCurrency(safeNumber(order.tax_amount)),
      formatCurrency(safeNumber(order.total_amount)),
      formatCurrency(safeNumber(amountsPaid[order.id])),
      formatCurrency(safeNumber(order.total_amount) - safeNumber(amountsPaid[order.id]))
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xs text-gray-600">Loading sales orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-base mb-4">Error</div>
          <p className="text-xs text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSalesOrders}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-xs"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Invoice List</h1>
               
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshAmountsPaid}
                disabled={loadingAmounts}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className={`h-4 w-4 mr-2 ${loadingAmounts ? 'animate-spin' : ''}`}>
                  {loadingAmounts ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </div>
                {loadingAmounts ? 'Loading...' : 'Refresh Payments'}
              </button>
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary - Shows data for selected status only */}
        {salesOrders.length > 0 ? (
          <div className="bg-white rounded-lg shadow mb-3 p-3">
            {/* Status-specific Summary */}
            <div className="mb-3">
              <h3 className="text-[10px] text-gray-600 text-center mb-2">
                {statusFilter === 'all' ? 'All Statuses' : 
                 statusFilter === '1' ? 'Approved Orders Summary' :
                 statusFilter === '2' ? 'Assigned Orders Summary' :
                 statusFilter === '3' ? 'In Transit Orders Summary' : 
                 `Status ${statusFilter} Summary`}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900">
                    {salesOrders.length}
                  </div>
                  <div className="text-[10px] text-gray-600">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-green-600">
                    {formatCurrency(salesOrders.reduce((sum, order) => sum + safeNumber(order.total_amount), 0))}
                  </div>
                  <div className="text-[10px] text-gray-600">Total Value</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-600">
                    {formatCurrency(salesOrders.reduce((sum, order) => sum + safeNumber(order.tax_amount), 0))}
                  </div>
                  <div className="text-[10px] text-gray-600">Total Tax</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-emerald-600">
                    {formatCurrency(salesOrders.reduce((sum, order) => sum + safeNumber(amountsPaid[order.id]), 0))}
                  </div>
                  <div className="text-[10px] text-gray-600">Total Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-orange-600">
                    {formatCurrency(salesOrders.reduce((sum, order) => sum + (safeNumber(order.total_amount) - safeNumber(amountsPaid[order.id])), 0))}
                  </div>
                  <div className="text-[10px] text-gray-600">Outstanding</div>
                </div>
              </div>
            </div>

            {/* Client-side Filtered Results (Search/Date) */}
            {filteredOrders.length !== salesOrders.length && (
              <div className="mb-0 pt-3 border-t border-gray-200">
                <h3 className="text-[10px] text-gray-600 text-center mb-2">After Search/Date Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-700">
                      {filteredOrders.length}
                    </div>
                    <div className="text-[10px] text-gray-600">Filtered Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-700">
                      {formatCurrency(filteredOrders.reduce((sum, order) => sum + safeNumber(order.total_amount), 0))}
                    </div>
                    <div className="text-[10px] text-gray-600">Filtered Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-700">
                      {formatCurrency(filteredOrders.reduce((sum, order) => sum + safeNumber(order.tax_amount), 0))}
                    </div>
                    <div className="text-[10px] text-gray-600">Filtered Tax</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-emerald-700">
                      {formatCurrency(filteredOrders.reduce((sum, order) => sum + safeNumber(amountsPaid[order.id]), 0))}
                    </div>
                    <div className="text-[10px] text-gray-600">Filtered Paid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-orange-700">
                      {formatCurrency(filteredOrders.reduce((sum, order) => sum + (safeNumber(order.total_amount) - safeNumber(amountsPaid[order.id])), 0))}
                    </div>
                    <div className="text-[10px] text-gray-600">Filtered Outstanding</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow mb-3 p-3">
            <div className="text-center text-gray-500">
              <p className="text-xs">No sales orders available to display summary</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search SO number, customer, or sales rep..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Approval Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="all">All Approval Statuses</option>
                <option value="1">Approved (1)</option>
                <option value="2">Assigned (2)</option>
                <option value="3">In Transit (3)</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range Inputs */}
            {dateFilter === 'custom' && (
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-3 h-3 mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-3 h-3 mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Results Count */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Results</label>
              <div className="text-sm font-semibold text-gray-900">
                {filteredOrders.length} of {salesOrders.length}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    SO Number
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Approval Status
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Tax
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Amount Paid
                    {loadingAmounts && (
                      <div className="inline-block ml-2 animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm font-medium text-gray-900 mb-2">No sales orders found</p>
                      <p className="text-xs text-gray-600">
                        {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                          ? 'Try adjusting your filters or search terms'
                          : 'Sales orders with approval status 1, 2, or 3 will appear here'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-900">
                        {order.so_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {order.customer_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {order.salesrep || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.my_status || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {formatCurrency(safeNumber(order.total_amount) - safeNumber(order.tax_amount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {formatCurrency(safeNumber(order.tax_amount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-900">
                        {formatCurrency(safeNumber(order.total_amount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {loadingAmounts ? (
                          <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                        ) : (
                          <span className={safeNumber(amountsPaid[order.id]) > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                            {formatCurrency(safeNumber(amountsPaid[order.id]))}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {loadingAmounts ? (
                          <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                        ) : (
                          <span className={safeNumber(order.total_amount) - safeNumber(amountsPaid[order.id]) > 0 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                            {formatCurrency(safeNumber(order.total_amount) - safeNumber(amountsPaid[order.id]))}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(`/sales-orders/${order.id}`, '_blank')}
                            className="text-green-600 hover:text-green-900 flex items-center"
                            title="View Details"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredOrders.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredOrders.length)}</span> of{' '}
                    <span className="font-medium">{filteredOrders.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      const showEllipsis = 
                        (page === currentPage - 2 && currentPage > 3) ||
                        (page === currentPage + 2 && currentPage < totalPages - 2);

                      if (showEllipsis) {
                        return (
                          <span
                            key={page}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        );
                      }

                      if (!showPage) return null;

                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-xs font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>



      </div>
    </div>
  );
};

export default InvoiceListPage;
