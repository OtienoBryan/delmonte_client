import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Search } from 'lucide-react';

interface ProductPerformance {
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  total_quantity_sold: number;
}

const ProductPerformanceGraphPage: React.FC = () => {
  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [countries, setCountries] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [region, setRegion] = useState<string>('');
  const [client, setClient] = useState<string>('');
  const [clients, setClients] = useState<{id: number, name: string}[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [sku, setSku] = useState<string>('');
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [tempRegion, setTempRegion] = useState<string>('');
  const [tempClient, setTempClient] = useState<string>('');
  const [tempSku, setTempSku] = useState<string>('');

  const fetchData = async (start?: string, end?: string, regionName?: string, clientId?: string, skuId?: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/financial/reports/product-performance';
      const params: Record<string, string> = {};
      if (start) params.startDate = start;
      if (end) params.endDate = end;
      if (regionName) params.region = regionName;
      if (clientId) params.client = clientId;
      if (skuId) params.sku = skuId;
      const query = new URLSearchParams(params).toString();
      if (query) url += `?${query}`;
      const response = await axios.get(url);
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
    fetchData(startDate, endDate, region, client, sku);
    // eslint-disable-next-line
  }, [startDate, endDate, region, client, sku]);

  useEffect(() => {
    // Fetch country and region options on mount
    const fetchCountries = async () => {
      try {
        const res = await axios.get('/api/countries');
        if (res.data.success) {
          setCountries(res.data.data.map((row: { name: string }) => row.name));
        }
      } catch {}
    };
    const fetchRegions = async () => {
      try {
        const res = await axios.get('/api/regions');
        if (res.data.success) {
          setRegions(res.data.data.map((row: { name: string }) => row.name));
        }
      } catch {}
    };
    const fetchClients = async () => {
      try {
        const res = await axios.get('/api/clients?limit=10000');
        if (res.data && res.data.data) {
          const clientsData = res.data.data
            .filter((client: {id: number, name: string}) => client && client.id && client.name) // Filter out null/undefined clients
            .map((client: {id: number, name: string}) => ({
              id: client.id,
              name: client.name
            }));
          setClients(clientsData);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/financial/categories');
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCountries();
    fetchRegions();
    fetchClients();
    fetchCategories();
  }, []);

  // Filtered clients based on search
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) {
      return clients;
    }
    return clients.filter(client =>
      client && client.name && client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
    );
  }, [clients, clientSearchQuery]);

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
    if (modalOpen) {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      setTempRegion(region);
      setTempClient(client);
    }
    // eslint-disable-next-line
  }, [modalOpen]);

  // Handle client selection
  const handleClientSelect = (clientId: string, clientName: string) => {
    setTempClient(clientId);
    setClientSearchQuery(clientName);
    setIsClientDropdownOpen(false);
  };

  // Handle search input change
  const handleClientSearchChange = (value: string) => {
    setClientSearchQuery(value);
    if (value === '') {
      setTempClient('');
    }
    setIsClientDropdownOpen(true);
  };

  return (
    <div className="max-w-8xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Product Performance Graph</h1>
        <button
          className="ml-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
          onClick={() => {
            setTempStartDate(startDate);
            setTempEndDate(endDate);
            setTempRegion(region);
            setTempClient(client);
            setTempSku(sku);
            setModalOpen(true);
          }}
        >
          Filter
        </button>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-base font-semibold mb-4">Filter Product Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={e => setTempStartDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={e => setTempEndDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
                <select
                  value={tempRegion}
                  onChange={e => setTempRegion(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                >
                  <option value="">All</option>
                  {regions.map((r: string) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Client</label>
                <div className="relative client-dropdown-container">
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={clientSearchQuery}
                    onChange={e => handleClientSearchChange(e.target.value)}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 pr-8 text-sm"
                  />
                  <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                  
                  {/* Dropdown List */}
                  {isClientDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                      <div
                        className="px-3 py-2 text-xs text-gray-500 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleClientSelect('', 'All Clients')}
                      >
                        All Clients
                      </div>
                      {filteredClients.map((clientItem) => (
                        <div
                          key={clientItem.id}
                          className="px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          onClick={() => handleClientSelect(clientItem.id.toString(), clientItem.name)}
                        >
                          {clientItem.name}
                        </div>
                      ))}
                      {filteredClients.length === 0 && clientSearchQuery && (
                        <div className="px-3 py-2 text-xs text-gray-500">
                          No clients found matching "{clientSearchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">SKU (Category)</label>
                <select
                  value={tempSku}
                  onChange={e => setTempSku(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
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
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm"
                onClick={() => {
                  setStartDate(''); setEndDate(''); setRegion(''); setClient(''); setClientSearchQuery(''); setIsClientDropdownOpen(false); setSku(''); setModalOpen(false);
                }}
              >
                Clear
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                onClick={() => {
                  setStartDate(tempStartDate);
                  setEndDate(tempEndDate);
                  setRegion(tempRegion);
                  setClient(tempClient);
                  setSku(tempSku);
                  setModalOpen(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-8 bg-white rounded shadow p-6">
        <h2 className="text-base font-semibold mb-4">Quantity Sold by Product</h2>
        {loading ? (
          <div className="text-sm">Loading chart...</div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={products} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product_name" angle={-30} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: '11px' }} labelStyle={{ fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="total_quantity_sold" fill="#34D399" name="Quantity Sold" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ProductPerformanceGraphPage; 