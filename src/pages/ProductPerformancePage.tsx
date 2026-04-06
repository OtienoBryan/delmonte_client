import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  Package, 
  BarChart3, 
  Filter, 
  Download, 
  Calendar, 
  MapPin, 
  Tag,
  Search,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface ProductPerformance {
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  total_quantity_sold: number;
}

const ProductPerformancePage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
    return `${year}-${month.toString().padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const lastDay = new Date(year, month, 0).getDate(); // Get last day of current month
    return `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
  });
  const [productType, setProductType] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [countries, setCountries] = useState<string[]>([]);
  const [defaultCountrySet, setDefaultCountrySet] = useState<boolean>(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [region, setRegion] = useState<string>('');
  const [salesRep, setSalesRep] = useState<string>('');
  const [salesReps, setSalesReps] = useState<{id: number, name: string}[]>([]);
  const [client, setClient] = useState<string>('');
  const [clients, setClients] = useState<{id: number, name: string}[]>([]);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [sku, setSku] = useState<string>('');
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof ProductPerformance>('total_quantity_sold');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [tempRegion, setTempRegion] = useState<string>('');
  const [tempSalesRep, setTempSalesRep] = useState<string>('');
  const [tempClient, setTempClient] = useState<string>('');
  const [tempClientSearchQuery, setTempClientSearchQuery] = useState('');
  const [tempSku, setTempSku] = useState<string>('');

  const fetchData = async (start?: string, end?: string, type?: string, countryName?: string, regionName?: string, salesRepId?: string, clientId?: string, skuId?: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/financial/reports/product-performance';
      const params: Record<string, string> = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;
      if (type) params.productType = type;
      if (countryName) params.country = countryName;
      if (regionName) params.region = regionName;
      if (salesRepId) params.salesRep = salesRepId;
      if (clientId) params.client = clientId;
      if (skuId) params.sku = skuId;
      const query = new URLSearchParams(params).toString();
      if (query) url += `?${query}`;
      const response = await api.get(url);
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        setError('Failed to fetch product performance data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(startDate, endDate, productType, country, region, salesRep, client, sku);
  }, [startDate, endDate, productType, country, region, salesRep, client, sku]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isClientDropdownOpen && !target.closest('.client-dropdown-container')) {
        setIsClientDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClientDropdownOpen]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await api.get('/countries');
        if (res.data.success) {
          setCountries(res.data.data.map((row: { name: string }) => row.name));
        }
      } catch {}
    };
    const fetchRegions = async () => {
      try {
        const res = await api.get('/regions');
        if (res.data.success) {
          setRegions(res.data.data.map((row: { name: string }) => row.name));
        }
      } catch {}
    };
    const fetchSalesReps = async () => {
      try {
        const res = await api.get('/financial/sales-reps');
        if (res.data.success) {
          setSalesReps(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching sales reps:', error);
      }
    };
    const fetchClients = async () => {
      try {
        console.log('Fetching clients...');
        const res = await api.get('/clients?limit=10000'); // Get all clients
        console.log('Clients response:', res.data);
        console.log('Response status:', res.status);
        
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          const clientsData = res.data.data
            .filter((client: {id: number, name: string}) => client && client.id && client.name) // Filter out null/undefined clients
            .map((client: {id: number, name: string}) => ({
              id: client.id,
              name: client.name
            }));
          console.log('Mapped clients:', clientsData);
          setClients(clientsData);
        } else {
          console.error('Invalid response format:', res.data);
          console.error('Expected: { data: [...] }, Got:', typeof res.data, res.data);
        }
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        console.error('Error details:', error.response?.data || error.message);
      }
    };
    const fetchCategories = async () => {
      try {
        const res = await api.get('/financial/categories');
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (error: any) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCountries();
    fetchRegions();
    fetchSalesReps();
    fetchClients();
    fetchCategories();
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
            setCountry(kenyaCountry);
          } else {
            setCountry('Kenya');
          }
          setDefaultCountrySet(true);
        } else if (userCountry === 2 || userCountry === '2') {
          // Find Tanzania in the countries list (countries are strings)
          const tanzaniaCountry = countries.find(c => c.toLowerCase() === 'tanzania');
          if (tanzaniaCountry) {
            setCountry(tanzaniaCountry);
          } else {
            setCountry('Tanzania');
          }
          setDefaultCountrySet(true);
        }
      } catch (error) {
        console.error('Failed to fetch user country:', error);
        // Default to Kenya if we can't fetch the user's country
        if (!defaultCountrySet) {
          setCountry('Kenya');
          setDefaultCountrySet(true);
        }
      }
    };
    
    fetchUserCountry();
  }, [user?.id, countries, defaultCountrySet]);

  // Filtered clients for modal based on temp search
  const filteredClientsForModal = useMemo(() => {
    if (!tempClientSearchQuery.trim()) {
      return clients;
    }
    return clients.filter(client =>
      client && client.name && client.name.toLowerCase().includes(tempClientSearchQuery.toLowerCase())
    );
  }, [clients, tempClientSearchQuery]);

  // Filtered and sorted products
  const processedProducts = useMemo(() => {
    let filtered = products.filter(product =>
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort products
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [products, searchQuery, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    const totalQuantity = processedProducts.reduce((sum, p) => sum + (Number(p.total_quantity_sold) || 0), 0);

    return {
      totalProducts: processedProducts.length,
      totalQuantity
    };
  }, [processedProducts]);

  const handleSort = (field: keyof ProductPerformance) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Product Name', 'Category', 'Quantity Sold'];
    const csvContent = [
      headers.join(','),
      ...processedProducts.map(p => [
        `"${p.product_name}"`,
        `"${p.category_name || 'N/A'}"`,
        p.total_quantity_sold
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-performance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    // Reset to default date values (current month)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    setStartDate(firstDay);
    setEndDate(lastDayStr);
    setProductType('');
    setRegion('');
    setSalesRep('');
    setClient('');
    setIsClientDropdownOpen(false);
    setSku('');
    setSearchQuery('');
  };


  // Handle modal opening
  const handleModalOpen = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempRegion(region);
    setTempSalesRep(salesRep);
    setTempClient(client);
    // Set the client search query to the selected client's name if a client is selected
    if (client && clients.length > 0) {
      const selectedClient = clients.find(c => c.id.toString() === client);
      setTempClientSearchQuery(selectedClient ? selectedClient.name : '');
    } else {
      setTempClientSearchQuery('');
    }
    setTempSku(sku);
    setModalOpen(true);
  };

  // Handle modal closing
  const handleModalClose = () => {
    setModalOpen(false);
  };

  // Handle applying filters from modal
  const handleApplyFilters = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setRegion(tempRegion);
    setSalesRep(tempSalesRep);
    setClient(tempClient);
    setSku(tempSku);
    setIsClientDropdownOpen(false);
    setModalOpen(false);
  };

  // Handle clearing all filters from modal
  const handleClearFilters = () => {
    // Reset to default date values (current month)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    setStartDate(firstDay);
    setEndDate(lastDayStr);
    setProductType('');
    setRegion('');
    setSalesRep('');
    setClient('');
    setIsClientDropdownOpen(false);
    setSku('');
    setSearchQuery('');
    setModalOpen(false);
  };

  // Check if there are any active filters (excluding default date values)
  const getDefaultDateRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    return { firstDay, lastDayStr };
  };

  const { firstDay: defaultStartDate, lastDayStr: defaultEndDate } = getDefaultDateRange();
  const hasActiveFilters = 
    (startDate !== defaultStartDate) || 
    (endDate !== defaultEndDate) || 
    productType || 
    region || 
    salesRep || 
    client || 
    sku || 
    searchQuery;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading product performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-red-600 text-sm font-medium">{error}</p>
          <button
            onClick={() => fetchData(startDate, endDate, productType, country, region)}
            className="mt-4 px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Performance</h1>
              <p className="text-gray-600 text-sm mt-2">Analyze product sales performance and identify top performers</p>
        </div>
            <div className="flex items-center gap-3">
          <button
                onClick={exportToCSV}
                disabled={processedProducts.length === 0}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
                <Download className="w-3.5 h-3.5" />
                Export CSV
          </button>
          <Link
            to="/dashboard/reports/product-performance-graph"
                className="px-3 py-1.5 text-sm bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
          >
                <BarChart3 className="w-3.5 h-3.5" />
            View Graph
          </Link>
        </div>
      </div>
        </div>

        {/* Filter Button */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleModalOpen}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
                  {[
                    startDate !== defaultStartDate ? 'startDate' : null,
                    endDate !== defaultEndDate ? 'endDate' : null,
                    region,
                    salesRep,
                    client,
                    sku
                  ].filter(Boolean).length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Filter Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
                onClick={handleModalClose}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-base font-semibold mb-4">Filter Product Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={e => setTempStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={e => setTempEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />
                    Region
                  </label>
                  <select
                    value={tempRegion}
                    onChange={e => setTempRegion(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">All Regions</option>
                    {regions.map((r: string) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <User className="w-3.5 h-3.5 inline mr-1" />
                    Sales Rep
                  </label>
                  <select
                    value={tempSalesRep}
                    onChange={e => setTempSalesRep(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">All Sales Reps</option>
                    {salesReps.map((rep) => (
                      <option key={rep.id} value={rep.id.toString()}>{rep.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <User className="w-3.5 h-3.5 inline mr-1" />
                    Client
                  </label>
                  <div className="relative client-dropdown-container">
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={tempClientSearchQuery}
                      onChange={e => {
                        setTempClientSearchQuery(e.target.value);
                        if (e.target.value === '') {
                          setTempClient('');
                        }
                      }}
                      onFocus={() => setIsClientDropdownOpen(true)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 pr-8"
                    />
                    <Search className="absolute right-2 top-2 h-3.5 w-3.5 text-gray-400" />
                    
                    {/* Dropdown List */}
                    {isClientDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div
                          className="px-2.5 py-1.5 text-xs text-gray-500 cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            setTempClient('');
                            setTempClientSearchQuery('');
                            setIsClientDropdownOpen(false);
                          }}
                        >
                          All Clients
                        </div>
                        {filteredClientsForModal.map((clientItem) => (
                          <div
                            key={clientItem.id}
                            className="px-2.5 py-1.5 text-xs cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            onClick={() => {
                              setTempClient(clientItem.id.toString());
                              setTempClientSearchQuery(clientItem.name);
                              setIsClientDropdownOpen(false);
                            }}
                          >
                            {clientItem.name}
                          </div>
                        ))}
                        {filteredClientsForModal.length === 0 && tempClientSearchQuery && (
                          <div className="px-2.5 py-1.5 text-xs text-gray-500">
                            No clients found matching "{tempClientSearchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Tag className="w-3.5 h-3.5 inline mr-1" />
                    SKU (Category)
                  </label>
                  <select
                    value={tempSku}
                    onChange={e => setTempSku(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">All SKUs</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id.toString()}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="bg-gray-200 text-gray-700 px-3 py-1.5 text-sm rounded hover:bg-gray-300"
                  onClick={handleClearFilters}
                >
                  Clear All
                </button>
                <button
                  className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded hover:bg-blue-700"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        {processedProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-12 h-12 text-gray-400 mx-auto mb-4">
              <Package className="w-full h-full" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery || hasActiveFilters ? 'Try adjusting your search or filters' : 'No product performance data available'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('product_name')}
                    >
                      <div className="flex items-center gap-2">
                      Product Name
                        {sortField === 'product_name' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Category
                    </th>
                    <th 
                      className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('total_quantity_sold')}
                    >
                      <div className="flex items-center justify-end gap-2">
                      Quantity Sold
                        {sortField === 'total_quantity_sold' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedProducts.map((product) => {
                    return (
                      <tr key={product.product_id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-xs font-medium text-gray-900">{product.product_name}</div>
                          </div>
                      </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-600">
                          {product.category_name || 'N/A'}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-right text-xs text-gray-900 font-semibold">
                        {product.total_quantity_sold.toLocaleString()}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 font-semibold">
                    <td className="px-4 py-2.5 text-left text-xs text-blue-900">
                      Total ({processedProducts.length} products)
                    </td>
                    <td className="px-4 py-2.5 text-left text-xs text-blue-900">
                      -
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-blue-900">
                      {stats.totalQuantity.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductPerformancePage; 