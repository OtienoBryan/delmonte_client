import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { upliftSaleService } from '../services/upliftSaleService';
import { UpliftSale, UpliftSaleItem, OutletAccount, SalesRep } from '../types/financial';
import { convertToCSV, downloadCSV, formatCurrencyForCSV, formatDateForCSV, formatStatusForCSV, CSVColumn } from '../utils/csvExport';
import { Download } from 'lucide-react';
import { DateTime } from 'luxon';

const formatCurrency = (amount: number) => 
  (amount || 0).toLocaleString(undefined, { style: 'currency', currency: 'KES' });

const formatDate = (date: string) => {
  if (!date) return 'N/A';
  
  // Try different parsing methods for different date formats
  let dt = DateTime.fromISO(date);
  
  if (!dt.isValid) {
    // Try parsing as SQL datetime format
    dt = DateTime.fromSQL(date);
  }
  
  if (!dt.isValid) {
    // Try parsing as regular date
    dt = DateTime.fromJSDate(new Date(date));
  }
  
  if (!dt.isValid) {
    console.warn('Invalid date received:', date, 'Error:', dt.invalidReason);
    return 'Invalid Date';
  }
  
  return dt.toLocaleString(DateTime.DATE_SHORT);
};


const UpliftSalesPage: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const [upliftSales, setUpliftSales] = useState<UpliftSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  // Get current month start and end dates using Luxon
  const getCurrentMonthDates = () => {
    const now = DateTime.now();
    
    // First day of current month
    const startDate = now.startOf('month');
    // Last day of current month
    const endDate = now.endOf('month');
    
    return {
      startDate: startDate.toISODate(),
      endDate: endDate.toISODate(),
      monthName: now.toFormat('MMMM yyyy')
    };
  };

  const currentMonthDates = getCurrentMonthDates();

  const [filters, setFilters] = useState({
    status: '',
    search: '',
    outletAccountId: '',
    salesRepId: '',
    clientId: '',
    startDate: currentMonthDates.startDate,
    endDate: currentMonthDates.endDate,
  });
  const [outletAccounts, setOutletAccounts] = useState<OutletAccount[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientIndex, setSelectedClientIndex] = useState(-1);
  
  // Log clients state changes
  useEffect(() => {
    console.log('📋 [clients] State updated:', {
      count: clients.length,
      firstClient: clients[0] || 'No clients',
      allClients: clients
    });
  }, [clients]);

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) {
      return clients;
    }
    return clients.filter(client => 
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );
  }, [clients, clientSearchTerm]);

  const [summary, setSummary] = useState({
    totalSales: 0,
    totalAmount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    completedCount: 0,
  });
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<UpliftSale | null>(null);
  const [saleItems, setSaleItems] = useState<UpliftSaleItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadUpliftSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.outletAccountId && { outletAccountId: parseInt(filters.outletAccountId) }),
        ...(filters.salesRepId && { salesRepId: parseInt(filters.salesRepId) }),
        ...(filters.clientId && { clientId: parseInt(filters.clientId) }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };

      const response = await upliftSaleService.getUpliftSales(params);
      
      if (response.success) {
        // Debug: Log sample data to see date format
        if (response.data && response.data.length > 0) {
          console.log('Sample uplift sale data:', response.data[0]);
          console.log('CreatedAt value:', response.data[0].createdAt, 'Type:', typeof response.data[0].createdAt);
        }
        
        setUpliftSales(response.data || []);
        setTotalPages(response.pagination?.total_pages || 1);
        setTotal(response.pagination?.total_items || 0);
      } else {
        setError('Failed to load uplift sales');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load uplift sales');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const params = {
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.status && { status: filters.status }),
      };

      const response = await upliftSaleService.getUpliftSalesSummary(params);
      
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  const loadOutletAccounts = async () => {
    try {
      const response = await upliftSaleService.getOutletAccounts();
      
      if (response.success) {
        setOutletAccounts(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load outlet accounts:', err);
    }
  };

  const loadSalesReps = async () => {
    try {
      const response = await upliftSaleService.getSalesReps();
      
      if (response.success) {
        setSalesReps(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load sales reps:', err);
    }
  };

  const loadClients = async () => {
    try {
      console.log('🔄 [loadClients] Loading clients via axios...');
      const url = `${API_BASE_URL}/clients?limit=10000`;
      const res = await axios.get(url, { headers: getAuthHeaders() });
      const data = res.data;
      const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      console.log('📊 [loadClients] Received clients:', list.length);
      setClients(list);
    } catch (err) {
      console.error('💥 [loadClients] Error loading clients:', err);
    }
  };

  useEffect(() => {
    loadUpliftSales();
  }, [page, limit, filters]);

  useEffect(() => {
    loadSummary();
  }, [filters]);

  useEffect(() => {
    console.log('🚀 [UpliftSalesPage] Component mounted, loading initial data...');
    console.log('🚀 [UpliftSalesPage] Loading outlet accounts...');
    loadOutletAccounts();
    console.log('🚀 [UpliftSalesPage] Loading sales reps...');
    loadSalesReps();
    console.log('🚀 [UpliftSalesPage] Loading clients...');
    loadClients();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await upliftSaleService.updateUpliftSale(id, { status: newStatus as any });
      
      if (response.success) {
        await loadUpliftSales();
        await loadSummary();
      } else {
        setError('Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };


  const handleViewItems = async (sale: UpliftSale) => {
    setSelectedSale(sale);
    setShowItemsModal(true);
    setItemsError(null);
    
    try {
      setItemsLoading(true);
      console.log('Fetching items for uplift sale ID:', sale.id);
      const response = await upliftSaleService.getUpliftSaleItems(sale.id);
      console.log('Items response:', response);
      
      if (response.success) {
        setSaleItems(response.data || []);
        console.log('Items loaded:', response.data?.length || 0, 'items');
      } else {
        console.error('Failed to load sale items:', response);
        setItemsError('Failed to load sale items');
      }
    } catch (err: any) {
      console.error('Error loading sale items:', err);
      setItemsError(err.message || 'Failed to load sale items');
    } finally {
      setItemsLoading(false);
    }
  };

  const closeItemsModal = () => {
    setShowItemsModal(false);
    setSelectedSale(null);
    setSaleItems([]);
    setItemsError(null);
  };

  const clearFilters = () => {
    const currentDates = getCurrentMonthDates();
    setFilters({
      status: '',
      search: '',
      outletAccountId: '',
      salesRepId: '',
      clientId: '',
      startDate: currentDates.startDate,
      endDate: currentDates.endDate,
    });
    setClientSearchTerm('');
    setShowClientDropdown(false);
    setSelectedClientIndex(-1);
    setPage(1);
  };

  const handleClientSelect = (clientId: string, clientName: string) => {
    console.log('🔄 [Client Filter] Selected client:', { clientId, clientName });
    setFilters(prev => ({ ...prev, clientId }));
    setClientSearchTerm(clientName);
    setShowClientDropdown(false);
  };

  const handleClientSearchChange = (value: string) => {
    setClientSearchTerm(value);
    setShowClientDropdown(true);
    setSelectedClientIndex(-1);
    if (!value.trim()) {
      setFilters(prev => ({ ...prev, clientId: '' }));
    }
  };

  const handleClientKeyDown = (e: React.KeyboardEvent) => {
    if (!showClientDropdown) return;

    const options = [{ id: '', name: 'All Clients' }, ...filteredClients];
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedClientIndex(prev => 
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedClientIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedClientIndex >= 0 && selectedClientIndex < options.length) {
          const option = options[selectedClientIndex];
          handleClientSelect(option.id.toString(), option.name);
        }
        break;
      case 'Escape':
        setShowClientDropdown(false);
        setSelectedClientIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showClientDropdown && !target.closest('.client-dropdown-container')) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showClientDropdown]);

  const hasActiveFilters = useMemo(() => {
    const currentDates = getCurrentMonthDates();
    return filters.status || 
           filters.search || 
           filters.outletAccountId || 
           filters.salesRepId || 
           filters.clientId ||
           (filters.startDate && filters.startDate !== currentDates.startDate) || 
           (filters.endDate && filters.endDate !== currentDates.endDate);
  }, [filters]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setError(null);

      // Fetch all data with current filters (no pagination)
      const params = {
        limit: 10000, // Large number to get all records
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.outletAccountId && { outletAccountId: parseInt(filters.outletAccountId) }),
        ...(filters.salesRepId && { salesRepId: parseInt(filters.salesRepId) }),
        ...(filters.clientId && { clientId: parseInt(filters.clientId) }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };

      const response = await upliftSaleService.getUpliftSales(params);
      
      if (response.success && response.data) {
        const csvColumns: CSVColumn<UpliftSale>[] = [
          { key: 'id' as keyof UpliftSale, label: 'ID', formatter: (value: any) => `#${value}` },
          { key: 'client_name' as keyof UpliftSale, label: 'Client Name', formatter: (value: any, row: any) => value || row.client?.name || `Client ${row.clientId}` },
          { key: 'user_name' as keyof UpliftSale, label: 'Sales Rep', formatter: (value: any, row: any) => value || row.salesRep?.name || `Sales Rep ${row.userId}` },
          { key: 'status' as keyof UpliftSale, label: 'Status', formatter: formatStatusForCSV },
          { key: 'totalAmount' as keyof UpliftSale, label: 'Total Amount (KES)', formatter: formatCurrencyForCSV },
          { key: 'createdAt' as keyof UpliftSale, label: 'Created Date', formatter: formatDateForCSV },
        ];

        const csvContent = convertToCSV(response.data, csvColumns);
        
        // Generate filename with current date and filters
        const dateStr = DateTime.now().toISODate();
        const filterStr = hasActiveFilters ? '_filtered' : '';
        const filename = `uplift_sales_${dateStr}${filterStr}.csv`;
        
        downloadCSV(csvContent, filename);
      } else {
        setError('Failed to export data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Uplift Sales</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">Total Sales</p>
            <p className="text-lg font-bold text-gray-900">{summary.totalSales}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">Total Amount</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-lg font-bold text-yellow-600">{summary.pendingCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">Approved</p>
            <p className="text-lg font-bold text-blue-600">{summary.approvedCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">Rejected</p>
            <p className="text-lg font-bold text-red-600">{summary.rejectedCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-lg font-bold text-green-600">{summary.completedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Outlet Account</label>
              <select
                value={filters.outletAccountId}
                onChange={(e) => setFilters(prev => ({ ...prev, outletAccountId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
              >
                <option value="">All Outlet Accounts</option>
                {outletAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sales Rep</label>
              <select
                value={filters.salesRepId}
                onChange={(e) => setFilters(prev => ({ ...prev, salesRepId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
              >
                <option value="">All Sales Reps</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative client-dropdown-container">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Client ({clients.length})
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={(e) => handleClientSearchChange(e.target.value)}
                  onFocus={() => setShowClientDropdown(true)}
                  onKeyDown={handleClientKeyDown}
                  placeholder="Search clients..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              
              {showClientDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredClients.length > 0 ? (
                    <>
                      <div
                        className={`px-3 py-2 text-xs cursor-pointer ${
                          selectedClientIndex === 0 
                            ? 'bg-blue-100 text-blue-900' 
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                        onClick={() => handleClientSelect('', 'All Clients')}
                      >
                        All Clients
                      </div>
                      {filteredClients.map((client, index) => (
                        <div
                          key={client.id}
                          className={`px-3 py-2 text-xs cursor-pointer ${
                            selectedClientIndex === index + 1 
                              ? 'bg-blue-100 text-blue-900' 
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => handleClientSelect(client.id.toString(), client.name)}
                        >
                          {client.name}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="px-3 py-2 text-xs text-gray-500">
                      {clientSearchTerm ? 'No clients found' : 'Loading clients...'}
                    </div>
                  )}
                </div>
              )}
              
              {clients.length === 0 && (
                <div className="text-[11px] text-red-500 mt-1">
                  No clients loaded. Check console for errors.
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
                {filters.startDate === currentMonthDates.startDate && (
                  <span className="text-xs text-blue-600 ml-1">({currentMonthDates.monthName})</span>
                )}
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
                {filters.endDate === currentMonthDates.endDate && (
                  <span className="text-xs text-blue-600 ml-1">({currentMonthDates.monthName})</span>
                )}
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search client or sales rep..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
              />
            </div>
            <div className="flex items-end gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              )}
              {(filters.startDate !== currentMonthDates.startDate || filters.endDate !== currentMonthDates.endDate) && (
                <button
                  onClick={() => {
                    const currentDates = getCurrentMonthDates();
                    setFilters(prev => ({ ...prev, startDate: currentDates.startDate, endDate: currentDates.endDate }));
                    setPage(1);
                  }}
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-900 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  {currentMonthDates.monthName}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales Rep
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upliftSales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                          No uplift sales found
                        </td>
                      </tr>
                    ) : (
                      upliftSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            #{sale.id}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {sale.client_name || sale.client?.name || `Client ${sale.clientId}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {sale.user_name || sale.salesRep?.name || `Sales Rep ${sale.userId}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                            {formatCurrency(sale.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(sale.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewItems(sale)}
                                className="text-blue-600 hover:text-blue-900 text-xs"
                              >
                                View Items
                              </button>
                              {sale.status === 'pending' && (
                                <>
                                  {/* <button
                                    onClick={() => handleStatusChange(sale.id, 'approved')}
                                    className="text-green-600 hover:text-green-900 text-xs"
                                  >
                                    Approve
                                  </button> */}
                                  <button
                                    onClick={() => handleStatusChange(sale.id, 'rejected')}
                                    className="text-red-600 hover:text-red-900 text-xs"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {sale.status === 'approved' && (
                                <button
                                  onClick={() => handleStatusChange(sale.id, 'completed')}
                                  className="text-blue-600 hover:text-blue-900 text-xs"
                                >
                                  Complete
                                </button>
                              )}
                              {/* <button
                                onClick={() => handleDelete(sale.id)}
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                Delete
                              </button> */}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages} • {total} records
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={limit}
                    onChange={(e) => {
                      setPage(1);
                      setLimit(parseInt(e.target.value) || 25);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sale Items Modal */}
        {showItemsModal && selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sale Items - #{selectedSale.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedSale.client_name} • {selectedSale.user_name} • {formatDate(selectedSale.createdAt)}
                  </p>
                </div>
                <button
                  onClick={closeItemsModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {itemsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : itemsError ? (
                  <div className="text-center py-8 text-red-600">{itemsError}</div>
                ) : saleItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No items found for this sale</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {saleItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div>
                                <div className="font-medium">
                                  {item.product_name || `Product ${item.productId}`}
                                </div>
                                {item.product_code && (
                                  <div className="text-xs text-gray-500">
                                    Code: {item.product_code}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            Grand Total:
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                            {formatCurrency(saleItems.reduce((sum, item) => sum + item.total, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpliftSalesPage;
