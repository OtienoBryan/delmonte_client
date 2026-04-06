import React, { useState, useEffect, Fragment, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  X as XIcon,
  Home as HomeIcon,
  Package as PackageIcon,
  ClipboardList as ClipboardListIcon,
  ShoppingCart as ShoppingCartIcon,
  FileText as FileTextIcon,
  Box as BoxIcon,
  Users as UsersIcon,
  Receipt as ReceiptIcon,
  AlertCircle as AlertCircleIcon,
  TrendingUp as TrendingUpIcon,
  CreditCard as CreditCardIcon,
  Truck as TruckIcon,
  Store as StoreIcon,
  BarChart3 as BarChart3Icon,
  Menu as MenuIcon,
  MessageCircleIcon
} from 'lucide-react';
import { storeService } from '../services/storeService';
import { productsService, categoriesService, stockTransferService } from '../services/financialService';
import { creditNoteService } from '../services/creditNoteService';
import { StockSummaryData } from '../services/storeService';
import { StoreInventory, StoreInventorySummary } from '../types/financial';
import { CreditNote } from '../services/creditNoteService';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface InventoryStats {
  totalProducts: number;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
}

interface SalesSummary {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    product_name: string;
    quantity_sold: number;
    sales_value: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const InventoryStaffDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingProducts: []
  });
  const [storeInventory, setStoreInventory] = useState<StoreInventory[]>([]);
  const [storeSummary, setStoreSummary] = useState<StoreInventorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<number | 'all'>('all');
  const [stores, setStores] = useState<{ id: number; store_name: string; store_code: string }[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [stockSummaryData, setStockSummaryData] = useState<StockSummaryData | null>(null);
  const [stockSummaryCategoryFilter, setStockSummaryCategoryFilter] = useState<string>('all');
  const [stockSummarySearchTerm, setStockSummarySearchTerm] = useState<string>('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [creditNoteStats, setCreditNoteStats] = useState({
    totalCreditNotes: 0,
    pendingReceiving: 0,
    received: 0
  });
  const [approvedOrdersCount, setApprovedOrdersCount] = useState(0);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);
  const [lowStockModalOpen, setLowStockModalOpen] = useState(false);
  const [itemsBelowReorderLevel, setItemsBelowReorderLevel] = useState<any[]>([]);

  // Navigation items
  const navigation = [
    { name: 'Dashboard', href: '/inventory-staff-dashboard', icon: HomeIcon },
    { name: 'Store Inventory', href: '/store-inventory', icon: StoreIcon },
    { name: 'Stock Take', href: '/stock-take', icon: PackageIcon },
    { name: 'Stock Transfer', href: '/stock-transfer', icon: PackageIcon },
    // { name: 'Post Receipt', href: '/financial/post-receipt', icon: ReceiptIcon },
    // { name: 'View Receipts', href: '/financial/view-receipts', icon: FileTextIcon },
    // { name: 'Merchandise', href: '/merchandise', icon: ShoppingCartIcon },
    { name: 'Customer Orders', href: '/financial/customer-orders', icon: ShoppingCartIcon },
    { name: 'Credit Notes', href: '/credit-note-summary', icon: CreditCardIcon },
    { name: 'Riders', href: '/riders', icon: TruckIcon },
    //{ name: 'Opening Quantities', href: '/opening-quantities', icon: BarChart3Icon },
    { name: 'Update Stock', href: '/update-stock-quantity', icon: TrendingUpIcon },
    { name: 'Faulty Products', href: '/faulty-products', icon: AlertCircleIcon },
    { name: 'Chat', href: '/instant-chat', icon: MessageCircleIcon },
    ...(user?.id === 4 ? [
      { name: 'Assets', href: '/my-assets', icon: BoxIcon },
      { name: 'Suppliers', href: '/financial/suppliers', icon: UsersIcon },
      { name: 'Receivables', href: '/receivables', icon: FileTextIcon },
    ] : []),
  ];

  // Reports section
  const reportsNavigation = [
    //{ name: 'Availability Reports', href: '/availability-reports', icon: BarChart3Icon },
    { name: 'Faulty Reports', href: '/faulty-reports', icon: FileTextIcon },
    { name: 'Stock Movement', href: '/inventory-transactions', icon: ClipboardListIcon },
    { name: 'Inventory As Of', href: '/inventory-as-of', icon: BarChart3Icon },
    { name: 'Stock Take History', href: '/stock-take-history', icon: FileTextIcon },
    { name: 'Transfer History', href: '/stock-transfer-history', icon: FileTextIcon },
    { name: 'Product Performance', href: '/dashboard/reports/product-performance', icon: FileTextIcon },
  ];

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        inventoryResponse,
        salesResponse,
        storesResponse,
        storeSummaryResponse,
        stockSummaryResponse,
        categoriesResponse,
        creditNotesResponse,
        topSellingResponse,
        transfersResponse
      ] = await Promise.all([
        storeService.getAllStoresInventory(),
        axios.get('/api/financial/sales-orders'),
        storeService.getAllStores(),
        storeService.getInventorySummaryByStore(),
        storeService.getStockSummary(),
        categoriesService.getAll(),
        creditNoteService.getAll(),
        axios.get('/api/financial/reports/product-performance').catch(() => ({ data: { success: false, data: [] } })),
        stockTransferService.getHistory({ page: 1, limit: 10 }).catch(() => ({ success: false, data: [] }))
      ]);

      // Process inventory
      if (inventoryResponse.success) {
        const inventory = inventoryResponse.data || [];
        setStoreInventory(inventory);

        const totalProducts = new Set(inventory.map(item => item.product_id)).size;
        const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const totalValue = inventory.reduce((sum, item) => sum + (item.inventory_value || 0), 0);
        const lowStockItems = inventory.filter(item => (item.quantity || 0) <= 10).length;
        const outOfStockItems = inventory.filter(item => (item.quantity || 0) === 0).length;

        setInventoryStats({ totalProducts, totalItems, totalValue, lowStockItems, outOfStockItems });

        // Category distribution
        const categoryMap = new Map();
        inventory.forEach(item => {
          const category = item.category || 'Uncategorized';
          categoryMap.set(category, (categoryMap.get(category) || 0) + (item.quantity || 0));
        });
        setCategoryDistribution(Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value })));
      }

      // Sales
      if (salesResponse.data?.success) {
        const orders = salesResponse.data.data || [];
        const totalSales = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        const approvedOrders = orders.filter((order: any) => order.my_status === 1).length;
        setApprovedOrdersCount(approvedOrders);

        const topSellingProducts = topSellingResponse.data?.success
          ? topSellingResponse.data.data.slice(0, 5).map((item: any) => ({
              product_name: item.product_name,
              quantity_sold: item.total_quantity_sold || 0,
              sales_value: item.total_sales_value || 0
            }))
          : [];

        setSalesSummary({ totalSales, totalOrders, averageOrderValue, topSellingProducts });

        // Monthly sales
        const monthMap = new Map();
        orders.forEach((order: any) => {
          if (order.order_date && order.total_amount) {
            const date = new Date(order.order_date);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            monthMap.set(key, (monthMap.get(key) || 0) + (order.total_amount || 0));
          }
        });

        const monthlyData = Array.from(monthMap.entries())
          .map(([key, value]) => {
            const [year, month] = key.split('-');
            return { month: `${getMonthName(parseInt(month))} ${year}`, sales: value };
          })
          .sort((a, b) => {
            const [aMonth, aYear] = a.month.split(' ');
            const [bMonth, bYear] = b.month.split(' ');
            return (parseInt(aYear) - parseInt(bYear)) || (getMonthIndex(aMonth) - getMonthIndex(bMonth));
          });

        setMonthlySalesData(monthlyData);
      }

      if (storesResponse.success) setStores(storesResponse.data || []);
      if (storeSummaryResponse.success) setStoreSummary(storeSummaryResponse.data || []);
      if (stockSummaryResponse.success) {
        const stockSummary = stockSummaryResponse.data || null;
        setStockSummaryData(stockSummary);
        
        // Calculate items below reorder level
        if (stockSummary && stockSummary.products) {
          const lowStockItems = stockSummary.products
            .map((product: any) => {
              // Calculate total stock across all stores
              const totalStock = stockSummary.stores.reduce((sum: number, store: any) => {
                return sum + (product.store_quantities[store.id] || 0);
              }, 0);
              
              const reorderLevel = product.reorder_level || 1500;
              
              if (totalStock < reorderLevel) {
                return {
                  ...product,
                  totalStock,
                  reorderLevel,
                  difference: totalStock - reorderLevel
                };
              }
              return null;
            })
            .filter((item: any) => item !== null)
            .sort((a: any, b: any) => a.totalStock - b.totalStock); // Sort by total stock (lowest first)
          
          setItemsBelowReorderLevel(lowStockItems);
        }
      }
      if (categoriesResponse.success) setCategories(categoriesResponse.data || []);

      // Credit notes
      if (creditNotesResponse.success) {
        const notes = creditNotesResponse.data || [];
        setCreditNotes(notes);
        setCreditNoteStats({
          totalCreditNotes: notes.length,
          pendingReceiving: notes.filter(n => n.my_status !== 1).length,
          received: notes.filter(n => n.my_status === 1).length
        });
      }

      if (transfersResponse.success) {
        setRecentTransfers((transfersResponse.data || []).slice(0, 10));
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (selectedStore !== 'all') {
      fetchStoreSpecificData(selectedStore);
    }
  }, [selectedStore]);

  const fetchStoreSpecificData = async (storeId: number) => {
    try {
      const response = await storeService.getStoreInventory(storeId);
      if (response.success) {
        const inventory = response.data || [];
        const totalProducts = inventory.length;
        const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const totalValue = inventory.reduce((sum, item) => sum + (item.inventory_value || 0), 0);
        const lowStockItems = inventory.filter(item => (item.quantity || 0) <= 10).length;
        const outOfStockItems = inventory.filter(item => (item.quantity || 0) === 0).length;

        setInventoryStats({ totalProducts, totalItems, totalValue, lowStockItems, outOfStockItems });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getMonthName = (m: number) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] || '';
  const getMonthIndex = (name: string) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(name);

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(stockSummarySearchTerm), 300);
    return () => clearTimeout(timer);
  }, [stockSummarySearchTerm]);

  const filteredStockSummary = useMemo(() => {
    if (!stockSummaryData?.products) return [];

    let filtered = stockSummaryData.products;

    if (stockSummaryCategoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === stockSummaryCategoryFilter);
    }

    if (debouncedSearchTerm.trim()) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.product_name?.toLowerCase().includes(term) ||
        p.product_code?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
  }, [stockSummaryData, stockSummaryCategoryFilter, debouncedSearchTerm]);

  const getStoreName = useCallback((id: number) => stores.find(s => s.id === id)?.store_name || 'Unknown', [stores]);
  const formatCurrency = useCallback((n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n), []);
  const formatNumber = useCallback((n: number) => n.toLocaleString(), []);
  const formatDate = useCallback((d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-', []);
  const formatTime = useCallback((d: string) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '', []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-6">
        <div className="max-w-7xl mx-auto bg-white border border-red-200 rounded-xl p-4 shadow-lg">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-base font-semibold text-red-800">Error Loading Dashboard</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Mobile Sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child as={Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
            <div className="relative flex flex-col w-full max-w-xs h-full bg-white pt-5 pb-4">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-white" onClick={() => setSidebarOpen(false)}>
                  <XIcon className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex items-center flex-shrink-0 px-4 h-14 border-b border-gray-200">
                <h2 className="text-base font-bold text-blue-600">Inventory Menu</h2>
              </div>
              <nav className="flex-1 px-2 py-4 overflow-y-auto">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
                
                {/* Reports Section */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reports</h3>
                  </div>
                  <div className="mt-2 space-y-1">
                    {reportsNavigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      return (
                        <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                          <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </nav>
            </div>
          </Transition.Child>
        </Dialog>
      </Transition.Root>

      {/* Desktop Sidebar - Fixed */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
          <div className="flex items-center h-14 flex-shrink-0 px-4 border-b border-gray-200">
            <h2 className="text-base font-bold text-blue-600">Inventory Menu</h2>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.name} to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Reports Section */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reports</h3>
              </div>
              <div className="mt-2 space-y-1">
                {reportsNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link key={item.name} to={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col min-h-screen md:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Inventory Staff Dashboard</h1>
                  <p className="mt-1 text-sm text-gray-600">Manage and monitor inventory across all stores</p>
                </div>
                {itemsBelowReorderLevel.length > 0 && (
                  <button
                    onClick={() => setLowStockModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-md transition-colors"
                  >
                    <AlertCircleIcon className="h-5 w-5" />
                    Low Stock Alert ({itemsBelowReorderLevel.length})
                  </button>
                )}
              </div>

              {/* Stock Summary Table */}
              {selectedStore === 'all' && stockSummaryData && stockSummaryData.products.length > 0 && (
                <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <h2 className="text-lg font-bold text-gray-900">Stock Summary Across All Stores</h2>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search products..."
                            value={stockSummarySearchTerm}
                            onChange={(e) => setStockSummarySearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          {stockSummarySearchTerm && (
                            <button onClick={() => setStockSummarySearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <XIcon className="h-5 w-5 text-gray-400" />
                            </button>
                          )}
                        </div>
                        <select
                          value={stockSummaryCategoryFilter}
                          onChange={(e) => setStockSummaryCategoryFilter(e.target.value)}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Categories</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                    Showing {filteredStockSummary.length} of {stockSummaryData.products.length} products
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stock</th>
                          {stockSummaryData.stores.map(store => (
                            <th key={store.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{store.store_name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStockSummary.map(product => {
                          const totalStock = stockSummaryData.stores.reduce((sum, store) => sum + (product.store_quantities[store.id] || 0), 0);
                          return (
                            <tr key={product.id} className="hover:bg_gray-50">
                              <td className="sticky left-0 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  {product.category || 'Uncategorized'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatNumber(totalStock)}</td>
                              {stockSummaryData.stores.map(store => {
                                const qty = product.store_quantities[store.id] || 0;
                                return (
                                  <td key={store.id} className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      qty === 0 ? 'bg-red-100 text-red-800' :
                                      qty <= 10 ? 'bg-red-100 text-red-800' :
                                      qty <= 50 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {formatNumber(qty)}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent Transfers */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Recent Transfer Records</h2>
                    <p className="text-sm text-gray-600">Latest stock transfers between stores</p>
                  </div>
                  <Link to="/stock-transfer-history" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    <PackageIcon className="h-4 w-4" /> View All
                  </Link>
                </div>
                {recentTransfers.length === 0 ? (
                  <div className="text-center py-16">
                    <PackageIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-gray-500">No recent transfers</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {recentTransfers.map((t: any) => (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="font-medium">{formatDate(t.transfer_date)}</div>
                              <div className="text-gray-500">{formatTime(t.transfer_date)}</div>
                            </td>
                            <td className="px-6 py-4 text-sm">{t.from_store_name || '-'}</td>
                            <td className="px-6 py-4 text-sm">{t.to_store_name || '-'}</td>
                            <td className="px-6 py-4 text-sm">
                              <div>{t.product_name}</div>
                              {t.product_code && <div className="text-gray-500 text-xs">{t.product_code}</div>}
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                              <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {t.quantity?.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">{t.staff_name || '-'}</td>
                            <td className="px-6 py-4 text-sm">
                              {t.reference ? <span className="px-2 inline-flex text-xs rounded-md bg-gray-100">{t.reference}</span> : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

      {/* Low Stock Modal */}
      <Transition.Root show={lowStockModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed z-50 inset-0 overflow-y-auto" onClose={setLowStockModalOpen}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                      </div>
                      <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
                        Items Below Reorder Level
                      </Dialog.Title>
                    </div>
                    <button
                      type="button"
                      className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => setLowStockModalOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-4">
                      The following {itemsBelowReorderLevel.length} item(s) have total stock below their reorder level of 1,500 units.
                    </p>

                    {itemsBelowReorderLevel.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No items below reorder level</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reorder Level
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Stock
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Shortfall
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Store Breakdown
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {itemsBelowReorderLevel.map((item: any) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                                  <div className="text-sm text-gray-500">{item.product_code}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                    {item.category || 'Uncategorized'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                  {formatNumber(item.reorderLevel)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                  <span className="font-semibold text-red-600">{formatNumber(item.totalStock)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                  <span className="font-semibold text-red-600">
                                    {formatNumber(Math.abs(item.difference))}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  <div className="space-y-1">
                                    {stockSummaryData?.stores.map((store: any) => {
                                      const qty = item.store_quantities[store.id] || 0;
                                      return (
                                        <div key={store.id} className="flex items-center justify-between">
                                          <span className="text-xs">{store.store_name}:</span>
                                          <span className="text-xs font-medium">{formatNumber(qty)}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setLowStockModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default InventoryStaffDashboardPage;