import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackReportService, FeedbackReport, FeedbackReportFilters, PaginationInfo, Outlet, SalesRep } from '../services/feedbackReportService';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// Filter Modal Component
const FilterModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  startDate: string;
  endDate: string;
  selectedOutlet: string;
  selectedSalesRep: string;
  searchQuery: string;
  outlets: Outlet[];
  salesReps: SalesRep[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onOutletChange: (outlet: string) => void;
  onSalesRepChange: (salesRep: string) => void;
  onSearchChange: (query: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}> = ({ 
  isOpen, 
  onClose, 
  startDate, 
  endDate, 
  selectedOutlet, 
  selectedSalesRep, 
  searchQuery,
  outlets, 
  salesReps,
  onStartDateChange,
  onEndDateChange,
  onOutletChange,
  onSalesRepChange,
  onSearchChange,
  onApplyFilters,
  onResetFilters
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Filter Reports
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Search */}
              <div>
                <label htmlFor="modal-search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="modal-search"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search outlet, comment, sales rep..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Search in outlet name, comment, or sales rep
                </p>
              </div>

              {/* Date Range */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Date Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-start-date" className="block text-xs text-gray-600 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      id="modal-start-date"
                      value={startDate}
                      onChange={(e) => onStartDateChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-end-date" className="block text-xs text-gray-600 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      id="modal-end-date"
                      value={endDate}
                      onChange={(e) => onEndDateChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Outlet Filter */}
              <div>
                <label htmlFor="modal-outlet-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Outlet
                </label>
                <select
                  id="modal-outlet-filter"
                  value={selectedOutlet}
                  onChange={(e) => onOutletChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Outlets</option>
                  {outlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.name}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sales Rep Filter */}
              <div>
                <label htmlFor="modal-sales-rep-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Sales Representative
                </label>
                <select
                  id="modal-sales-rep-filter"
                  value={selectedSalesRep}
                  onChange={(e) => onSalesRepChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sales Reps</option>
                  {salesReps.map((salesRep) => (
                    <option key={salesRep.id} value={salesRep.name}>
                      {salesRep.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={() => {
                onApplyFilters();
                onClose();
              }}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => {
                onResetFilters();
                onClose();
              }}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Search Bar Component
const SearchBar: React.FC<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  placeholder?: string;
}> = ({ searchQuery, onSearchChange, onSearch, placeholder = "Search reports..." }) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        onClick={onSearch}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  );
};



const FeedbackReportPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchReports = async (filters?: FeedbackReportFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await feedbackReportService.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setReports(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch feedback reports');
    }
    setLoading(false);
  };

  const fetchOutlets = async () => {
    try {
      const outletsData = await feedbackReportService.getOutlets();
      setOutlets(outletsData);
    } catch (err: any) {
      console.error('Failed to fetch outlets:', err);
    }
  };

  const fetchSalesReps = async () => {
    try {
      const salesRepsData = await feedbackReportService.getSalesReps();
      setSalesReps(salesRepsData);
    } catch (err: any) {
      console.error('Failed to fetch sales reps:', err);
    }
  };

  useEffect(() => {
    fetchOutlets();
    fetchSalesReps();
  }, []);

  useEffect(() => {
    // Default to current date range
    const filters: FeedbackReportFilters = { startDate, endDate };
    if (selectedOutlet !== 'all') {
      filters.outlet = selectedOutlet;
    }
    if (selectedSalesRep !== 'all') {
      filters.salesRep = selectedSalesRep;
    }
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    fetchReports(filters);
  }, [startDate, endDate, selectedOutlet, selectedSalesRep, searchQuery, pagination.page, pagination.limit]);

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleOutletChange = (outlet: string) => {
    setSelectedOutlet(outlet);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSalesRepChange = (salesRep: string) => {
    setSelectedSalesRep(salesRep);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleViewAll = () => {
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    fetchReports(); // No filters - will default to current date
  };

  const handleResetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setSelectedOutlet('all');
    setSelectedSalesRep('all');
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExportCSV = async () => {
    setExporting(true);
    setError(null);
    try {
      const filters: FeedbackReportFilters = { startDate, endDate };
      if (selectedOutlet !== 'all') {
        filters.outlet = selectedOutlet;
      }
      if (selectedSalesRep !== 'all') {
        filters.salesRep = selectedSalesRep;
      }
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      await feedbackReportService.exportToCSV(filters);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    }
    setExporting(false);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 })); // Reset to first page
  };



  const renderPagination = () => {
    const { page, totalPages, total, limit } = pagination;
    const isViewAll = limit === total;
    
    if (isViewAll) {
      return (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] text-gray-700">
              Showing all {total} results
            </span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={-1}>All</option>
            </select>
          </div>
        </div>
      );
    }
    
    if (totalPages <= 1) return null;

    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <span className="text-[10px] text-gray-700">
            Showing {startItem} to {endItem} of {total} results
          </span>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={-1}>All</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-2 py-1 text-[10px] border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-2 py-1 text-[10px] border rounded-md ${
                  page === pageNum
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-2 py-1 text-[10px] border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const formatDateRange = () => {
    const start = new Date(startDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const end = new Date(endDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    if (startDate === endDate) {
      return start;
    }
    return `${start} - ${end}`;
  };

  const getSelectedOutletName = () => {
    if (selectedOutlet === 'all') return 'All Outlets';
    const outlet = outlets.find(o => o.name === selectedOutlet);
    return outlet ? outlet.name : selectedOutlet;
  };

  const getSelectedSalesRepName = () => {
    if (selectedSalesRep === 'all') return 'All Sales Reps';
    const salesRep = salesReps.find(s => s.name === selectedSalesRep);
    return salesRep ? salesRep.name : selectedSalesRep;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (startDate !== endDate) count++;
    if (selectedOutlet !== 'all') count++;
    if (selectedSalesRep !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  };

  const navigate = useNavigate();

  return (
    <div className="max-w-8xl mx-auto py-8 px-4">
      {/* Navigation Links */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => navigate('/visibility-report')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 cursor-pointer text-[10px]"
        >
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          View Visibility Reports
        </button>
        <button
          onClick={() => navigate('/availability-reports')}
          className="inline-flex items-center text-green-600 hover:text-green-800 font-medium transition-colors duration-200 cursor-pointer text-[10px]"
        >
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          View Availability Reports
        </button>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-900">Feedback Report</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="bg-white text-gray-700 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 flex items-center space-x-2 text-[10px]"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <span>Filters</span>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-blue-600 text-white text-[8px] rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>
          <button
            onClick={handleViewAll}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-[10px]"
          >
            View All
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-[10px]"
          >
            {exporting ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSearch={handleSearch}
          placeholder="Search outlet, comment, country, sales rep..."
        />
      </div>

      {/* Date Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <h2 className="text-xs font-semibold text-blue-900">
                Reports for {formatDateRange()}
              </h2>
              <p className="text-[10px] text-blue-700">
                {startDate === endDate ? 'Single Date' : 'Date Range'} • {getSelectedOutletName()} • {getSelectedSalesRepName()}
                {searchQuery.trim() && ` • Search: "${searchQuery}"`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-blue-600 font-medium">
              {reports.length} {reports.length === 1 ? 'report' : 'reports'} found
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-[10px]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-[10px] text-gray-600">Loading feedback reports...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Outlet
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Comment
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-[10px] font-medium text-gray-900">{report.outlet || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-[10px] text-gray-900">{report.country || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-[10px] text-gray-900">{report.salesRep || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-[10px] text-gray-900">{report.comment || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-[10px] text-gray-900">
                        {new Date(report.createdAt).toLocaleString()}
                      </div>
                    </td>

                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-2 text-center text-[10px] text-gray-500">
                      No feedback reports found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        startDate={startDate}
        endDate={endDate}
        selectedOutlet={selectedOutlet}
        selectedSalesRep={selectedSalesRep}
        searchQuery={searchQuery}
        outlets={outlets}
        salesReps={salesReps}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onOutletChange={handleOutletChange}
        onSalesRepChange={handleSalesRepChange}
        onSearchChange={handleSearchChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />


    </div>
  );
};

export default FeedbackReportPage; 