import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { nonSuppliesService, NonSupplyItemSummary } from '../services/financialService';
import { Search, Download, FileText, ChevronLeft, ChevronRight, Calendar, Package } from 'lucide-react';
import axios from 'axios';

const NonSuppliesItemsSummaryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<NonSupplyItemSummary[]>([]);
  const [filteredItems, setFilteredItems] = useState<NonSupplyItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [outletAccountFilter, setOutletAccountFilter] = useState<string>('all');
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [outletAccounts, setOutletAccounts] = useState<{ id: number; name: string }[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  // Fetch items summary when filters change
  useEffect(() => {
    fetchItemsSummary();
  }, [clientId, regionFilter, outletAccountFilter, dateFilter, customStartDate, customEndDate]);

  // Apply client-side filters (search only - date/region/outlet filters are server-side)
  useEffect(() => {
    filterItems();
    setCurrentPage(1);
  }, [items, searchTerm]);

  const fetchItemsSummary = async () => {
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
      
      console.log('Fetching non supply items summary with params:', params);
      const response = await nonSuppliesService.getItemsSummary(params);
      
      if (response.success) {
        const itemsData = response.data || [];
        console.log(`Fetched ${itemsData.length} non supply items`);
        
        setItems(itemsData);
      } else {
        setError('Failed to fetch non supply items');
      }
    } catch (err) {
      setError('Error fetching non supply items');
      console.error('Error fetching non supply items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filters (search only)
  const filterItems = () => {
    let filtered = [...items];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.outlet_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.non_supply_reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.so_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

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
    const headers = ['Date', 'Outlet Name', 'Region', 'Product Name', 'Quantity', 'Unit', 'Reason'];
    const csvData = filteredItems.map(item => [
      formatDate(item.order_date),
      item.outlet_name || 'N/A',
      item.region_name || 'N/A',
      item.product_name || 'N/A',
      item.quantity,
      item.unit_of_measure || 'PCS',
      item.non_supply_reason || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `non-supplies-items-summary-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xs text-gray-600">Loading non supply items...</p>
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
            onClick={fetchItemsSummary}
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
              <h1 className="text-lg font-bold text-gray-900">Non Supplies Items Summary</h1>
              <p className="text-xs text-gray-600 mt-1">View all non supply items with outlet, product, and reason details</p>
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
                  placeholder="Search outlet, product, or reason..."
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
                  {filteredItems.length} of {items.length}
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Outlet
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm font-medium text-gray-900 mb-2">No non supply items found</p>
                      <p className="text-xs text-gray-600">
                        {searchTerm || dateFilter !== 'all' 
                          ? 'Try adjusting your filters or search terms'
                          : 'Non supply items will appear here when available'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {formatDate(item.order_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        <div className="font-medium">{item.outlet_name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {item.region_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        {item.product_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-right font-medium text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {item.unit_of_measure || 'PCS'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-900 max-w-xs">
                        <div className="truncate" title={item.non_supply_reason || 'N/A'}>
                          {item.non_supply_reason && item.non_supply_reason.trim() ? item.non_supply_reason : 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredItems.length > 0 && (
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
                    <span className="font-medium">{Math.min(endIndex, filteredItems.length)}</span> of{' '}
                    <span className="font-medium">{filteredItems.length}</span> results
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

export default NonSuppliesItemsSummaryPage;
