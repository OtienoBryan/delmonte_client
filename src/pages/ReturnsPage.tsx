import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { returnsService, Return, ReturnItem } from '../services/financialService';
import { Search, Download, FileText, ChevronLeft, ChevronRight, Calendar, Eye } from 'lucide-react';
import axios from 'axios';

const ReturnsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [returns, setReturns] = useState<Return[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('today'); // Default to today
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [outletAccountFilter, setOutletAccountFilter] = useState<string>('all');
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [outletAccounts, setOutletAccounts] = useState<{ id: number; name: string }[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);

  // Get client_id from URL params
  const clientIdParam = searchParams.get('client_id');
  const clientId = clientIdParam ? parseInt(clientIdParam, 10) : undefined;

  // Fetch regions and outlet accounts on mount
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await axios.get('/api/sales/regions');
        if (res.data && Array.isArray(res.data)) {
          setRegions(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch regions:', err);
      }
    };

    const fetchOutletAccounts = async () => {
      try {
        const res = await axios.get('/api/outlet-accounts');
        if (res.data && res.data.success && res.data.data) {
          setOutletAccounts(res.data.data);
        } else if (Array.isArray(res.data)) {
          setOutletAccounts(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch outlet accounts:', err);
      }
    };

    fetchRegions();
    fetchOutletAccounts();
  }, []);

  // Fetch returns when filters change
  useEffect(() => {
    fetchReturns();
  }, [clientId, regionFilter, outletAccountFilter, dateFilter, customStartDate, customEndDate]);

  // Apply client-side filters (search only - date/region/outlet filters are server-side)
  useEffect(() => {
    filterReturns();
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [returns, searchTerm]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (clientId) {
        params.client_id = clientId;
      }
      if (regionFilter !== 'all') {
        params.region_id = regionFilter;
      }
      if (outletAccountFilter !== 'all') {
        params.outlet_account_id = outletAccountFilter;
      }
      
      // Add date filters based on dateFilter selection
      // Helper function to format date as YYYY-MM-DD in local timezone
      const formatDateLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'today') {
        const todayStr = formatDateLocal(today);
        params.start_date = todayStr;
        params.end_date = todayStr;
      } else if (dateFilter === 'week') {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        params.start_date = formatDateLocal(sevenDaysAgo);
        params.end_date = formatDateLocal(today);
      } else if (dateFilter === 'month') {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        params.start_date = formatDateLocal(thirtyDaysAgo);
        params.end_date = formatDateLocal(today);
      } else if (dateFilter === 'custom') {
        if (customStartDate) {
          params.start_date = customStartDate;
        }
        if (customEndDate) {
          params.end_date = customEndDate;
        }
      }
      
      console.log('Fetching returns with params:', params);
      const response = await returnsService.getAll(params);
      
      if (response.success) {
        const returnsData = response.data || [];
        console.log(`Fetched ${returnsData.length} returns`);
        
        setReturns(returnsData);
      } else {
        setError('Failed to fetch returns');
      }
    } catch (err) {
      setError('Error fetching returns');
      console.error('Error fetching returns:', err);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filters (search only - date/region/outlet filters are server-side)
  const filterReturns = () => {
    let filtered = [...returns];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(returnItem => 
        returnItem.so_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        returnItem.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReturns(filtered);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReturns = filteredReturns.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToCSV = () => {
    const headers = ['SO Number', 'Client Name', 'Sales Rep', 'Region', 'Outlet Account', 'Order Date'];
    const csvData = filteredReturns.map(returnItem => [
      returnItem.so_number,
      returnItem.client_name || 'N/A',
      returnItem.salesrep_name || 'N/A',
      returnItem.region_name || 'N/A',
      returnItem.outlet_account_name || 'N/A',
      formatDate(returnItem.order_date)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-returns-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openReturnItemsModal = async (returnItem: Return) => {
    setSelectedReturn(returnItem);
    setModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    try {
      const response = await returnsService.getItems(returnItem.id);
      if (response.success && response.data) {
        setReturnItems(response.data);
      } else {
        setReturnItems([]);
        setModalError(response.error || 'Failed to fetch return items');
      }
    } catch (err) {
      setReturnItems([]);
      setModalError('Failed to fetch return items');
      console.error('Error fetching return items:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setReturnItems([]);
    setSelectedReturn(null);
    setModalError(null);
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xs text-gray-600">Loading returns...</p>
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
            onClick={fetchReturns}
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
              <h1 className="text-lg font-bold text-gray-900">Product Returns</h1>
            </div>
            <div className="flex items-center space-x-3">
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
 

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search SO number or client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                />
              </div>
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

            {/* Region Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Region</label>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="all">All Regions</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Outlet Account Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Outlet Account</label>
              <select
                value={outletAccountFilter}
                onChange={(e) => setOutletAccountFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="all">All Accounts</option>
                {outletAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range Inputs */}
            {dateFilter === 'custom' && (
              <>
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
              </>
            )}

            {/* Results Count */}
            {dateFilter !== 'custom' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Results</label>
                <div className="text-sm font-semibold text-gray-900">
                  {filteredReturns.length} of {returns.length}
                </div>
              </div>
            )}
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
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Outlet Account
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm font-medium text-gray-900 mb-2">No returns found</p>
                      <p className="text-xs text-gray-600">
                        {searchTerm || dateFilter !== 'all' 
                          ? 'Try adjusting your filters or search terms'
                          : 'Returns will appear here when available'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentReturns.map((returnItem) => (
                    <tr key={returnItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {returnItem.so_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {returnItem.client_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {returnItem.salesrep_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {returnItem.region_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {returnItem.outlet_account_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {formatDate(returnItem.order_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                        <button
                          onClick={() => openReturnItemsModal(returnItem)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="View Items"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Items
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Return Items Modal */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-2 sm:p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full p-4 sm:p-6 relative max-h-[95vh] overflow-y-auto">
                <button 
                  onClick={closeModal} 
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl sm:text-2xl"
                >
                  &times;
                </button>
                <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Return Items for {selectedReturn?.so_number}</h2>
                {selectedReturn && (
                  <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
                    <p><strong>Client:</strong> {selectedReturn.client_name || 'N/A'}</p>
                    <p><strong>Order Date:</strong> {formatDate(selectedReturn.order_date)}</p>
                  </div>
                )}
                {modalLoading ? (
                  <div className="flex justify-center items-center h-24">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : modalError ? (
                  <div className="text-red-600 text-center text-xs sm:text-sm">{modalError}</div>
                ) : returnItems.length === 0 ? (
                  <div className="text-gray-500 text-center text-xs sm:text-sm">No items found for this return.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Product Name</th>
                          <th className="px-3 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Product Code</th>
                          <th className="px-3 sm:px-4 py-2 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-3 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Unit</th>
                          <th className="px-3 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {returnItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-[10px] sm:text-xs text-gray-900">{item.product_name}</td>
                            <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-[10px] sm:text-xs text-gray-600">{item.product_code || 'N/A'}</td>
                            <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-[10px] sm:text-xs text-right font-medium">{item.quantity}</td>
                            <td className="px-3 sm:px-4 py-2 whitespace-nowrap text-[10px] sm:text-xs text-gray-600">{item.unit_of_measure || 'PCS'}</td>
                            <td className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-gray-900">{item.return_reason && item.return_reason.trim() ? item.return_reason : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredReturns.length > 0 && (
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
                    <span className="font-medium">{Math.min(endIndex, filteredReturns.length)}</span> of{' '}
                    <span className="font-medium">{filteredReturns.length}</span> results
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

export default ReturnsPage;
