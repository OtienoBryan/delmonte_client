import React, { useState, useEffect } from 'react';
import { salesService, SalesRepMonthlyPerformance } from '../services/salesService';
import { Search, Download, Filter, TrendingUp, DollarSign, Calendar, BarChart3, X, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, User, Package } from 'lucide-react';

const SalesRepPerformancePage: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<SalesRepMonthlyPerformance[]>([]);
  const [filteredData, setFilteredData] = useState<SalesRepMonthlyPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSalesReps, setSelectedSalesReps] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);
  const [salesReps, setSalesReps] = useState<{ id: number; name: string }[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewType, setViewType] = useState<'sales' | 'quantity'>('sales');

  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedYear, selectedSalesReps, startDate, endDate, viewType, selectedCountry]);

  useEffect(() => {
    fetchCountries();
    fetchSalesReps();
  }, []);

  // Initialize filteredData when performanceData changes
  useEffect(() => {
    if (Array.isArray(performanceData)) {
      if (!searchQuery.trim()) {
        setFilteredData(performanceData);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = performanceData.filter(rep =>
          rep.sales_rep_name && rep.sales_rep_name.toLowerCase().includes(query)
        );
        setFilteredData(filtered);
      }
    } else {
      setFilteredData([]);
    }
    setCurrentPage(1);
  }, [performanceData, searchQuery]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const salesRepIds = selectedSalesReps.length > 0 ? selectedSalesReps : undefined;
      const startDateParam = startDate || undefined;
      const endDateParam = endDate || undefined;
      const countryParam = selectedCountry || undefined;
      console.log('[SalesRepPerformance] ===== FETCHING DATA =====');
      console.log('[SalesRepPerformance] Full params:', { 
        selectedYear, 
        salesRepIds, 
        startDateParam, 
        endDateParam, 
        viewType,
        countryParam
      });
      
      const data = await salesService.getSalesRepMonthlyPerformance(selectedYear, salesRepIds, startDateParam, endDateParam, viewType, countryParam);
      
      console.log('[SalesRepPerformance] ===== DATA RECEIVED =====');
      console.log('[SalesRepPerformance] Data type:', Array.isArray(data) ? 'array' : typeof data);
      console.log('[SalesRepPerformance] Data length:', Array.isArray(data) ? data.length : 'N/A');
      console.log('[SalesRepPerformance] First 3 items:', Array.isArray(data) ? data.slice(0, 3) : data);
      
      setPerformanceData(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[SalesRepPerformance] ===== ERROR =====');
      console.error('[SalesRepPerformance] Error fetching data:', err);
      console.error('[SalesRepPerformance] Error message:', err.message);
      console.error('[SalesRepPerformance] Error response:', err.response);
      setError(err.message || 'Failed to fetch performance data');
      setPerformanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const data = await salesService.getCountries();
      setCountries(data);
    } catch (err: any) {
      console.error('Failed to fetch countries:', err);
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


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-xs text-gray-600 font-medium">Loading sales rep performance data...</p>
          <p className="mt-1 text-[10px] text-gray-500">Please wait while we fetch your performance information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <X className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 mb-1.5">Error Loading Data</h2>
          <p className="text-[10px] text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-[10px] font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const exportToCSV = async () => {
    try {
      setExporting(true);
      const csvContent = generateCSVContent();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().split('T')[0];
      const filterSuffix = [
        selectedYear !== new Date().getFullYear() ? `-${selectedYear}` : '',
        startDate ? `-from-${startDate}` : '',
        endDate ? `-to-${endDate}` : '',
        selectedSalesReps.length > 0 ? `-${selectedSalesReps.length}-reps` : ''
      ].filter(Boolean).join('');
      link.setAttribute('download', `sales-rep-${viewType}-${selectedYear}-${dateStr}${filterSuffix}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const generateCSVContent = () => {
    let headers, rows;
    
    if (viewType === 'quantity') {
      // Quantity view: Match page format - single column per month with vapes/pouches stacked
      headers = ['Sales Rep', 'Country', ...monthLabels, 'Total'];
      
      rows = sortedData.map(rep => {
        const row = [
          rep.sales_rep_name,
          rep.country || (rep.countryId === 1 ? 'Kenya' : rep.countryId === 2 ? 'Tanzania' : 'N/A')
        ];
        
        // Add monthly data in the same format as the page
        months.forEach(month => {
          const vapesValue = parseFloat(String((rep as any)[`${month}_vapes`])) || 0;
          const pouchesValue = parseFloat(String((rep as any)[`${month}_pouches`])) || 0;
          const vapesTarget = parseFloat(String((rep as any)[`${month}_vapes_target`])) || 0;
          const pouchesTarget = parseFloat(String((rep as any)[`${month}_pouches_target`])) || 0;
          
          const vapesPercentage = vapesTarget > 0 ? ((vapesValue / vapesTarget) * 100).toFixed(1) + '%' : '';
          const pouchesPercentage = pouchesTarget > 0 ? ((pouchesValue / pouchesTarget) * 100).toFixed(1) + '%' : '';
          
          // Format like the page: Vapes (Target) % / Pouches (Target) %
          let monthData = '';
          if (vapesValue > 0 || vapesTarget > 0) {
            monthData += `Vapes: ${vapesValue.toLocaleString()}`;
            if (vapesTarget > 0) {
              monthData += ` (Target: ${vapesTarget.toLocaleString()})`;
              if (vapesPercentage) {
                monthData += ` ${vapesPercentage}`;
              }
            }
          }
          
          if (pouchesValue > 0 || pouchesTarget > 0) {
            if (monthData) monthData += ' / ';
            monthData += `Pouches: ${pouchesValue.toLocaleString()}`;
            if (pouchesTarget > 0) {
              monthData += ` (Target: ${pouchesTarget.toLocaleString()})`;
              if (pouchesPercentage) {
                monthData += ` ${pouchesPercentage}`;
              }
            }
          }
          
          row.push(monthData || '0');
        });
        
        // Add total in the same format as the page
        const totalVapes = (rep as any).total_vapes || 0;
        const totalPouches = (rep as any).total_pouches || 0;
        const totalVapesTarget = months.reduce((sum, month) => sum + (parseFloat(String((rep as any)[`${month}_vapes_target`])) || 0), 0);
        const totalPouchesTarget = months.reduce((sum, month) => sum + (parseFloat(String((rep as any)[`${month}_pouches_target`])) || 0), 0);
        
        const totalVapesPercentage = totalVapesTarget > 0 ? ((totalVapes / totalVapesTarget) * 100).toFixed(1) + '%' : '';
        const totalPouchesPercentage = totalPouchesTarget > 0 ? ((totalPouches / totalPouchesTarget) * 100).toFixed(1) + '%' : '';
        
        let totalData = '';
        if (totalVapes > 0 || totalVapesTarget > 0) {
          totalData += `Vapes: ${totalVapes.toLocaleString()}`;
          if (totalVapesTarget > 0) {
            totalData += ` (Target: ${totalVapesTarget.toLocaleString()})`;
            if (totalVapesPercentage) {
              totalData += ` ${totalVapesPercentage}`;
            }
          }
        }
        
        if (totalPouches > 0 || totalPouchesTarget > 0) {
          if (totalData) totalData += ' / ';
          totalData += `Pouches: ${totalPouches.toLocaleString()}`;
          if (totalPouchesTarget > 0) {
            totalData += ` (Target: ${totalPouchesTarget.toLocaleString()})`;
            if (totalPouchesPercentage) {
              totalData += ` ${totalPouchesPercentage}`;
            }
          }
        }
        
        row.push(totalData || '0');
        return row;
      });
    } else {
      // Sales view: Single column for each month
      headers = ['Sales Rep', 'Country', ...monthLabels, 'Total'];
      rows = sortedData.map(rep => [
        rep.sales_rep_name,
        rep.country || (rep.countryId === 1 ? 'Kenya' : rep.countryId === 2 ? 'Tanzania' : 'N/A'),
        ...months.map(month => formatCurrency(parseFloat(String((rep as any)[month])) || 0)),
        formatCurrency(parseFloat(String(rep.total)) || 0)
      ]);
    }
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const getSortedData = () => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      let aValue: any = (a as any)[sortColumn];
      let bValue: any = (b as any)[sortColumn];
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      // Handle numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string comparison
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedData = getSortedData();
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
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

  // Calculate summary statistics
  const totalSales = sortedData.reduce((sum, rep) => {
    if (viewType === 'quantity') {
      return sum + (parseFloat(String(rep.total_vapes || 0)) || 0) + (parseFloat(String(rep.total_pouches || 0)) || 0);
    } else {
      return sum + (parseFloat(String(rep.total)) || 0);
    }
  }, 0);
  const totalReps = sortedData.length;
  const avgSalesPerRep = totalReps > 0 ? totalSales / totalReps : 0;
  const activeFilters = [
    selectedYear !== new Date().getFullYear(),
    startDate,
    endDate,
    selectedSalesReps.length > 0
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
        {/* Compact Header Section */}
        <div className="mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h1 className="text-base font-bold text-gray-900 mb-1">Sales Rep Performance</h1>
              <p className="text-[10px] text-gray-600">Monthly sales performance by sales representative</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowFilterModal(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  activeFilters > 0
                    ? 'bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-3 w-3" />
                Filters
                {activeFilters > 0 && (
                  <span className="ml-1 bg-orange-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>
              <button
                onClick={exportToCSV}
                disabled={exporting || sortedData.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

        {/* View Type Toggle */}
        <div className="mb-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-gray-900">View Type</h3>
                <p className="text-[10px] text-gray-600">Choose between sales values or quantities sold</p>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewType('sales')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                    viewType === 'sales'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sales Values
                </button>
                <button
                  onClick={() => setViewType('quantity')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                    viewType === 'quantity'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Quantities Sold
                </button>
              </div>
            </div>
            {viewType === 'quantity' && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-orange-500 rounded"></div>
                      <span className="text-gray-700">Vapes (Categories 1, 3)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded"></div>
                      <span className="text-gray-700">Pouches (Categories 4, 5)</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-600">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span>• <span className="font-medium text-green-600">Green %</span> = 100%+ target achieved</span>
                      <span>• <span className="font-medium text-yellow-600">Yellow %</span> = 80-99% target achieved</span>
                      <span>• <span className="font-medium text-red-600">Red %</span> = Below 80% target</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 hidden">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                {viewType === 'quantity' ? (
                  <Package className="h-6 w-6 text-blue-600" />
                ) : (
                  <DollarSign className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {viewType === 'quantity' ? 'Total Quantities' : 'Total Sales'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {viewType === 'quantity' ? totalSales.toLocaleString() : formatCurrency(totalSales)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sales Reps</p>
                <p className="text-2xl font-bold text-gray-900">{totalReps.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {viewType === 'quantity' ? 'Avg Quantities/Rep' : 'Avg Sales/Rep'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {viewType === 'quantity' ? avgSalesPerRep.toLocaleString() : formatCurrency(avgSalesPerRep)}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Search sales reps, countries, regions, or routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[10px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Performance Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th 
                    className="px-3 py-2 text-left text-[10px] font-semibold text-gray-900 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('sales_rep_name')}
                  >
                    <div className="flex items-center gap-1">
                      Sales Rep
                      {sortColumn === 'sales_rep_name' ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-[10px] font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('country')}
                  >
                    <div className="flex items-center gap-1">
                      Country
                      {sortColumn === 'country' ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </th>
                  {viewType === 'quantity' ? (
                    // Quantity view: Show single column for each month with vapes/pouches stacked
                    monthLabels.map((month, index) => {
                      const monthKey = months[index];
                      return (
                        <th 
                          key={month}
                          className="px-2 py-2 text-center text-[10px] font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="text-gray-700 font-bold">{month}</div>
                            <div className="flex justify-center gap-2 text-[10px]">
                              <div 
                                className="flex items-center gap-0.5 cursor-pointer hover:text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSort(`${monthKey}_vapes`);
                                }}
                              >
                                <span className="text-orange-600">V</span>
                                {sortColumn === `${monthKey}_vapes` ? (
                                  sortDirection === 'asc' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />
                                ) : (
                                  <ArrowUpDown className="h-2.5 w-2.5 text-gray-400" />
                                )}
                              </div>
                              <div 
                                className="flex items-center gap-0.5 cursor-pointer hover:text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSort(`${monthKey}_pouches`);
                                }}
                              >
                                <span className="text-green-600">P</span>
                                {sortColumn === `${monthKey}_pouches` ? (
                                  sortDirection === 'asc' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />
                                ) : (
                                  <ArrowUpDown className="h-2.5 w-2.5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        </th>
                      );
                    })
                  ) : (
                    // Sales view: Show single column for each month
                    monthLabels.map((month, index) => {
                      const monthKey = months[index];
                      return (
                        <th 
                          key={month} 
                          className="px-2 py-2 text-right text-[10px] font-semibold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort(monthKey)}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {month}
                            {sortColumn === monthKey ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        </th>
                      );
                    })
                  )}
                  <th 
                    className="px-3 py-2 text-right text-[10px] font-semibold text-gray-900 uppercase tracking-wider bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => handleSort('total')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Total
                      {sortColumn === 'total' ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </th>
            </tr>
          </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan={viewType === 'quantity' ? 15 : 15} className="px-3 py-8 text-center">
                      <div className="text-gray-500">
                        <BarChart3 className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                        <p className="text-xs font-medium">No performance data found</p>
                        <p className="text-[10px]">Try adjusting your filters or search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentData.map((rep, index) => (
                    <tr key={rep.sales_rep_id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-gray-900 sticky left-0 bg-inherit z-10">
                        <div className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                          {rep.sales_rep_name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] text-gray-600">
                        {rep.country || (rep.countryId === 1 ? 'Kenya' : rep.countryId === 2 ? 'Tanzania' : 'N/A')}
                      </td>
                      {viewType === 'quantity' ? (
                        // Quantity view: Show vapes and pouches stacked vertically for each month with targets
                        months.map((month) => {
                          const vapesValue = parseFloat(String((rep as any)[`${month}_vapes`])) || 0;
                          const pouchesValue = parseFloat(String((rep as any)[`${month}_pouches`])) || 0;
                          const vapesTarget = parseFloat(String((rep as any)[`${month}_vapes_target`])) || 0;
                          const pouchesTarget = parseFloat(String((rep as any)[`${month}_pouches_target`])) || 0;
                          
                          const vapesPercentage = vapesTarget > 0 ? (vapesValue / vapesTarget) * 100 : 0;
                          const pouchesPercentage = pouchesTarget > 0 ? (pouchesValue / pouchesTarget) * 100 : 0;
                          
                          return (
                            <td key={month} className="px-2 py-2 text-center text-[10px] text-gray-900">
                              <div className="space-y-1.5">
                                {/* Vapes */}
                                <div className="space-y-0.5">
                                  <div className="text-orange-600 font-medium">
                                    {vapesValue.toLocaleString()}
                                  </div>
                                  {vapesTarget > 0 && (
                                    <div className="text-[10px] text-gray-500">
                                      Target: {vapesTarget.toLocaleString()}
                                    </div>
                                  )}
                                  {vapesTarget > 0 && (
                                    <div className={`text-[10px] font-medium ${
                                      vapesPercentage >= 100 ? 'text-green-600' : 
                                      vapesPercentage >= 80 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {vapesPercentage.toFixed(1)}%
                                    </div>
                                  )}
                                </div>
                                
                                {/* Pouches */}
                                <div className="space-y-0.5">
                                  <div className="text-green-600 font-medium">
                                    {pouchesValue.toLocaleString()}
                                  </div>
                                  {pouchesTarget > 0 && (
                                    <div className="text-[10px] text-gray-500">
                                      Target: {pouchesTarget.toLocaleString()}
                                    </div>
                                  )}
                                  {pouchesTarget > 0 && (
                                    <div className={`text-[10px] font-medium ${
                                      pouchesPercentage >= 100 ? 'text-green-600' : 
                                      pouchesPercentage >= 80 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {pouchesPercentage.toFixed(1)}%
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })
                      ) : (
                        // Sales view: Show single value for each month
                        months.map((month) => {
                          const monthValue = parseFloat(String((rep as any)[month])) || 0;
                          return (
                            <td 
                              key={month} 
                              className="whitespace-nowrap px-2 py-2 text-[10px] text-right text-gray-900"
                            >
                              {formatCurrency(monthValue)}
                            </td>
                          );
                        })
                      )}
                      <td className="whitespace-nowrap px-3 py-2 text-[10px] font-semibold text-right text-blue-900 bg-blue-50">
                        {viewType === 'quantity' ? (
                          <div className="space-y-0.5">
                            <div>Vapes: {((rep as any).total_vapes || 0).toLocaleString()}</div>
                            <div>Pouches: {((rep as any).total_pouches || 0).toLocaleString()}</div>
                          </div>
                        ) : (
                          formatCurrency(parseFloat(String(rep.total)) || 0)
                    )}
                  </td>
                </tr>
                  ))
                )}
          </tbody>
              
              {/* Enhanced Summary Row */}
              {sortedData.length > 0 && (
                <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200">
                  <tr>
                    <td className="px-3 py-2 text-[10px] font-bold text-gray-900 sticky left-0 bg-gray-100 z-10">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Grand Total
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[10px] font-bold text-gray-900"></td>
                    {viewType === 'quantity' ? (
                      // Quantity view: Show vapes and pouches totals stacked vertically for each month with targets
                      months.map((month) => {
                        const vapesTotal = sortedData.reduce((sum, rep) => {
                          const vapesValue = (rep as any)[`${month}_vapes`];
                          return sum + (parseFloat(String(vapesValue)) || 0);
                        }, 0);
                        const pouchesTotal = sortedData.reduce((sum, rep) => {
                          const pouchesValue = (rep as any)[`${month}_pouches`];
                          return sum + (parseFloat(String(pouchesValue)) || 0);
                        }, 0);
                        const vapesTargetTotal = sortedData.reduce((sum, rep) => {
                          const vapesTarget = (rep as any)[`${month}_vapes_target`];
                          return sum + (parseFloat(String(vapesTarget)) || 0);
                        }, 0);
                        const pouchesTargetTotal = sortedData.reduce((sum, rep) => {
                          const pouchesTarget = (rep as any)[`${month}_pouches_target`];
                          return sum + (parseFloat(String(pouchesTarget)) || 0);
                        }, 0);
                        
                        const vapesPercentage = vapesTargetTotal > 0 ? (vapesTotal / vapesTargetTotal) * 100 : 0;
                        const pouchesPercentage = pouchesTargetTotal > 0 ? (pouchesTotal / pouchesTargetTotal) * 100 : 0;
                        
                        return (
                          <td key={month} className="px-2 py-2 text-center text-[10px] font-bold text-gray-900">
                            <div className="space-y-1.5">
                              {/* Vapes Total */}
                              <div className="space-y-0.5">
                                <div className="text-orange-600">
                                  {vapesTotal.toLocaleString()}
                                </div>
                                {vapesTargetTotal > 0 && (
                                  <div className="text-[10px] text-gray-500 font-normal">
                                    Target: {vapesTargetTotal.toLocaleString()}
                                  </div>
                                )}
                                {vapesTargetTotal > 0 && (
                                  <div className={`text-[10px] font-medium ${
                                    vapesPercentage >= 100 ? 'text-green-600' : 
                                    vapesPercentage >= 80 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {vapesPercentage.toFixed(1)}%
                                  </div>
                                )}
                              </div>
                              
                              {/* Pouches Total */}
                              <div className="space-y-0.5">
                                <div className="text-green-600">
                                  {pouchesTotal.toLocaleString()}
                                </div>
                                {pouchesTargetTotal > 0 && (
                                  <div className="text-[10px] text-gray-500 font-normal">
                                    Target: {pouchesTargetTotal.toLocaleString()}
                                  </div>
                                )}
                                {pouchesTargetTotal > 0 && (
                                  <div className={`text-[10px] font-medium ${
                                    pouchesPercentage >= 100 ? 'text-green-600' : 
                                    pouchesPercentage >= 80 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {pouchesPercentage.toFixed(1)}%
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })
                    ) : (
                      // Sales view: Show single total for each month
                      months.map((month) => {
                        const monthTotal = sortedData.reduce((sum, rep) => {
                          const monthValue = (rep as any)[month];
                          return sum + (parseFloat(String(monthValue)) || 0);
                        }, 0);
                        return (
                          <td key={month} className="px-2 py-2 text-[10px] font-bold text-right text-gray-900">
                            {formatCurrency(monthTotal)}
                          </td>
                        );
                      })
                    )}
                    <td className="px-3 py-2 text-[10px] font-bold text-right text-green-900 bg-green-100">
                      {viewType === 'quantity' ? (
                        <div className="space-y-0.5">
                          <div>Vapes: {sortedData.reduce((sum, rep) => sum + (parseFloat(String((rep as any).total_vapes)) || 0), 0).toLocaleString()}</div>
                          <div>Pouches: {sortedData.reduce((sum, rep) => sum + (parseFloat(String((rep as any).total_pouches)) || 0), 0).toLocaleString()}</div>
                        </div>
                      ) : (
                        formatCurrency(sortedData.reduce((sum, rep) => sum + (parseFloat(String(rep.total)) || 0), 0))
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
        </table>
      </div>
    </div>

        {/* Compact Pagination Controls */}
        {totalItems > 0 && (
          <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Items per page and info */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-700">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-[10px] text-gray-700">entries per page</span>
                </div>
                <div className="text-[10px] text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                </div>
              </div>

              {/* Compact Pagination buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
                      className={`px-2 py-1 text-[10px] font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
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
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Next
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compact Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Filter Options</h2>
                    <p className="text-[10px] text-gray-600 mt-0.5">Customize your performance data view</p>
                  </div>
                  <button
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowFilterModal(false)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Year */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      Year
                    </h3>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="block w-full px-2.5 py-1.5 text-[10px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-green-600" />
                      Date Range
                    </h3>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full px-2.5 py-1.5 text-[10px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Start Date"
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="block w-full px-2.5 py-1.5 text-[10px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="End Date"
                      />
                    </div>
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
                      Country
                    </h3>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="block w-full px-2.5 py-1.5 text-[10px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">All Countries</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.name}>{country.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sales Reps */}
                  <div className="space-y-2 md:col-span-2">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-purple-600" />
                      Sales Reps
                    </h3>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {salesReps.map(rep => (
                        <label key={rep.id} className="flex items-center space-x-2 py-1 hover:bg-gray-50 rounded px-1.5">
                          <input
                            type="checkbox"
                            checked={selectedSalesReps.includes(rep.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSalesReps([...selectedSalesReps, rep.id]);
                              } else {
                                setSelectedSalesReps(selectedSalesReps.filter(id => id !== rep.id));
                              }
                            }}
                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-[10px] text-gray-700">{rep.name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setSelectedSalesReps(salesReps.map(rep => rep.id))}
                        className="text-[10px] px-2.5 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedSalesReps([])}
                        className="text-[10px] px-2.5 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedYear(new Date().getFullYear());
                    setStartDate('');
                    setEndDate('');
                    setSelectedCountry('');
                    setSelectedSalesReps([]);
                  }}
                  className="px-3 py-1.5 text-[10px] text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-3 py-1.5 text-[10px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesRepPerformancePage; 