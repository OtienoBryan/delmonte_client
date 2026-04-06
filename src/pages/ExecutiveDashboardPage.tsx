import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUpIcon, 
  DollarSignIcon, 
  ShoppingCartIcon, 
  UsersIcon, 
  PackageIcon, 
  AlertTriangleIcon,
  FileTextIcon,
  CreditCardIcon,
  BuildingIcon,
  BarChart3Icon,
  BoxIcon,
  ClockIcon,
  ChevronRightIcon,
  ActivityIcon,
  ZapIcon,
  NotebookIcon,
  CalculatorIcon,
  PiggyBankIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  AwardIcon,
  TargetIcon,
  MapPinIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { API_CONFIG } from '../config/api';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    positive: boolean;
  };
  prefix?: string;
  suffix?: string;
  bgColor?: string;
  textColor?: string;
  onClick?: () => void;
  badge?: React.ReactNode;
}

interface SalesData {
  date: string;
  order_count: number;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
}

interface SalesSummary {
  total_orders: number;
  total_sales: number;
  avg_order_value: number;
  first_order_date: string;
  last_order_date: string;
  growth_percentage: number;
  previous_month_sales: number;
}

interface CategoryPerformance {
  name: string;
  value: number;
  percentage: string;
  orderCount: number;
  totalQuantity: number;
  avgSaleValue: number;
  color: string;
}

interface CategorySummary {
  totalCategories: number;
  topCategory: string | null;
  topCategoryPercentage: string;
}

// Memoized StatCard component for better performance
const StatCard: React.FC<StatCardProps> = memo(({
  title,
  value,
  icon,
  change,
  prefix = '',
  suffix = '',
  bgColor = 'bg-blue-50',
  textColor = 'text-gray-800',
  onClick,
  badge
}) => {
  // Extract icon color from bgColor for consistency
  const iconBgColor = bgColor.replace('-50', '-100');
  const iconColor = bgColor.includes('blue') ? 'text-blue-600' :
                   bgColor.includes('purple') ? 'text-purple-600' :
                   bgColor.includes('yellow') ? 'text-yellow-600' :
                   bgColor.includes('green') ? 'text-green-600' :
                   bgColor.includes('red') ? 'text-red-600' :
                   'text-gray-600';

  return (
    <div className="relative">
      <div
        className={`${bgColor} overflow-hidden shadow-md rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className="p-3">
          <div className="flex flex-col items-center text-center">
            <div className={`${iconBgColor} ${iconColor} p-1.5 rounded-md mb-1.5 shadow-sm`}>
              {icon}
            </div>
            <p className={`text-[10px] font-medium ${textColor} mb-0.5`}>
              {title}
            </p>
            <p className={`text-base font-bold ${textColor}`}>
              {prefix}{value}{suffix}
            </p>
            {change && (
              <div className="flex items-center mt-1">
                {change.positive ? (
                  <ArrowUpRightIcon className="h-2.5 w-2.5 text-green-600" />
                ) : (
                  <ArrowDownRightIcon className="h-2.5 w-2.5 text-red-600" />
                )}
                <span className={`text-[9px] font-medium ml-0.5 ${change.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {change.positive ? '+' : ''}{change.value}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      {badge && (
        <div className="absolute -top-2 -right-2">
          {badge}
        </div>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';

// Data cache to prevent unnecessary refetches
const dataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Helper function to check if cached data is still valid
const isCacheValid = (timestamp: number, ttl: number): boolean => {
  return Date.now() - timestamp < ttl;
};

// Optimized API call with caching
const fetchWithCache = async (key: string, fetcher: () => Promise<any>, ttl: number = CACHE_TTL) => {
  const cached = dataCache.get(key);
  if (cached && isCacheValid(cached.timestamp, cached.ttl)) {
    return cached.data;
  }
  
  const data = await fetcher();
  dataCache.set(key, { data, timestamp: Date.now(), ttl });
  return data;
};

const ExecutiveDashboardPage = () => {
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const [newCreditNotesCount, setNewCreditNotesCount] = useState<number>(0);
  const [hasNewChat, setHasNewChat] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryPerformance[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategorySummary | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Optimized parallel data fetching with caching - Phase 1: Critical data only
  const fetchCriticalData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Parallel API calls for critical data only (counts and chat status)
      const [
        newOrdersResult,
        newCreditNotesResult,
        chatResult
      ] = await Promise.allSettled([
        // New orders count - OPTIMIZED: uses count endpoint instead of fetching all
        fetchWithCache('new-orders-count', async () => {
          const url = API_CONFIG.getUrl('/financial/sales-orders/new-count');
          const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          const data = await res.json();
          if (res.ok && data && data.success) {
            return data.data.count || 0;
          }
          return 0;
        }, 2 * 60 * 1000), // 2 minute cache for counts
        
        // New credit notes count - OPTIMIZED: uses count endpoint instead of fetching all
        fetchWithCache('new-credit-notes-count', async () => {
          const url = API_CONFIG.getUrl('/financial/credit-notes/new-count');
          const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          const data = await res.json();
          if (res.ok && data && data.success) {
            return data.data.count || 0;
          }
          return 0;
        }, 2 * 60 * 1000), // 2 minute cache for counts
        
        // Chat status with cache
        fetchWithCache('chat-status', async () => {
          const url = API_CONFIG.getUrl('/chat/latest');
          const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          const data = await res.json();
          if (res.ok && data && data.success) {
            const lastMessage = data.last_message_at ? new Date(data.last_message_at).getTime() : 0;
            const lastVisited = Number(localStorage.getItem('chat_last_visited_ts') || 0);
            return lastMessage > lastVisited;
          }
          return false;
        }, 1 * 60 * 1000) // 1 minute cache for chat status
      ]);

      // Process critical results
      if (newOrdersResult.status === 'fulfilled') {
        setNewOrdersCount(newOrdersResult.value);
      }

      if (newCreditNotesResult.status === 'fulfilled') {
        setNewCreditNotesCount(newCreditNotesResult.value);
      }

      if (chatResult.status === 'fulfilled') {
        setHasNewChat(chatResult.value);
      }

    } catch (err) {
      console.error('Error loading critical dashboard data:', err);
      // Don't set error for critical data failures, just log
    } finally {
      setLoading(false);
    }
  }, []);

  // Lazy load chart data after critical data is loaded
  const fetchChartData = useCallback(async () => {
    setSalesLoading(true);
    setCategoryLoading(true);

    try {
      // Load chart data in parallel but after critical data
      const [
        salesResult,
        categoryResult
      ] = await Promise.allSettled([
        // Sales data with cache
        fetchWithCache('sales-data', async () => {
          const url = API_CONFIG.getUrl('/financial/sales-orders/current-month-data');
          const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          const data = await res.json();
          if (res.ok && data && data.success) {
            return { dailyData: data.data.dailyData, summary: data.data.summary };
          }
          throw new Error(data.error || 'Failed to load sales data');
        }, 5 * 60 * 1000), // 5 minute cache for chart data
        
        // Category data with cache
        fetchWithCache('category-data', async () => {
          const url = API_CONFIG.getUrl('/financial/sales-orders/category-performance');
          const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          const data = await res.json();
          if (res.ok && data && data.success) {
            return { chartData: data.data.chartData, summary: data.data.summary };
          }
          throw new Error(data.error || 'Failed to load category data');
        }, 5 * 60 * 1000) // 5 minute cache for chart data
      ]);

      if (salesResult.status === 'fulfilled') {
        setSalesData(salesResult.value.dailyData);
        setSalesSummary(salesResult.value.summary);
        setSalesError(null);
      } else {
        setSalesError(salesResult.status === 'rejected' ? salesResult.reason?.message : 'Failed to load sales data');
      }

      if (categoryResult.status === 'fulfilled') {
        setCategoryData(categoryResult.value.chartData);
        setCategorySummary(categoryResult.value.summary);
        setCategoryError(null);
      } else {
        setCategoryError(categoryResult.status === 'rejected' ? categoryResult.reason?.message : 'Failed to load category data');
      }

    } catch (err) {
      console.error('Error loading chart data:', err);
      setSalesError('Failed to load sales data');
      setCategoryError('Failed to load category data');
    } finally {
      setSalesLoading(false);
      setCategoryLoading(false);
    }
  }, []);

  // Main fetch function - loads critical data first, then charts
  const fetchAllData = useCallback(async () => {
    await fetchCriticalData();
    // Defer chart loading by 100ms to prioritize rendering critical UI
    setTimeout(() => {
      fetchChartData();
    }, 100);
  }, [fetchCriticalData, fetchChartData]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Refresh function that clears cache and reloads
  const handleRefresh = useCallback(() => {
    // Clear cache for fresh data
    dataCache.delete('new-orders-count');
    dataCache.delete('new-credit-notes-count');
    dataCache.delete('chat-status');
    dataCache.delete('sales-data');
    dataCache.delete('category-data');
    fetchAllData();
  }, [fetchAllData]);

  // Memoized currency formatter
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Memoized navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(() => [
    { to: '/financial/customer-orders', label: 'Customer Orders', icon: <PackageIcon className="h-4 w-4" />, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { to: '/reports', label: 'Financial Reports', icon: <BarChart3Icon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { to: '/suppliers', label: 'Vendors', icon: <BuildingIcon className="h-4 w-4" />, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { to: '/clients', label: 'Customers', icon: <UsersIcon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { to: '/overall-stock', label: 'Store Inventory', icon: <PackageIcon className="h-4 w-4" />, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { to: '/assets', label: 'Assets', icon: <BoxIcon className="h-4 w-4" />, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
    { to: '/expense-summary', label: 'Expenses Summary', icon: <BarChart3Icon className="h-4 w-4" />, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
    { to: '/department-expenses/upload', label: 'Dept Expenses', icon: <DollarSignIcon className="h-4 w-4" />, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { to: '/products', label: 'Products', icon: <BoxIcon className="h-4 w-4" />, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: <ShoppingCartIcon className="h-4 w-4" />, bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    { to: '/invoice-list', label: 'Invoice List', icon: <FileTextIcon className="h-4 w-4" />, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { to: '/credit-note-summary', label: 'Credit Notes', icon: <FileTextIcon className="h-4 w-4" />, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { to: '/dashboard/reports/product-performance', label: 'Products Performance', icon: <FileTextIcon className="h-4 w-4" />, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { to: '/payroll-management', label: 'Payroll', icon: <CreditCardIcon className="h-4 w-4" />, bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    { to: '/payables', label: 'Payables', icon: <FileTextIcon className="h-4 w-4" />, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
    { to: '/receivables', label: 'Receivables', icon: <PiggyBankIcon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { to: '/pending-payments', label: 'Pending Payments', icon: <ClockIcon className="h-4 w-4" />, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { to: '/sales-rep-performance', label: 'Sales Rep Performance', icon: <TrendingUpIcon className="h-4 w-4" />, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
    { to: '/overall-attendance', label: 'Sales Rep Report', icon: <BarChart3Icon className="h-4 w-4" />, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { to: '/uplift-sales', label: 'Uplift Sales', icon: <TrendingUpIcon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { to: '/unconfirmed-payments', label: 'Unconfirmed Payments', icon: <ClockIcon className="h-4 w-4" />, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { to: '/dashboard/route-compliance', label: 'Sales Rep Compliance', icon: <MapPinIcon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { to: '/sales-reps', label: 'Sales Reps', icon: <UsersIcon className="h-4 w-4" />, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { to: '/dashboard/leave-report', label: 'Employees Leave Report', icon: <FileTextIcon className="h-4 w-4" />, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { to: '/instant-chat', label: 'Chat Room', icon: <ZapIcon className="h-4 w-4" />, bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    { to: '/notices', label: 'Notices', icon: <FileTextIcon className="h-4 w-4" />, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { to: '/dashboard/expiring-contracts', label: 'Expiring Contracts', icon: <AlertTriangleIcon className="h-4 w-4" />, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { to: '/master-sales', label: 'Master Sales Report', icon: <AwardIcon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { to: '/dashboard/staff-list', label: 'Employees', icon: <FileTextIcon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { to: '/employee-working-hours', label: 'Employees Attendance', icon: <FileTextIcon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { to: '/employee-working-days', label: 'Employees Working Days', icon: <FileTextIcon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
  ], []);

  // Memoized skeleton components for better loading experience
  const SkeletonCard = memo(() => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
  ));

  const SkeletonChart = memo(() => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  ));

  SkeletonCard.displayName = 'SkeletonCard';
  SkeletonChart.displayName = 'SkeletonChart';


  // Memoized chart components for better performance with optimized rendering
  const SalesChart = memo(({ data, loading, error, formatCurrency }: { data: SalesData[], loading: boolean, error: string | null, formatCurrency: (amount: number) => string }) => {
    if (loading) return <SkeletonChart />;
    if (error) return <div className="text-red-500 text-center h-64 flex items-center justify-center text-xs">{error}</div>;
    if (data.length === 0) return <div className="text-gray-500 text-center h-64 flex items-center justify-center text-xs">No sales data available</div>;

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `KES ${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '11px'
              }}
              labelStyle={{ fontSize: '11px' }}
              labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
              formatter={(value: number, name: string) => [
                name === 'total_amount' ? formatCurrency(value) : value,
                name === 'total_amount' ? 'Sales' : 'Orders'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="total_amount" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 1.5, r: 3 }}
              activeDot={{ r: 4, stroke: '#3b82f6', strokeWidth: 1.5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  });

  const CategoryChart = memo(({ data, loading, error, formatCurrency }: { data: CategoryPerformance[], loading: boolean, error: string | null, formatCurrency: (amount: number) => string }) => {
    if (loading) return <SkeletonChart />;
    if (error) return <div className="text-red-500 text-center h-64 flex items-center justify-center text-xs">{error}</div>;
    if (data.length === 0) return <div className="text-gray-500 text-center h-64 flex items-center justify-center text-xs">No category data available</div>;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                isAnimationActive={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [
                  formatCurrency(value),
                  'Sales'
                ]}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '11px'
                }}
                labelStyle={{ fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Category Breakdown</h4>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {data.map((category, index) => (
              <div key={`${category.name}-${index}`} className="flex items-center justify-between p-1.5 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                        <div>
                          <div className="font-medium text-gray-900 text-[10px]">{category.name}</div>
                          <div className="text-[9px] text-gray-600">
                            {category.orderCount} orders • {category.totalQuantity} units
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 text-[10px]">
                          {formatCurrency(category.value)}
                        </div>
                        <div className="text-[9px] text-gray-600">
                          {category.percentage}%
                        </div>
                      </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  });

  SalesChart.displayName = 'SalesChart';
  CategoryChart.displayName = 'CategoryChart';

  if (error) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangleIcon className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-semibold text-xs">{error}</p>
          <button 
            onClick={fetchAllData}
            className="mt-3 px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-2">

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 opacity-70">
          <StatCard
            title="Total Sales"
            value={stats ? formatCurrency(stats.totalSales) : '$0.00'}
            icon={<FileTextIcon className="h-6 w-6" />}
            bgColor="bg-gradient-to-r from-green-600 to-green-700"
            onClick={() => navigate('/invoice-list')}
            change={{ value: 12.5, positive: true }}
          />
          
          <StatCard
            title="Total Purchases"
            value={stats ? formatCurrency(stats.totalPurchases) : '$0.00'}
            icon={<ShoppingCartIcon className="h-6 w-6" />}
            bgColor="bg-gradient-to-r from-blue-600 to-blue-700"
            onClick={() => navigate('/purchase-orders')}
            change={{ value: 8.3, positive: true }}
          />

          <StatCard
            title="Receivables"
            value={stats ? formatCurrency(stats.totalReceivables) : '$0.00'}
            icon={<PiggyBankIcon className="h-6 w-6" />}
            bgColor="bg-gradient-to-r from-amber-600 to-amber-700"
            onClick={() => navigate('/receivables')}
            change={{ value: 5.2, positive: false }}
          />

          <StatCard
            title="Payables"
            value={stats ? formatCurrency(stats.totalPayables) : '0.00'}
            icon={<FileTextIcon className="h-6 w-6" />}
            bgColor="bg-gradient-to-r from-red-600 to-red-700"
            onClick={() => navigate('/payables')}
            change={{ value: 3.1, positive: false }}
          />
        </div> */}

        {/* Quick Actions Row */}
        {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <ZapIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <button 
              onClick={() => navigate('/financial/purchase-order')}
              className="group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300"
            >
              <ShoppingCartIcon className="w-5 h-5 text-blue-600 mb-2" />
              <span className="text-xs font-medium text-center text-blue-700">New Purchase</span>
            </button>
            
            <button 
              onClick={() => navigate('/financial/create-customer-order')}
              className="group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 border border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300"
            >
              <PackageIcon className="w-5 h-5 text-green-600 mb-2" />
              <span className="text-xs font-medium text-center text-green-700">Create Order</span>
            </button>
            
            <button 
              onClick={() => navigate('/create-invoice')}
              className="group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300"
            >
              <FileTextIcon className="w-5 h-5 text-emerald-600 mb-2" />
              <span className="text-xs font-medium text-center text-emerald-700">Create Invoice</span>
            </button>
            
            <button 
              onClick={() => navigate('/invoice-list')}
              className="group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 border border-teal-200 bg-teal-50 hover:bg-teal-100 hover:border-teal-300"
            >
              <FileTextIcon className="w-5 h-5 text-teal-600 mb-2" />
              <span className="text-xs font-medium text-center text-teal-700">Invoice List</span>
            </button>
            
            <button 
              onClick={() => navigate('/add-expense')}
              className="group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300"
            >
              <DollarSignIcon className="w-5 h-5 text-red-600 mb-2" />
              <span className="text-xs font-medium text-center text-red-700">Add Expense</span>
            </button>
            
            <button 
              onClick={() => navigate('/add-journal-entry')}
              className="group flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 border border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300"
            >
              <FileTextIcon className="w-5 h-5 text-purple-600 mb-2" />
              <span className="text-xs font-medium text-center text-purple-700">Journal Entry</span>
            </button>
          </div>
        </div> */}

        {/* Navigation Menu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleRefresh}
              disabled={loading || salesLoading || categoryLoading}
              className="flex items-center px-1.5 py-1 text-[9px] font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ActivityIcon className={`h-2.5 w-2.5 mr-1 ${(loading || salesLoading || categoryLoading) ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                to={item.to}
                className={`${item.bgColor} relative rounded-lg p-3 flex flex-col items-center justify-center transition-all duration-200 shadow-md hover:scale-105 hover:shadow-xl`}
              >
                <div className={`${item.iconColor} mb-1.5`}>
                  {item.icon}
                </div>
                <span className={`${item.iconColor} text-[10px] font-medium text-center leading-tight`}>
                  {item.label}
                </span>
                {item.to === '/financial/customer-orders' && newOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[9px] font-semibold bg-red-600 text-white shadow">
                    {newOrdersCount}
                  </span>
                )}
                {item.to === '/credit-note-summary' && newCreditNotesCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[9px] font-semibold bg-orange-600 text-white shadow">
                    {newCreditNotesCount}
                  </span>
                )}
                {item.to === '/chat-room' && hasNewChat && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-2 w-2 rounded-full bg-emerald-500 shadow ring-2 ring-white" />
                )}
                {item.to === '/instant-chat' && hasNewChat && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-2 w-2 rounded-full bg-blue-500 shadow ring-2 ring-white" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Sales Graph Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-gray-900">Current Month Sales</h3>
              <p className="text-[9px] text-gray-600">Daily sales performance for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            {salesSummary && (
              <div className="text-right">
                <div className="text-sm font-bold text-green-600">
                  {formatCurrency(salesSummary.total_sales)}
                </div>
                <div className="flex items-center text-[9px]">
                  {salesSummary.growth_percentage >= 0 ? (
                    <ArrowUpRightIcon className="h-2.5 w-2.5 text-green-500 mr-0.5" />
                  ) : (
                    <ArrowDownRightIcon className="h-2.5 w-2.5 text-red-500 mr-0.5" />
                  )}
                  <span className={salesSummary.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {salesSummary.growth_percentage >= 0 ? '+' : ''}{salesSummary.growth_percentage.toFixed(1)}%
                  </span>
                  <span className="text-gray-500 ml-0.5 text-[9px]">vs last month</span>
                </div>
              </div>
            )}
          </div>

          <SalesChart data={salesData} loading={salesLoading} error={salesError} formatCurrency={formatCurrency} />

          {/* Sales Summary Cards */}
          {salesSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100">
              <div className="text-center">
                <div className="text-sm font-bold text-blue-600">{salesSummary.total_orders}</div>
                <div className="text-[9px] text-gray-600">Total Orders</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-green-600">{formatCurrency(salesSummary.avg_order_value)}</div>
                <div className="text-[9px] text-gray-600">Avg Order Value</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-purple-600">
                  {salesData.length > 0 ? (salesSummary.total_orders / salesData.length).toFixed(1) : '0'}
                </div>
                <div className="text-[9px] text-gray-600">Orders/Day</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-orange-600">
                  {salesSummary.growth_percentage >= 0 ? '+' : ''}{salesSummary.growth_percentage.toFixed(1)}%
                </div>
                <div className="text-[9px] text-gray-600">Growth Rate</div>
              </div>
            </div>
          )}
        </div>

        {/* Category Performance Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-semibold text-gray-900">Category Performance</h3>
              <p className="text-[9px] text-gray-600">Sales distribution by product category for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            {categorySummary && (
              <div className="text-right">
                <div className="text-sm font-bold text-blue-600">
                  {categorySummary.totalCategories} Categories
                </div>
                <div className="text-[9px] text-gray-600">
                  Top: {categorySummary.topCategory} ({categorySummary.topCategoryPercentage}%)
                </div>
              </div>
            )}
          </div>

          <CategoryChart data={categoryData} loading={categoryLoading} error={categoryError} formatCurrency={formatCurrency} />

          {/* Category Summary Stats */}
          {categorySummary && categoryData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
              <div className="text-center">
                <div className="text-sm font-bold text-blue-600">{categorySummary.totalCategories}</div>
                <div className="text-[9px] text-gray-600">Total Categories</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-green-600">{categorySummary.topCategory}</div>
                <div className="text-[9px] text-gray-600">Top Category</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-purple-600">{categorySummary.topCategoryPercentage}%</div>
                <div className="text-[9px] text-gray-600">Top Category Share</div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 hidden">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <ZapIcon className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => navigate('/financial/purchase-order')}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300"
                >
                  <div className="p-2 rounded-lg mb-2 bg-blue-200 group-hover:bg-blue-300">
                    <ShoppingCartIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-center text-blue-700">New Purchase</span>
                </button>
                
                <button 
                  onClick={() => navigate('/financial/create-customer-order')}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300"
                >
                  <div className="p-2 rounded-lg mb-2 bg-green-200 group-hover:bg-green-300">
                    <PackageIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-center text-green-700">Create Order</span>
                </button>
                
                <button 
                  onClick={() => navigate('/create-invoice')}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300"
                >
                  <div className="p-2 rounded-lg mb-2 bg-emerald-200 group-hover:bg-emerald-300">
                    <FileTextIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-center text-emerald-700">Create Invoice</span>
                </button>
                
                <button 
                  onClick={() => navigate('/add-expense')}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300"
                >
                  <div className="p-2 rounded-lg mb-2 bg-red-200 group-hover:bg-red-300">
                    <DollarSignIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-center text-red-700">Add Expense</span>
                </button>
                
                <button 
                  onClick={() => navigate('/equity/entries')}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300"
                >
                  <div className="p-2 rounded-lg mb-2 bg-purple-200 group-hover:bg-purple-300">
                    <CalculatorIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-center text-purple-700">Equity Entries</span>
                </button>
                
                  <button 
                  onClick={() => navigate('/add-journal-entry')}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300"
                >
                  <div className="p-2 rounded-lg mb-2 bg-amber-200 group-hover:bg-amber-300">
                    <FileTextIcon className="w-5 h-5 text-amber-600" />
                    </div>
                  <span className="text-sm font-medium text-center text-amber-700">Journal Entry</span>
                  </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <ActivityIcon className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New sale recorded</p>
                    <p className="text-xs text-gray-500">Invoice #INV-2024-001 • $2,450.00</p>
                    <p className="text-xs text-gray-400">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Purchase order created</p>
                    <p className="text-xs text-gray-500">PO #PO-2024-032 • Supplier ABC</p>
                    <p className="text-xs text-gray-400">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Payment received</p>
                    <p className="text-xs text-gray-500">Customer XYZ • $1,200.00</p>
                    <p className="text-xs text-gray-400">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Inventory update</p>
                    <p className="text-xs text-gray-500">12 items marked as low stock</p>
                    <p className="text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Expense recorded</p>
                    <p className="text-xs text-gray-500">Office supplies • $350.00</p>
                    <p className="text-xs text-gray-400">3 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Management Cards */}
        <div className="mb-8 hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <button
              onClick={() => navigate('/payables')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md hover:border-rose-300 transition-all duration-200"
            >
              <div className="text-4xl mb-3">💸</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payables</h3>
              <p className="text-sm text-gray-600 mb-3">View & manage supplier payables</p>
              <div className="flex items-center justify-center text-sm text-gray-500 group-hover:text-gray-700">
                <span>View details</span>
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/receivables')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md hover:border-emerald-300 transition-all duration-200"
            >
              <div className="text-4xl mb-3">💰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Receivables</h3>
              <p className="text-sm text-gray-600 mb-3">View & manage customer receivables</p>
              <div className="flex items-center justify-center text-sm text-gray-500 group-hover:text-gray-700">
                <span>View details</span>
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/financial/customer-orders')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md hover:border-indigo-300 transition-all duration-200"
            >
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Orders</h3>
              <p className="text-sm text-gray-600 mb-3">View all customer orders</p>
              <div className="flex items-center justify-center text-sm text-gray-500 group-hover:text-gray-700">
                <span>View details</span>
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/pending-payments')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md hover:border-amber-300 transition-all duration-200"
            >
              <div className="text-4xl mb-3">⏰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Payments</h3>
              <p className="text-sm text-gray-600 mb-3">Review & confirm payments</p>
              <div className="flex items-center justify-center text-sm text-gray-500 group-hover:text-gray-700">
                <span>View details</span>
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

              <button
              onClick={() => navigate('/cash-equivalents')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center hover:shadow-md hover:border-blue-300 transition-all duration-200"
            >
              <div className="text-4xl mb-3">🏦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cash & Equivalents</h3>
              <p className="text-sm text-gray-600 mb-3">View all cash accounts</p>
              <div className="flex items-center justify-center text-sm text-gray-500 group-hover:text-gray-700">
                  <span>View details</span>
                <ChevronRightIcon className="w-4 h-4 ml-1" />
                </div>
              </button>
          </div>
        </div>

        {/* Business Operations */}
        <div hidden>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button
              onClick={() => navigate('/chart-of-accounts')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors">
                  <BarChart3Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chart of Accounts</h3>
              <p className="text-sm text-gray-600 mb-4">Manage accounting structure</p>
              <div className="flex items-center text-sm text-indigo-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/reports')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <BarChart3Icon className="w-6 h-6 text-blue-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Reports</h3>
              <p className="text-sm text-gray-600 mb-4">View financial reporting</p>
              <div className="flex items-center text-sm text-blue-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/suppliers')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
                  <BuildingIcon className="w-6 h-6 text-slate-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendors</h3>
              <p className="text-sm text-gray-600 mb-4">Manage vendor information</p>
              <div className="flex items-center text-sm text-slate-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/clients')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-green-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                  <UsersIcon className="w-6 h-6 text-green-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customers</h3>
              <p className="text-sm text-gray-600 mb-4">Manage customer database</p>
              <div className="flex items-center text-sm text-green-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/store-inventory')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-purple-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <PackageIcon className="w-6 h-6 text-purple-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Store Inventory</h3>
              <p className="text-sm text-gray-600 mb-4">Track inventory levels</p>
              <div className="flex items-center text-sm text-purple-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/assets')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-teal-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-teal-100 rounded-xl group-hover:bg-teal-200 transition-colors">
                  <BoxIcon className="w-6 h-6 text-teal-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Assets</h3>
              <p className="text-sm text-gray-600 mb-4">View and manage all assets</p>
              <div className="flex items-center text-sm text-teal-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

            <button
              onClick={() => navigate('/expenses')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all duration-200 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors">
                  <DollarSignIcon className="w-6 h-6 text-red-600" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expenses</h3>
              <p className="text-sm text-gray-600 mb-4">View all expenses</p>
              <div className="flex items-center text-sm text-red-600 font-medium">
                <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
              </div>
            </button>

              <button
              onClick={() => navigate('/products')}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-teal-300 transition-all duration-200 text-left"
              >
                <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-teal-100 rounded-xl group-hover:bg-teal-200 transition-colors">
                  <BoxIcon className="w-6 h-6 text-teal-600" />
                  </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Products</h3>
              <p className="text-sm text-gray-600 mb-4">View and manage all products</p>
              <div className="flex items-center text-sm text-teal-600 font-medium">
                  <span>Access now</span>
                <TrendingUpIcon className="w-4 h-4 ml-1" />
                </div>
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboardPage;
