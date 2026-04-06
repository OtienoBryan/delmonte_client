import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesService, MasterSalesData } from '../services/salesService';
import { Search, Download, Filter, TrendingUp, Users, DollarSign, Calendar, BarChart3, X, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

// Debounce hook for search optimization
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const MasterSalesPage: React.FC = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState<MasterSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedSalesReps, setSelectedSalesReps] = useState<number[]>([]);
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [clientStatus, setClientStatus] = useState<string>('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [salesReps, setSalesReps] = useState<{ id: number; name: string }[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showSalesDetailModal, setShowSalesDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [salesDetails, setSalesDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewType, setViewType] = useState<'sales' | 'quantity'>('sales');
  const [allRecordsTotals, setAllRecordsTotals] = useState<any>(null);

  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Debounced search query - delays API call until user stops typing
  const debouncedSearchQuery = useDebounce(searchInput, 500);

  // Reset to page 1 when debounced search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // Sync searchInput with searchQuery when debounced value changes
  useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  // Fetch data when filters, pagination, sorting, or search changes
  useEffect(() => {
    fetchSalesData();
  }, [selectedYear, selectedCategories, selectedSalesReps, selectedCategoryGroup, startDate, endDate, clientStatus, viewType, currentPage, itemsPerPage, sortColumn, sortDirection, searchQuery]);

  useEffect(() => {
    fetchCategories();
    fetchSalesReps();
  }, []);

  const fetchSalesData = async () => {
    try {
      // Only show full loading on initial load, use subtle refresh indicator otherwise
      if (salesData.length === 0) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      const categoryIds = selectedCategories.length > 0 ? selectedCategories : undefined;
      const salesRepIds = selectedSalesReps.length > 0 ? selectedSalesReps : undefined;
      const categoryGroup = selectedCategoryGroup || undefined;
      const startDateParam = startDate || undefined;
      const endDateParam = endDate || undefined;
      const clientStatusParam = clientStatus || undefined;
      
      console.log(`[Master Sales] Fetching page ${currentPage} with ${itemsPerPage} items per page`);
      
      // OPTIMIZED: Pass pagination params to backend
      // If "View All" is selected, pass a very large limit (999999)
      const limitToSend = itemsPerPage === 'all' ? 999999 : itemsPerPage;
      const pageToSend = itemsPerPage === 'all' ? 1 : currentPage;
      
      const result = await salesService.getMasterSalesData(
        selectedYear, 
        categoryIds, 
        salesRepIds, 
        categoryGroup, 
        startDateParam, 
        endDateParam, 
        clientStatusParam, 
        viewType,
        pageToSend,
        limitToSend,
        sortColumn || undefined,
        sortDirection,
        searchQuery.trim() || undefined
      );
      
      setSalesData(result.data);
      setTotalPages(result.pagination.totalPages);
      setTotalItems(result.pagination.totalItems);
      setAllRecordsTotals(result.totals || null);
      
      console.log(`[Master Sales] Loaded ${result.data.length} clients (Page ${currentPage}/${result.pagination.totalPages})`);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales data');
      setSalesData([]);
      setAllRecordsTotals(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await salesService.getMasterSalesCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchSalesReps = async () => {
    try {
      const data = await salesService.getMasterSalesSalesReps();
      setSalesReps(data);
    } catch (err: any) {
      console.error('Failed to fetch sales reps:', err);
    }
  };

  const fetchSalesDetails = async (clientId: number, month: string) => {
    try {
      setLoadingDetails(true);
      let data: any[];
      
      if (month === 'total') {
        // Fetch all sales for the entire year
        console.log('[fetchSalesDetails] Fetching year details:', { clientId, year: selectedYear });
        data = await salesService.getClientYearDetails(clientId, selectedYear);
      } else {
        // Fetch sales for a specific month
        const monthNumber = months.indexOf(month) + 1;
        console.log('[fetchSalesDetails] Fetching month details:', { clientId, month: monthNumber, year: selectedYear });
        data = await salesService.getClientMonthDetails(clientId, monthNumber, selectedYear);
      }
      
      console.log('[fetchSalesDetails] Received data:', data);
      console.log('[fetchSalesDetails] Data length:', data.length);
      setSalesDetails(data);
    } catch (err: any) {
      console.error('[fetchSalesDetails] Failed to fetch sales details:', err);
      setSalesDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const exportModalToCSV = () => {
    if (salesDetails.length === 0) return;

    // Group products by product_name and aggregate quantities and totals
    const productSummary: { [key: string]: { 
      product_name: string; 
      category_name: string; 
      total_quantity: number; 
      total_sales: number;
      avg_unit_price: number;
    } } = {};
    
    salesDetails.forEach((detail) => {
      const productName = detail.product_name || 'Unknown Product';
      if (!productSummary[productName]) {
        productSummary[productName] = {
          product_name: productName,
          category_name: detail.category_name || 'N/A',
          total_quantity: 0,
          total_sales: 0,
          avg_unit_price: 0
        };
      }
      productSummary[productName].total_quantity += parseFloat(String(detail.quantity)) || 0;
      productSummary[productName].total_sales += parseFloat(String(detail.line_total)) || 0;
    });
    
    // Calculate average unit price for each product
    Object.keys(productSummary).forEach(productName => {
      const product = productSummary[productName];
      if (product.total_quantity > 0) {
        product.avg_unit_price = product.total_sales / product.total_quantity;
      }
    });
    
    // Convert to array and sort by total sales (descending)
    const productsArray = Object.values(productSummary).sort((a, b) => b.total_sales - a.total_sales);

    // Create CSV header
    const headers = ['Product', 'Category', 'Total Quantity', 'Avg Unit Price', 'Total Sales'];
    
    // Create CSV rows
    const rows = productsArray.map(product => [
      product.product_name,
      product.category_name,
      product.total_quantity,
      product.avg_unit_price,
      product.total_sales
    ]);

    // Add total row
    const totalQuantity = productsArray.reduce((sum, p) => sum + p.total_quantity, 0);
    const totalSales = productsArray.reduce((sum, p) => sum + p.total_sales, 0);
    rows.push(['Grand Total', '', totalQuantity, '', totalSales]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Handle cells that might contain commas
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `Products_Sold_${selectedClient?.name}_${selectedMonth === 'total' ? selectedYear : `${monthLabels[months.indexOf(selectedMonth)]}_${selectedYear}`}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const exportToCSV = async () => {
    try {
      setExporting(true);
      
      // Fetch ALL filtered records for export (no pagination)
      const categoryIds = selectedCategories.length > 0 ? selectedCategories : undefined;
      const salesRepIds = selectedSalesReps.length > 0 ? selectedSalesReps : undefined;
      const categoryGroup = selectedCategoryGroup || undefined;
      const startDateParam = startDate || undefined;
      const endDateParam = endDate || undefined;
      const clientStatusParam = clientStatus || undefined;
      
      // Fetch all records with a very large limit
      const result = await salesService.getMasterSalesData(
        selectedYear, 
        categoryIds, 
        salesRepIds, 
        categoryGroup, 
        startDateParam, 
        endDateParam, 
        clientStatusParam, 
        viewType,
        1, // page 1
        999999, // very large limit to get all records
        sortColumn || undefined,
        sortDirection,
        searchQuery.trim() || undefined
      );
      
      const allData = result.data;
      const totals = result.totals || allRecordsTotals;
      
      // Generate CSV content with all records
      const headers = ['Client Name', ...monthLabels, 'Total'];
      const rows = allData.map(client => [
        client.client_name,
        ...months.map(month => {
          const value = parseFloat(String((client as any)[month])) || 0;
          return viewType === 'sales' ? formatCurrency(value) : value.toLocaleString();
        }),
        (() => {
          const total = parseFloat(String(client.total)) || 0;
          return viewType === 'sales' ? formatCurrency(total) : total.toLocaleString();
        })()
      ]);
      
      // Add totals row at the bottom
      if (totals) {
        rows.push([
          'Grand Total',
          ...months.map(month => {
            const monthTotal = parseFloat(String(totals[month])) || 0;
            return viewType === 'sales' ? formatCurrency(monthTotal) : monthTotal.toLocaleString();
          }),
          (() => {
            const grandTotal = parseFloat(String(totals.total)) || 0;
            return viewType === 'sales' ? formatCurrency(grandTotal) : grandTotal.toLocaleString();
          })()
        ]);
      }
      
      // Format CSV with proper escaping
      const csvContent = [
        headers.map(cell => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(','),
        ...rows.map(row => row.map(cell => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().split('T')[0];
      const filterSuffix = [
        selectedYear !== new Date().getFullYear() ? `-${selectedYear}` : '',
        startDate ? `-from-${startDate}` : '',
        endDate ? `-to-${endDate}` : '',
        selectedCategories.length > 0 ? `-${selectedCategories.length}-categories` : '',
        selectedSalesReps.length > 0 ? `-${selectedSalesReps.length}-reps` : '',
        selectedCategoryGroup ? `-${selectedCategoryGroup}` : '',
        clientStatus ? `-${clientStatus}` : '',
        searchQuery.trim() ? `-search-${searchQuery.trim().substring(0, 20)}` : ''
      ].filter(Boolean).join('');
      link.setAttribute('download', `master-${viewType === 'sales' ? 'sales' : 'quantities'}-${selectedYear}-${dateStr}${filterSuffix}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // OPTIMIZED: Server-side sorting, pagination, and search - backend handles all
  // No need for client-side filtering/sorting anymore
  const currentData = salesData; // Data comes sorted, paginated, and filtered from backend
  const sortedData = currentData; // Alias for backward compatibility
  
  // Calculate display range for "Showing X to Y of Z" text
  const startIndex = itemsPerPage === 'all' ? 1 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = itemsPerPage === 'all' ? totalItems : startIndex + currentData.length - 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage: number | 'all') => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleCellClick = async (client: MasterSalesData, month: string) => {
    const monthValue = parseFloat((client as any)[month]) || 0;
    console.log('[handleCellClick] Clicked cell:', { 
      clientId: client.client_id, 
      clientName: client.client_name, 
      month, 
      monthValue 
    });
    
    if (monthValue > 0) {
      console.log('[handleCellClick] Navigating to invoices for client:', client.client_name);
      // Navigate to invoice list with client_id filter
      navigate(`/invoice-list?client_id=${client.client_id}`);
    } else {
      console.log('[handleCellClick] No sales data for this month, not navigating');
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Calculate summary statistics - use backend totals for all filtered records
  const totalValue = allRecordsTotals ? (parseFloat(String(allRecordsTotals.total)) || 0) : 0;
  const totalClients = totalItems; // Use totalItems from backend (all filtered records)
  const avgValuePerClient = totalClients > 0 ? totalValue / totalClients : 0;
  const activeFilters = [
    selectedYear !== new Date().getFullYear(),
    startDate,
    endDate,
    selectedCategories.length > 0,
    selectedSalesReps.length > 0,
    selectedCategoryGroup,
    clientStatus
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-xs text-gray-600 font-medium">Loading master sales data...</p>
          <p className="mt-1 text-[10px] text-gray-500">Please wait while we fetch your sales information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 mb-1">Error Loading Data</h2>
          <p className="text-xs text-gray-600 mb-3">{error}</p>
          <button
            onClick={fetchSalesData}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium text-xs"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        {/* Enhanced Header Section */}
        <div className="mb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-sm font-bold text-gray-900 mb-1">
                Master {viewType === 'sales' ? 'Sales' : 'Quantities'} Report
              </h1>
               
            </div>
            <div className="mt-2 lg:mt-0 flex flex-col sm:flex-row gap-1.5">
              {/* View Type Toggle */}
              <div className="flex items-center gap-1 bg-white rounded-md border border-gray-200 p-0.5">
                <button
                  onClick={() => setViewType('sales')}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    viewType === 'sales'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Sales Value
                </button>
                <button
                  onClick={() => setViewType('quantity')}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                    viewType === 'quantity'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Quantities
                </button>
              </div>
              
              <button
                onClick={() => setShowFilterModal(true)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all duration-200 ${
                  activeFilters > 0
                    ? 'bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-3 w-3" />
                Filters
                {activeFilters > 0 && (
                  <span className="ml-1 bg-orange-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>
              <button
                onClick={exportToCSV}
                disabled={exporting || sortedData.length === 0}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3" />
                    Export CSV
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
               
              <div className="ml-2">
                <p className="text-[10px] font-medium text-gray-600">
                  {viewType === 'sales' ? 'Total Sales' : 'Total Quantities'}
                </p>
                <p className="text-xs font-bold text-gray-900">
                  {viewType === 'sales' ? formatCurrency(totalValue) : totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{totalClients.toLocaleString()}</p>
              </div>
            </div>
          </div> */}
{/* 
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {viewType === 'sales' ? 'Avg Sales/Client' : 'Avg Quantities/Client'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {viewType === 'sales' ? formatCurrency(avgValuePerClient) : Math.round(avgValuePerClient).toLocaleString()}
                </p>
              </div>
            </div>
          </div> */}

          {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Year</p>
                <p className="text-2xl font-bold text-gray-900">{selectedYear}</p>
              </div>
            </div>
          </div> */}
        </div>

        {/* Enhanced Search Bar */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3 mb-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Search className="h-3 w-3 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="block w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs transition-all duration-200"
                  placeholder="Search clients by name..."
                />
                {isRefreshing && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Loader2 className="h-3 w-3 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <BarChart3 className="h-3 w-3" />
              <span>{totalItems} {searchQuery.trim() ? 'filtered' : 'total'} clients</span>
              {isRefreshing && (
                <Loader2 className="h-3 w-3 text-gray-400 animate-spin" />
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Sales Table */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden relative">
          {isRefreshing && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating data...</span>
              </div>
            </div>
          )}
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xs font-semibold text-gray-900">Sales Data</h2>
            <p className="text-[10px] text-gray-600 mt-0.5">Monthly breakdown for all clients</p>
          </div>
          
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-3 py-2 text-left text-[9px] font-semibold text-gray-900 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('client_name')}
                    >
                      <div className="flex items-center gap-1">
                      Client Name
                        {sortColumn === 'client_name' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />
                        ) : (
                          <ArrowUpDown className="h-2.5 w-2.5 text-gray-400" />
                        )}
                      </div>
                    </th>
                    {monthLabels.map((month, index) => {
                      const monthKey = months[index];
                      return (
                        <th 
                          key={month} 
                          className="px-2 py-2 text-right text-[9px] font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                          onClick={() => handleSort(monthKey)}
                        >
                          <div className="flex items-center justify-end gap-1">
                        {month}
                            {sortColumn === monthKey ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />
                            ) : (
                              <ArrowUpDown className="h-2.5 w-2.5 text-gray-400" />
                            )}
                          </div>
                      </th>
                      );
                    })}
                    <th 
                      className="px-3 py-2 text-right text-[9px] font-semibold text-gray-900 uppercase tracking-wider bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors duration-150"
                      onClick={() => handleSort('total')}
                    >
                      <div className="flex items-center justify-end gap-1">
                      Total
                        {sortColumn === 'total' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />
                        ) : (
                          <ArrowUpDown className="h-2.5 w-2.5 text-gray-400" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-3 py-6 text-center">
                        <div className="text-gray-500">
                          <BarChart3 className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                          <p className="text-xs font-medium">No sales data found</p>
                          <p className="text-[10px]">Try adjusting your filters or search criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentData.map((client, index) => (
                      <tr key={client.client_id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-gray-900 sticky left-0 bg-inherit z-10">
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                            {client.client_name}
                          </div>
                        </td>
                        {months.map((month) => {
                          const monthValue = parseFloat(String((client as any)[month])) || 0;
                          return (
                            <td 
                              key={month} 
                              className={`whitespace-nowrap px-2 py-2 text-xs text-right text-gray-900 ${
                                monthValue > 0 ? 'cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150' : ''
                              }`}
                              onClick={() => handleCellClick(client, month)}
                            >
                              {viewType === 'sales' ? formatCurrency(monthValue) : monthValue.toLocaleString()}
                          </td>
                          );
                        })}
                        <td 
                          className={`whitespace-nowrap px-3 py-2 text-xs font-semibold text-right text-blue-900 bg-blue-50 ${
                            parseFloat(String(client.total)) > 0 ? 'cursor-pointer hover:bg-blue-100 transition-colors duration-150' : ''
                          }`}
                          onClick={() => {
                            const totalValue = parseFloat(String(client.total)) || 0;
                            console.log('[Total Column Click] Clicked total for client:', {
                              clientId: client.client_id,
                              clientName: client.client_name,
                              totalValue
                            });
                            
                            if (totalValue > 0) {
                              console.log('[Total Column Click] Navigating to invoices for client:', client.client_name);
                              // Navigate to invoice list with client_id filter
                              navigate(`/invoice-list?client_id=${client.client_id}`);
                            } else {
                              console.log('[Total Column Click] No sales data, not navigating');
                            }
                          }}
                        >
                          {viewType === 'sales' ? formatCurrency(parseFloat(String(client.total)) || 0) : (parseFloat(String(client.total)) || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                
                                 {/* Enhanced Summary Row - using totals from ALL filtered records */}
                 {allRecordsTotals && (
                   <tfoot className="bg-gray-100">
                     <tr>
                       <td className="px-3 py-2 text-xs font-bold text-gray-900 sticky left-0 bg-gray-100 z-10">
                         <div className="flex items-center">
                           <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                           Grand Total
                         </div>
                       </td>
                       {months.map((month) => {
                         const monthTotal = parseFloat(String(allRecordsTotals[month])) || 0;
                         return (
                           <td key={month} className="px-2 py-2 text-xs font-bold text-right text-gray-900">
                             {viewType === 'sales' ? formatCurrency(monthTotal) : monthTotal.toLocaleString()}
                           </td>
                         );
                       })}
                       <td className="px-3 py-2 text-xs font-bold text-right text-green-900 bg-green-100">
                         {viewType === 'sales' ? formatCurrency(parseFloat(String(allRecordsTotals.total)) || 0) : (parseFloat(String(allRecordsTotals.total)) || 0).toLocaleString()}
                       </td>
                     </tr>
                   </tfoot>
                 )}
              </table>
            </div>
          </div>
        </div>

        {/* Enhanced Pagination Controls */}
        {totalItems > 0 && (
          <div className="mt-3 bg-white rounded-md shadow-sm border border-gray-200 p-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              {/* Items per page and info */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-700">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-2 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value="all">View All</option>
                  </select>
                  <span className="text-[10px] text-gray-700">entries per page</span>
                </div>
                <div className="text-[10px] text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                  {itemsPerPage === 'all' 
                    ? `Showing all ${totalItems} results`
                    : `Showing ${startIndex} to ${endIndex} of ${totalItems} results`
                  }
                </div>
              </div>

              {/* Enhanced Pagination buttons - hide when viewing all */}
              {itemsPerPage !== 'all' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-0.5">
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                      disabled={page === '...'}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 ${
                        page === currentPage
                          ? 'bg-blue-600 text-white border border-blue-600'
                          : page === '...'
                          ? 'text-gray-400 cursor-default'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  Next
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-bold text-gray-900">Filter Options</h2>
                    <p className="text-[10px] text-gray-600 mt-0.5">Customize your sales data view</p>
                  </div>
                  <button
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    onClick={() => setShowFilterModal(false)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="px-3 py-3 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Year */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-blue-600" />
                      Year
                    </h3>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="block w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs transition-all duration-200"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-green-600" />
                      Date Range
                    </h3>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs transition-all duration-200"
                        placeholder="Start Date"
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="block w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs transition-all duration-200"
                        placeholder="End Date"
                      />
                    </div>
                  </div>

                  {/* Category Group */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <BarChart3 className="h-3 w-3 text-purple-600" />
                      Category Group
                    </h3>
                    <select
                      value={selectedCategoryGroup}
                      onChange={(e) => setSelectedCategoryGroup(e.target.value)}
                      className="block w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs transition-all duration-200"
                    >
                      <option value="">All Categories</option>
                      <option value="vapes">Vapes</option>
                      <option value="pouches">Pouches</option>
                    </select>
                  </div>

                  {/* Client Status */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-orange-600" />
                      Client Status
                    </h3>
                    <select
                      value={clientStatus}
                      onChange={(e) => setClientStatus(e.target.value)}
                      className="block w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs transition-all duration-200"
                    >
                      <option value="">All Clients</option>
                      <option value="active">Active Clients</option>
                      <option value="inactive">Inactive Clients</option>
                    </select>
                  </div>

                  {/* SKUs */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <BarChart3 className="h-3 w-3 text-indigo-600" />
                      SKUs
                    </h3>
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                      {categories.map(category => (
                        <label key={category.id} className="flex items-center mb-2 cursor-pointer hover:bg-white p-1.5 rounded transition-colors duration-150">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category.id]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                              }
                            }}
                            className="mr-2 h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-xs text-gray-700">{category.name}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedCategories([])}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Sales Reps */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-teal-600" />
                      Sales Representatives
                    </h3>
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                      {salesReps.map(salesRep => (
                        <label key={salesRep.id} className="flex items-center mb-2 cursor-pointer hover:bg-white p-1.5 rounded transition-colors duration-150">
                          <input
                            type="checkbox"
                            checked={selectedSalesReps.includes(salesRep.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSalesReps([...selectedSalesReps, salesRep.id]);
                              } else {
                                setSelectedSalesReps(selectedSalesReps.filter(id => id !== salesRep.id));
                              }
                            }}
                            className="mr-2 h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-xs text-gray-700">{salesRep.name}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedSalesReps([])}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      setSelectedYear(new Date().getFullYear());
                      setStartDate('');
                      setEndDate('');
                      setSelectedCategoryGroup('');
                      setClientStatus('');
                      setSelectedCategories([]);
                      setSelectedSalesReps([]);
                    }}
                    className="px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 transition-colors duration-200 font-medium text-xs"
                  >
                    Clear All Filters
                  </button>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 font-medium text-xs"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Details Modal */}
        {showSalesDetailModal && (() => {
          console.log('[Modal Render] Rendering sales details modal:', {
            selectedClient,
            selectedMonth,
            selectedYear,
            salesDetailsCount: salesDetails.length,
            loadingDetails
          });
          return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden">
              {/* Modal Header */}
              <div className="px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-bold text-gray-900">
                      Sales Details - {selectedClient?.name}
                    </h2>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {selectedMonth === 'total' 
                        ? `All Sales for ${selectedYear}` 
                        : `${monthLabels[months.indexOf(selectedMonth)]} ${selectedYear}`}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {(() => {
                          const uniqueProducts = new Set(salesDetails.map(d => d.product_name));
                          return `${uniqueProducts.size} product${uniqueProducts.size !== 1 ? 's' : ''}`;
                        })()} sold
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Total: {formatCurrency(salesDetails.reduce((sum, detail) => sum + (parseFloat(String(detail.line_total)) || 0), 0))}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportModalToCSV}
                      disabled={salesDetails.length === 0}
                      className="px-2.5 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 font-medium text-xs flex items-center gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Download className="w-3 h-3" />
                      Export CSV
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      onClick={() => setShowSalesDetailModal(false)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="px-3 py-3 max-h-[75vh] overflow-y-auto">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                    <span className="ml-3 text-xs text-gray-600">Loading sales details...</span>
                  </div>
                ) : salesDetails.length === 0 ? (
                  <div className="text-center py-6">
                    <BarChart3 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-xs font-medium text-gray-500">No sales details found</p>
                    <p className="text-[10px] text-gray-400">No products sold for this client and month</p>
                  </div>
                ) : (() => {
                  // Group products by product_name and aggregate quantities and totals
                  const productSummary: { [key: string]: { 
                    product_name: string; 
                    category_name: string; 
                    total_quantity: number; 
                    total_sales: number;
                    avg_unit_price: number;
                  } } = {};
                  
                  salesDetails.forEach((detail) => {
                    const productName = detail.product_name || 'Unknown Product';
                    if (!productSummary[productName]) {
                      productSummary[productName] = {
                        product_name: productName,
                        category_name: detail.category_name || 'N/A',
                        total_quantity: 0,
                        total_sales: 0,
                        avg_unit_price: 0
                      };
                    }
                    productSummary[productName].total_quantity += parseFloat(String(detail.quantity)) || 0;
                    productSummary[productName].total_sales += parseFloat(String(detail.line_total)) || 0;
                  });
                  
                  // Calculate average unit price for each product
                  Object.keys(productSummary).forEach(productName => {
                    const product = productSummary[productName];
                    if (product.total_quantity > 0) {
                      product.avg_unit_price = product.total_sales / product.total_quantity;
                    }
                  });
                  
                  // Convert to array and sort by total sales (descending)
                  const productsArray = Object.values(productSummary).sort((a, b) => b.total_sales - a.total_sales);
                  
                  return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-3 py-2 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                            Total Quantity
                          </th>
                          <th className="px-3 py-2 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                            Avg Unit Price
                          </th>
                          <th className="px-3 py-2 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                            Total Sales
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {productsArray.map((product, index) => (
                          <tr key={product.product_name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                              <div className="font-medium">{product.product_name}</div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                              {product.category_name}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 text-right">
                              {product.total_quantity.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 text-right">
                              {formatCurrency(product.avg_unit_price)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                              {formatCurrency(product.total_sales)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 text-xs font-bold text-gray-900 text-right">
                            Grand Total:
                          </td>
                          <td className="px-3 py-2 text-xs font-bold text-gray-900 text-right">
                            {productsArray.reduce((sum, p) => sum + p.total_quantity, 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2 text-xs font-bold text-gray-900 text-right">
                            {formatCurrency(productsArray.reduce((sum, p) => sum + p.total_sales, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSalesDetailModal(false)}
                    className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 font-medium text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
};

export default MasterSalesPage; 