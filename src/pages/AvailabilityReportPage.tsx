import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  availabilityReportService, 
  AvailabilityReport, 
  AvailabilityReportFilters 
} from '../services/availabilityReportService';
import {
  BarChart3Icon,
  FilterIcon,
  DownloadIcon,
  EyeIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AvailabilityReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Set default filters to today's date for performance optimization
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const [filters, setFilters] = useState<AvailabilityReportFilters>({
    startDate: getTodayDate(),
    endDate: getTodayDate(),
    country: '',
    productSku: ''
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [salesReps, setSalesReps] = useState<string[]>([]);
  const [skus, setSkus] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [allReports, setAllReports] = useState<AvailabilityReport[]>([]);
  const [allFetchedReports, setAllFetchedReports] = useState<AvailabilityReport[]>([]); // Store all fetched reports for client-side filtering
  const [defaultCountrySet, setDefaultCountrySet] = useState<boolean>(false);

  // Fetch reports only when filters change (not when search changes)
  useEffect(() => {
    fetchReports();
    fetchFilterData();
  }, [filters]); // Removed 'search' from dependencies

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Fetch a large number of records (1000) to ensure we have enough for grouping
      // Don't pass search to API - we'll filter client-side
      const response = await availabilityReportService.getAvailabilityReports(
        filters,
        1,
        1000,
        '' // Empty search - fetch all matching filter criteria
      );
      
      // Debug: Log first few reports to check category data
      console.log('📊 Sample reports from API (full object):', response.reports.slice(0, 2));
      console.log('📊 Sample reports from API (fields):', response.reports.slice(0, 3).map(r => ({
        productName: r.productName,
        categoryName: r.categoryName,
        categoryId: r.categoryId,
        categoryOrder: r.categoryOrder,
        allKeys: Object.keys(r).filter(k => k.toLowerCase().includes('cat'))
      })));
      
      // Store all fetched reports for client-side filtering
      setAllFetchedReports(response.reports);
      // Apply client-side search filter immediately if there's a search term
      if (search && search.trim()) {
        const searchLower = search.toLowerCase().trim();
        const filtered = response.reports.filter(report => {
          const clientName = (report.clientName || '').toLowerCase();
          const countryName = (report.countryName || '').toLowerCase();
          const salesRepName = (report.salesRepName || '').toLowerCase();
          const comment = (report.comment || '').toLowerCase();
          const productName = (report.productName || '').toLowerCase();
          
          return (
            clientName.includes(searchLower) ||
            countryName.includes(searchLower) ||
            salesRepName.includes(searchLower) ||
            comment.includes(searchLower) ||
            productName.includes(searchLower)
          );
        });
        setAllReports(filtered);
      } else {
        setAllReports(response.reports);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch availability reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };


  const fetchFilterData = async () => {
    try {
      const [countriesData, salesRepsData, skusData] = await Promise.all([
        availabilityReportService.getAvailabilityCountries(),
        availabilityReportService.getAvailabilitySalesReps(),
        availabilityReportService.getAvailabilitySkus()
      ]);
      setCountries(countriesData);
      setSalesReps(salesRepsData);
      setSkus(skusData);
    } catch (err) {
      console.error('Error fetching filter data:', err);
    }
  };

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
            setFilters(prev => ({ ...prev, country: kenyaCountry }));
          } else {
            setFilters(prev => ({ ...prev, country: 'Kenya' }));
          }
          setDefaultCountrySet(true);
        } else if (userCountry === 2 || userCountry === '2') {
          // Find Tanzania in the countries list (countries are strings)
          const tanzaniaCountry = countries.find(c => c.toLowerCase() === 'tanzania');
          if (tanzaniaCountry) {
            setFilters(prev => ({ ...prev, country: tanzaniaCountry }));
          } else {
            setFilters(prev => ({ ...prev, country: 'Tanzania' }));
          }
          setDefaultCountrySet(true);
        }
      } catch (error) {
        console.error('Failed to fetch user country:', error);
        // Default to Kenya if we can't fetch the user's country
        if (!defaultCountrySet) {
          setFilters(prev => ({ ...prev, country: 'Kenya' }));
          setDefaultCountrySet(true);
        }
      }
    };
    
    fetchUserCountry();
  }, [user?.id, countries, defaultCountrySet]);

  const handleFilterChange = (key: keyof AvailabilityReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = () => {
    const searchTerm = searchInput.trim();
    setSearch(searchTerm);
    setPage(1);
    // Filter is applied automatically via useEffect when searchInput changes
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleExport = async () => {
    try {
      const blob = await availabilityReportService.exportAvailabilityReports(filters, search);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `availability-reports-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export reports');
      console.error('Error exporting reports:', err);
    }
  };

  const clearFilters = () => {
    // Reset to today's date instead of clearing all filters
    setFilters({
      startDate: getTodayDate(),
      endDate: getTodayDate(),
      productSku: ''
    });
    setSearch('');
    setSearchInput('');
    setPage(1);
    // Reset to show all fetched reports
    setAllReports(allFetchedReports);
  };

  // Apply client-side filter when searchInput changes (real-time filtering)
  useEffect(() => {
    if (allFetchedReports.length > 0) {
      const searchTerm = searchInput.trim();
      if (!searchTerm) {
        // No search term - show all reports
        setAllReports(allFetchedReports);
      } else {
        // Filter reports client-side based on search term
        const searchLower = searchTerm.toLowerCase();
        const filtered = allFetchedReports.filter(report => {
          const clientName = (report.clientName || '').toLowerCase();
          const countryName = (report.countryName || '').toLowerCase();
          const salesRepName = (report.salesRepName || '').toLowerCase();
          const comment = (report.comment || '').toLowerCase();
          const productName = (report.productName || '').toLowerCase();
          
          return (
            clientName.includes(searchLower) ||
            countryName.includes(searchLower) ||
            salesRepName.includes(searchLower) ||
            comment.includes(searchLower) ||
            productName.includes(searchLower)
          );
        });
        setAllReports(filtered);
      }
    }
  }, [searchInput, allFetchedReports]);

  // Create pivot table structure - outlets as rows, products as columns
  const getPivotTableData = (reportsData: AvailabilityReport[]) => {
    if (!reportsData.length) return { outlets: [], products: [], productMap: new Map() };

    // Build product map with category information for sorting
    // CRITICAL: Each product name should get its category from the productId in the database
    // Use productId as the source of truth - don't mix categories from different productIds with the same name
    const productMap = new Map<string, { name: string; categoryName: string; categoryOrder: number; productId?: number }>();
    
    // Group reports by productId first to get the authoritative category for each productId
    const productIdToCategory = new Map<number, { name: string; categoryName: string; categoryOrder: number }>();
    
    // First pass: Build authoritative map of productId -> category
    // This ensures each productId has one canonical category from the database
    reportsData.forEach(r => {
      if (r.productId && r.categoryName) {
        const productKey = (r.productName || '').trim();
        if (!productKey) return;
        
        // Store the category for this productId (first non-null category wins)
        if (!productIdToCategory.has(r.productId)) {
          productIdToCategory.set(r.productId, {
            name: productKey,
            categoryName: (r.categoryName || 'Uncategorized').trim(),
            categoryOrder: r.categoryOrder || 999
          });
        }
      }
    });
    
    // Second pass: For each unique product name, determine its category
    // Strategy: If a product name appears with only one productId, use that productId's category
    // If a product name appears with multiple productIds, we need to be careful
    const productNameToProductIds = new Map<string, Set<number>>();
    reportsData.forEach(r => {
      const productKey = (r.productName || '').trim();
      if (!productKey || !r.productId) return;
      
      if (!productNameToProductIds.has(productKey)) {
        productNameToProductIds.set(productKey, new Set());
      }
      productNameToProductIds.get(productKey)!.add(r.productId);
    });
    
    // Third pass: Build the productMap
    // For each product name, use the category from its productId(s)
    productNameToProductIds.forEach((productIds, productName) => {
      // If this product name has only one productId, use that productId's category
      if (productIds.size === 1) {
        const productId = Array.from(productIds)[0];
        if (productIdToCategory.has(productId)) {
          const productInfo = productIdToCategory.get(productId)!;
          productMap.set(productName, {
            name: productName,
            categoryName: productInfo.categoryName,
            categoryOrder: productInfo.categoryOrder,
            productId: productId
          });
        } else {
          // Fallback: find category from reports with this productId
          const report = reportsData.find(r => r.productId === productId && r.productName?.trim() === productName);
          if (report) {
            productMap.set(productName, {
              name: productName,
              categoryName: (report.categoryName || 'Uncategorized').trim(),
              categoryOrder: report.categoryOrder || 999,
              productId: productId
            });
          }
        }
      } else {
        // Multiple productIds for same product name - this shouldn't happen, but handle it
        // Use the category from the first productId that has a non-"Uncategorized" category
        let bestCategory: { name: string; categoryName: string; categoryOrder: number; productId: number } | null = null;
        
        for (const productId of productIds) {
          if (productIdToCategory.has(productId)) {
            const productInfo = productIdToCategory.get(productId)!;
            // Prefer non-"Uncategorized" categories
            if (productInfo.categoryName !== 'Uncategorized') {
              bestCategory = { ...productInfo, productId };
              break;
            } else if (!bestCategory) {
              bestCategory = { ...productInfo, productId };
            }
          }
        }
        
        if (bestCategory) {
          productMap.set(productName, bestCategory);
        } else {
          // Last resort: use first report's category
          const report = reportsData.find(r => r.productName?.trim() === productName);
          if (report) {
            productMap.set(productName, {
              name: productName,
              categoryName: (report.categoryName || 'Uncategorized').trim(),
              categoryOrder: report.categoryOrder || 999,
              productId: report.productId
            });
          }
        }
      }
    });
    
    // Debug: Log product map with productId info
    console.log('🗺️ Product Map (first 10):', Array.from(productMap.entries()).slice(0, 10).map(([key, value]) => ({
      product: key,
      category: value.categoryName,
      order: value.categoryOrder,
      productId: value.productId
    })));
    console.log('🔍 Product name to IDs mapping:', Array.from(productNameToProductIds.entries()).slice(0, 5).map(([name, ids]) => ({
      product: name,
      productIds: Array.from(ids)
    })));

    // Get all unique products sorted by category order, then category name, then product name
    const uniqueProducts = Array.from(productMap.values())
      .sort((a, b) => {
        // First sort by category order
        if (a.categoryOrder !== b.categoryOrder) {
          return a.categoryOrder - b.categoryOrder;
        }
        // Then by category name
        if (a.categoryName !== b.categoryName) {
          return a.categoryName.localeCompare(b.categoryName);
        }
        // Finally by product name
        return a.name.localeCompare(b.name);
      })
      .map(p => p.name);

    // Group by outlet name and date - ensures one row per outlet per date
    const outletMap = new Map();
    
    reportsData.forEach(report => {
      // Extract just the date part (YYYY-MM-DD) consistently
      const dateObj = new Date(report.createdAt);
      const dateKey = dateObj.toISOString().split('T')[0];
      
      // Use clientName (trimmed) and date for grouping to ensure same outlet/date are combined
      // This is more reliable than clientId which might have inconsistencies
      const clientNameKey = (report.clientName || '').trim();
      const outletKey = `${clientNameKey}|${dateKey}`;
      
      if (!outletMap.has(outletKey)) {
        outletMap.set(outletKey, {
          key: outletKey,
          clientId: report.clientId,
          clientName: clientNameKey,
          countryName: (report.countryName || '').trim(),
          regionName: (report.regionName || '').trim(),
          outletTypeName: (report.outletTypeName || '').trim(),
          outletAccountName: (report.outletAccountName || '').trim(),
          salesRepName: (report.salesRepName || '').trim(),
          reportDate: dateKey,
          createdAt: report.createdAt,
          productQuantities: new Map()
        });
      }
      
      const outlet = outletMap.get(outletKey);
      const productKey = (report.productName || '').trim();
      
      // If product already exists for this outlet/date, aggregate the quantities
      if (outlet.productQuantities.has(productKey)) {
        const existing = outlet.productQuantities.get(productKey);
        outlet.productQuantities.set(productKey, {
          quantity: existing.quantity + report.quantity, // Sum quantities if duplicate
          comment: (existing.comment || report.comment || '').trim(), // Keep first non-empty comment
          categoryName: report.categoryName || existing.categoryName
        });
      } else {
        outlet.productQuantities.set(productKey, {
          quantity: report.quantity,
          comment: (report.comment || '').trim(),
          categoryName: report.categoryName || 'Uncategorized'
        });
      }
    });

    // Convert to array and sort by date (newest first), then by outlet name
    const outlets = Array.from(outletMap.values()).sort((a, b) => {
      const dateComparison = new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime();
      if (dateComparison !== 0) return dateComparison;
      return (a.clientName || '').localeCompare(b.clientName || '');
    });

    return { outlets, products: uniqueProducts, productMap };
  };

  // Get paginated outlets for display
  const getPaginatedData = useMemo(() => {
    const { outlets, products, productMap } = getPivotTableData(allReports);
    
    // Calculate pagination for grouped outlets
    const totalOutlets = outlets.length;
    const totalPagesCalc = Math.ceil(totalOutlets / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOutlets = outlets.slice(startIndex, endIndex);
    
    return {
      outlets: paginatedOutlets,
      products,
      productMap,
      totalOutlets,
      totalPages: totalPagesCalc
    };
  }, [allReports, page, limit]);

  if (loading && allReports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-2 sm:px-3 py-3">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Availability Reports</h1>
              <p className="text-xs text-gray-600 mt-1">Track product availability across all outlets</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/visibility-report')}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1.5 text-xs"
              >
                <EyeIcon className="h-3 w-3" />
                <span>Visibility Reports</span>
              </button>
              <button
                onClick={() => navigate('/feedback-reports')}
                className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1.5 text-xs"
              >
                <BarChart3Icon className="h-3 w-3" />
                <span>Feedback Reports</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-2">
          <div className="flex flex-col lg:flex-row gap-2 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by outlet, comment, country, or sales rep..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <button
              onClick={() => setShowFilterModal(true)}
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-200 transition-colors flex items-center space-x-1.5 text-xs"
            >
              <FilterIcon className="h-3 w-3" />
              <span>Filters</span>
            </button>
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors flex items-center space-x-1.5 text-xs"
            >
              <DownloadIcon className="h-3 w-3" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Date Filter Info & Active Filters */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-blue-900">
                📅 Showing reports for: {filters.startDate === filters.endDate ? filters.startDate : `${filters.startDate} to ${filters.endDate}`}
              </span>
              {Object.entries(filters).map(([key, value]) => 
                value && key !== 'startDate' && key !== 'endDate' && (
                  <span
                    key={key}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium"
                  >
                    {key}: {value}
                  </span>
                )
              )}
              {search && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  search: {search}
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="text-blue-700 text-xs hover:text-blue-900 font-medium"
            >
              Reset to Today
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 rounded text-xs mb-2">
            {error}
          </div>
        )}

        {/* Reports Table - Pivot Format */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Availability Matrix</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {allReports.length} reports • {getPaginatedData.totalOutlets} unique outlet/date combinations • {getPaginatedData.products.length} products
            </p>
          </div>
          <div className="overflow-x-auto">
            {(() => {
              const { outlets, products, productMap } = getPaginatedData;
              
              if (outlets.length === 0) {
                return null;
              }

              return (
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-100 z-10 min-w-[140px] border-r border-gray-300">
                        Outlet
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase bg-gray-100 min-w-[100px]">
                        Region
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase bg-gray-100 min-w-[110px]">
                        Outlet Type
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase bg-gray-100 min-w-[120px]">
                        Outlet Account
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase bg-gray-100 min-w-[90px]">
                        Sales Rep
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase bg-gray-100 min-w-[80px] border-r border-gray-300">
                        Date
                      </th>
                      {products.map((product) => {
                        const productInfo = productMap?.get(product);
                        return (
                          <th 
                            key={product} 
                            className="px-2 py-1 text-center text-xs font-medium text-gray-500 bg-gray-100 min-w-[90px]"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400 font-normal">{productInfo?.categoryName || ''}</span>
                              <span className="text-[10px] uppercase leading-tight">{product}</span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {outlets.map((outlet) => (
                      <tr key={outlet.key} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900 sticky left-0 bg-white hover:bg-gray-50 z-10 border-r border-gray-300">
                          {outlet.clientName}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700">
                          {outlet.regionName || '—'}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700">
                          {outlet.outletTypeName || '—'}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700">
                          {outlet.outletAccountName || '—'}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700">
                          {outlet.salesRepName}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 border-r border-gray-300">
                          {new Date(outlet.reportDate).toLocaleDateString()}
                        </td>
                        {products.map((product) => {
                          const productData = outlet.productQuantities.get(product);
                          const quantity = productData?.quantity ?? null;
                          
                          return (
                            <td 
                              key={`${outlet.key}-${product}`} 
                              className="px-2 py-1.5 text-center whitespace-nowrap"
                              title={productData?.comment || undefined}
                            >
                              {quantity !== null ? (
                                <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-semibold min-w-[35px] ${
                                  quantity > 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {quantity > 0 ? quantity : '0'}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-xs">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
          
          {allReports.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xs font-medium text-gray-900">No availability reports found</h3>
              <p className="text-xs text-gray-500">No reports match the selected filters.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-2">
          <div className="px-2 py-2 flex items-center justify-between sm:px-3">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === getPaginatedData.totalPages}
                className="ml-2 relative inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * limit, getPaginatedData.totalOutlets)}
                  </span>{' '}
                  of <span className="font-medium">{getPaginatedData.totalOutlets}</span> combinations
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-700">Show:</label>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={getPaginatedData.totalOutlets}>All</option>
                  </select>
                </div>
                <nav className="relative z-0 inline-flex rounded shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-1 rounded-l border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  {Array.from({ length: Math.min(5, getPaginatedData.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(getPaginatedData.totalPages - 4, page - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-2.5 py-1 border text-xs font-medium ${
                          page === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === getPaginatedData.totalPages}
                    className="relative inline-flex items-center px-2 py-1 rounded-r border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-base font-medium text-gray-900 mb-4">Filters</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      value={filters.country || ''}
                      onChange={(e) => handleFilterChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    >
                      <option value="">All Countries</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Sales Rep
                    </label>
                    <select
                      value={filters.salesRep || ''}
                      onChange={(e) => handleFilterChange('salesRep', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    >
                      <option value="">All Sales Reps</option>
                      {salesReps.map((rep) => (
                        <option key={rep} value={rep}>
                          {rep}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Product SKU
                    </label>
                    <select
                      value={filters.productSku || ''}
                      onChange={(e) => handleFilterChange('productSku', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    >
                      <option value="">All SKUs</option>
                      {skus.map((sku) => (
                        <option key={sku} value={sku}>
                          {sku}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      clearFilters();
                      setShowFilterModal(false);
                    }}
                    className="px-4 py-2 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityReportPage;