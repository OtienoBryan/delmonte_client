import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  myVisibilityReportService, 
  MyVisibilityReport, 
  PaginationInfo 
} from '../services/myVisibilityReportService';
import { DateTime } from 'luxon';
import { 
  Eye, 
  Calendar, 
  User, 
  MessageSquare, 
  Image, 
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

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

const MyVisibilityPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<MyVisibilityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('');
  const [selectedPhotoType, setSelectedPhotoType] = useState<string>('');
  const [outlets, setOutlets] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [salesReps, setSalesReps] = useState<string[]>([]);
  const [photoTypes, setPhotoTypes] = useState<string[]>([]);
  const [defaultCountrySet, setDefaultCountrySet] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 7,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [pageSize, setPageSize] = useState<number>(7);
  
  // Set current date as default
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);

  // Debounced search query
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await myVisibilityReportService.getFilterOptions();
        setOutlets(options.outlets);
        setCountries(options.countries);
        setSalesReps(options.salesReps);
        setPhotoTypes(options.photoTypes || []);
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };
    loadFilterOptions();
  }, []);

  // Fetch user's country and set default filter
  useEffect(() => {
    const fetchUserCountry = async () => {
      // Only set default once
      if (!user?.id || countries.length === 0 || defaultCountrySet) return;
      
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get(`${API_BASE_URL}/staff/${user.id}`, { headers });
        const staffData = response.data;
        const userCountry = staffData.country || staffData.country_id || staffData.countryId;
        
        // Set default country based on user's country
        // country = 1 means Kenya, country = 2 means Tanzania
        if (userCountry === 1 || userCountry === '1') {
          // Find Kenya in the countries list (countries are strings)
          const kenyaCountry = countries.find(c => c.toLowerCase() === 'kenya');
          if (kenyaCountry) {
            setSelectedCountry(kenyaCountry);
          } else {
            setSelectedCountry('Kenya');
          }
          setDefaultCountrySet(true);
        } else if (userCountry === 2 || userCountry === '2') {
          // Find Tanzania in the countries list (countries are strings)
          const tanzaniaCountry = countries.find(c => c.toLowerCase() === 'tanzania');
          if (tanzaniaCountry) {
            setSelectedCountry(tanzaniaCountry);
          } else {
            setSelectedCountry('Tanzania');
          }
          setDefaultCountrySet(true);
        }
      } catch (error) {
        console.error('Failed to fetch user country:', error);
        // Default to Kenya if we can't fetch the user's country
        if (!defaultCountrySet) {
          setSelectedCountry('Kenya');
          setDefaultCountrySet(true);
        }
      }
    };
    
    fetchUserCountry();
  }, [user?.id, countries, defaultCountrySet]);

  // Fetch reports with server-side filtering and pagination
  const fetchReports = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await myVisibilityReportService.getAll({
        page,
        limit: pageSize,
        search: debouncedSearch,
        outlet: selectedOutlet,
        country: selectedCountry,
        salesRep: selectedSalesRep,
        photoType: selectedPhotoType,
        startDate,
        endDate
      });
      setReports(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch my visibility reports');
    }
    setLoading(false);
  }, [pageSize, debouncedSearch, selectedOutlet, selectedCountry, selectedSalesRep, selectedPhotoType, startDate, endDate]);

  // Fetch reports when filters change
  useEffect(() => {
    fetchReports(1);
  }, [fetchReports]);

  // Memoized date formatter (no timezone conversion; show DB time as-is)
  const formatDate = useMemo(() => {
    return (dateString: string) => {
      if (!dateString) return 'N/A';

      // Try SQL datetime like "YYYY-MM-DD HH:mm:ss"
      let dt = DateTime.fromSQL(dateString);
      if (dt.isValid) {
        return dt.toFormat('d LLL yyyy, HH:mm');
      }

      // Try ISO; preserve provided zone if any without converting
      dt = DateTime.fromISO(dateString, { setZone: true });
      if (dt.isValid) {
        return dt.toFormat('d LLL yyyy, HH:mm');
      }

      // Fallback: return original string to keep it exactly as in DB
      return dateString;
    };
  }, []);

  const handleImageClick = useCallback((imageUrl: string) => {
    window.open(imageUrl, '_blank');
  }, []);

  const exportToCSV = useCallback(() => {
    const headers = ['Outlet', 'Company', 'Photo Type', 'Sales Rep', 'Comment', 'Created At'];
    const csvData = reports.map(report => [
      report.outletName || '',
      report.companyName || '',
      report.photoType || '',
      report.salesRep || '',
      report.comment,
      // Use raw DB value for CSV to avoid any conversion
      report.createdAt || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-visibility-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [reports, formatDate]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedOutlet('');
    setSelectedCountry('');
    setSelectedSalesRep('');
    setSelectedPhotoType('');
    setStartDate(today);
    setEndDate(today);
  }, [today]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchReports(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchReports]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    // Reset to page 1 when changing page size
    fetchReports(1);
  }, [fetchReports]);

  const hasActiveFilters = searchQuery || selectedOutlet || selectedCountry || selectedSalesRep || selectedPhotoType || startDate !== today || endDate !== today;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">My Visibility Reports</h1>
                <p className="text-[10px] text-gray-600">Track and manage your product visibility reports</p>
              </div>
            </div>
           
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-col gap-3 flex-1">
              {/* First Row: Search and Dropdowns */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search outlets or comments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-md leading-4 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                  />
                </div>

                {/* Outlet Filter */}
                <select
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="block w-full sm:w-40 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                >
                  <option value="">All Outlets</option>
                  {outlets.map(outlet => (
                    <option key={outlet} value={outlet}>{outlet}</option>
                  ))}
                </select>

                {/* Country Filter */}
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="block w-full sm:w-40 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>

                {/* Sales Rep Filter */}
                <select
                  value={selectedSalesRep}
                  onChange={(e) => setSelectedSalesRep(e.target.value)}
                  className="block w-full sm:w-40 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                >
                  <option value="">All Sales Reps</option>
                  {salesReps.map(rep => (
                    <option key={rep} value={rep}>{rep}</option>
                  ))}
                </select>

                {/* Photo Type Filter */}
                <select
                  value={selectedPhotoType}
                  onChange={(e) => setSelectedPhotoType(e.target.value)}
                  className="block w-full sm:w-40 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                >
                  <option value="">All Photo Types</option>
                  {photoTypes.map(photoType => (
                    <option key={photoType} value={photoType}>{photoType}</option>
                  ))}
                </select>
              </div>

              {/* Second Row: Date Range */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-[10px] font-medium text-gray-700">Date Range:</span>
                </div>
                
                {/* Start Date */}
                <div className="flex-1 max-w-xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    placeholder="Start Date"
                  />
                </div>

                {/* End Date */}
                <div className="flex-1 max-w-xs">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    placeholder="End Date"
                  />
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reset to Today
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => fetchReports(pagination.currentPage)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                disabled={reports.length === 0}
                className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-[10px] font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-3 w-3 mr-1.5" />
                Export CSV
        </button>
      </div>
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-gray-600">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                    Search: "{searchQuery}"
                  </span>
                )}
                {selectedOutlet && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                    Outlet: {selectedOutlet}
                  </span>
                )}
                {selectedCountry && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-800">
                    Country: {selectedCountry}
                  </span>
                )}
                {selectedSalesRep && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-800">
                    Sales Rep: {selectedSalesRep}
                  </span>
                )}
                {selectedPhotoType && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-pink-100 text-pink-800">
                    Photo Type: {selectedPhotoType}
                  </span>
                )}
                {startDate && endDate && startDate === endDate && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800">
                    Date: {startDate}
                  </span>
                )}
                {startDate && endDate && startDate !== endDate && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800">
                    Date: {startDate} to {endDate}
                  </span>
                )}
                {(startDate && !endDate) && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800">
                    From: {startDate}
                  </span>
                )}
                {(!startDate && endDate) && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-800">
                    Until: {endDate}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reports Table */}
      {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-[10px] text-gray-600">Loading visibility reports...</p>
            </div>
          </div>
      ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2">
                <h3 className="text-[10px] font-medium text-red-800">Error loading reports</h3>
                <p className="mt-0.5 text-[10px] text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Eye className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-[10px] font-medium text-gray-900">No visibility reports found</h3>
            <p className="mt-1 text-[10px] text-gray-500">
              {hasActiveFilters 
                ? 'Try adjusting your search or filters.' 
                : `No visibility reports found for today (${today}).`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Photo Type
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Outlet
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Sales Rep
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Comment
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-150">
                      {/* Image Column */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          {report.imageUrl ? (
                            <div className="relative">
                              <img
                                src={report.imageUrl}
                                alt="Visibility Report"
                                loading="lazy"
                                className="h-12 w-12 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleImageClick(report.imageUrl)}
                              />
                              <div className="absolute -top-1 -right-1">
                                <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[8px] font-medium bg-blue-100 text-blue-800">
                                  <Eye className="h-2 w-2" />
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-12 w-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <Image className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Photo Type Column */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">
                          {report.photoType || '-'}
                        </div>
                      </td>

                      {/* Outlet Column */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] font-medium text-gray-900">
                          {report.outletName || 'Unknown Outlet'}
                        </div>
                         
                      </td>

                      {/* Sales Rep Column */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {report.salesRep ? (
                          <div className="flex items-center">
                            <User className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-[10px] text-gray-900">{report.salesRep}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-500">N/A</span>
                      )}
                    </td>

                      {/* Comment Column */}
                      <td className="px-3 py-2">
                        <div className="max-w-xs">
                          <div className="flex items-start">
                            <MessageSquare className="h-3 w-3 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] text-gray-900 line-clamp-2">
                              {report.comment || 'No comment provided'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Created At Column */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-[10px] text-gray-900">{formatDate(report.createdAt)}</span>
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
        {reports.length > 0 && (
          <div className="mt-3 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex flex-col gap-3">
              {/* Page Size Selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label htmlFor="pageSize" className="text-[10px] text-gray-600 font-medium">Records per page:</label>
                  <select
                    id="pageSize"
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded-md text-[10px] font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={7}>7</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={pagination.totalRecords || 999999}>All</option>
                  </select>
                </div>
                
                <div className="text-[10px] text-gray-600">
                  {pageSize >= pagination.totalRecords ? (
                    `Showing all ${pagination.totalRecords} reports`
                  ) : (
                    `Showing ${((pagination.currentPage - 1) * pagination.limit) + 1} to ${Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of ${pagination.totalRecords} reports`
                  )}
                </div>
              </div>

              {/* Pagination Buttons - Hidden when showing all records */}
              {pageSize < pagination.totalRecords && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={!pagination.hasPrevPage}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-2 py-1 rounded-md text-[10px] font-medium ${
                            pagination.currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={!pagination.hasNextPage}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                  </div>

                  <div className="text-[10px] text-gray-500 hidden sm:block">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                </div>
              )}
            </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default MyVisibilityPage; 