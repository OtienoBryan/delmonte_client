import React, { useState, useEffect } from 'react';
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
  PlusIcon,
  ChevronRightIcon,
  ActivityIcon,
  ZapIcon,
  SettingsIcon,
  BellIcon,
  SearchIcon,
  FilterIcon,
  NotebookIcon,
  ReceiptIcon,
  CalculatorIcon,
  PiggyBankIcon,
  TrendingDownIcon,
  EyeIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ShoppingBasketIcon,
  MessageSquareIcon,
  ArrowUpIcon
} from 'lucide-react';
import { dashboardService } from '../services/financialService';
import { API_CONFIG } from '../config/api';
import type { DashboardStats } from '../types/financial';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor?: string;
  iconColor?: string;
  iconBgColor?: string;
  textColor?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  bgColor = 'bg-blue-50',
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  textColor = 'text-gray-700',
  onClick
}) => {
  return (
    <div
      className={`${bgColor} rounded-lg p-3 cursor-pointer transform transition-all duration-200 shadow-md hover:scale-105 hover:shadow-xl`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`${iconBgColor} ${iconColor} p-1.5 rounded-md mb-1.5 shadow-sm`}>
          {icon}
        </div>
        <p className={`text-[10px] font-medium ${textColor} mb-0.5`}>
          {title}
        </p>
        <p className={`text-base font-bold ${textColor}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

const FinancialDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const [newCreditNotesCount, setNewCreditNotesCount] = useState<number>(0);
  const [hasNewChat, setHasNewChat] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);
    dashboardService.getStats()
      .then(res => {
        if (res.success && res.data) {
          setStats(res.data);
        } else {
          setError(res.error || 'Failed to load dashboard stats');
        }
      })
      .catch(() => setError('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Fetch count of new (my_status = 0) orders for badge on Customer Orders card
    const fetchNewOrders = async () => {
      try {
        const url = API_CONFIG.getUrl('/financial/sales-orders-all');
        const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const data = await res.json();
        if (res.ok && data && data.success && Array.isArray(data.data)) {
          const count = data.data.filter((o: any) => String(o.my_status || '0') === '0').length;
          setNewOrdersCount(count);
        }
      } catch {}
    };
    
    // Fetch count of new (my_status = 0) credit notes for badge on Credit Notes card
    const fetchNewCreditNotes = async () => {
      try {
        const url = API_CONFIG.getUrl('/financial/credit-notes');
        const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const data = await res.json();
        if (res.ok && data && data.success && Array.isArray(data.data)) {
          // Count credit notes with my_status = 0 (new/unprocessed)
          const count = data.data.filter((cn: any) => String(cn.my_status || '0') === '0').length;
          setNewCreditNotesCount(count);
        }
      } catch {}
    };
    
    const fetchChatLatest = async () => {
      try {
        const url = API_CONFIG.getUrl('/chat/latest');
        const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const data = await res.json();
        if (res.ok && data && data.success) {
          const lastMessage = data.last_message_at ? new Date(data.last_message_at).getTime() : 0;
          const lastVisited = Number(localStorage.getItem('chat_last_visited_ts') || 0);
          setHasNewChat(lastMessage > lastVisited);
        }
      } catch {}
    };
    fetchNewOrders();
    fetchNewCreditNotes();
    fetchChatLatest();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const navigationItems = [
    // Row 1
    { to: '/purchase-orders', label: 'Purchases', icon: <ShoppingCartIcon className="h-4 w-4" />, bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    { to: '/financial/create-customer-order', label: 'Create Order', icon: <PackageIcon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { to: '/riders', label: 'Sales Reps', icon: <UsersIcon className="h-4 w-4" />, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { to: '/financial/customer-orders', label: 'Customer Orders', icon: <PackageIcon className="h-4 w-4" />, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600', badge: newOrdersCount },
    
    // Row 2
    { to: '/add-journal-entry', label: 'Journal Entry', icon: <FileTextIcon className="h-4 w-4" />, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { to: '/reports', label: 'Financial Reports', icon: <BarChart3Icon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { to: '/suppliers', label: 'Vendors', icon: <BuildingIcon className="h-4 w-4" />, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { to: '/clients', label: 'Customers', icon: <UsersIcon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    
    // Row 3
    { to: '/create-credit-note', label: 'Create Credit Note', icon: <FileTextIcon className="h-4 w-4" />, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { to: '/invoice-list', label: 'Sub-Category Invoices', icon: <FileTextIcon className="h-4 w-4" />, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { to: '/add-expense', label: 'Add Expense', icon: <DollarSignIcon className="h-4 w-4" />, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
    { to: '/equity/entries', label: 'Equity Entries', icon: <CalculatorIcon className="h-4 w-4" />, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    
    // Row 4
    { to: '/store-inventory', label: 'Store Inventory', icon: <PackageIcon className="h-4 w-4" />, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
    { to: '/assets', label: 'Assets', icon: <BoxIcon className="h-4 w-4" />, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
    { to: '/expense-summary', label: 'Expenses', icon: <DollarSignIcon className="h-4 w-4" />, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
    { to: '/products', label: 'Products', icon: <BoxIcon className="h-4 w-4" />, bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    
    // Row 5
    { to: '/all-orders', label: 'Sales Orders', icon: <DollarSignIcon className="h-4 w-4" />, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
    { to: '/credit-notes', label: 'Credit Notes', icon: <FileTextIcon className="h-4 w-4" />, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600', badge: newCreditNotesCount },
    { to: '/payables', label: 'Payables', icon: <DollarSignIcon className="h-4 w-4" />, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
    { to: '/receivables', label: 'Receivables', icon: <PiggyBankIcon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    
    // Row 6
    { to: '/cash-equivalents', label: 'Cash & Equivalents', icon: <PiggyBankIcon className="h-4 w-4" />, bgColor: 'bg-cyan-50', iconColor: 'text-cyan-600' },
    { to: '/instant-chat', label: 'Team Chat', icon: <MessageSquareIcon className="h-4 w-4" />, bgColor: 'bg-blue-50', iconColor: 'text-blue-600', badge: hasNewChat ? 1 : 0 },
    { to: '/pending-payments', label: 'Pending Payments', icon: <ClockIcon className="h-4 w-4" />, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { to: '/financial/purchase-order', label: 'Post Uplift Sale', icon: <ArrowUpIcon className="h-4 w-4" />, bgColor: 'bg-pink-50', iconColor: 'text-pink-600' },
    
    // Row 7
    { to: '/store-inventory', label: 'Outlets Stock', icon: <PackageIcon className="h-4 w-4" />, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { to: '/settings', label: 'Settings', icon: <SettingsIcon className="h-4 w-4" />, bgColor: 'bg-gray-100', iconColor: 'text-gray-600' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard
            title="Total Sales"
            value={stats ? formatCurrency(stats.totalSales) : 'Ksh 0.00'}
            icon={<DollarSignIcon className="h-5 w-5" />}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            textColor="text-gray-800"
            onClick={() => navigate('/reports')}
          />
          
          <StatCard
            title="Cost of Goods"
            value={stats ? formatCurrency(stats.totalPurchases) : 'Ksh 0.00'}
            icon={<ShoppingCartIcon className="h-5 w-5" />}
            bgColor="bg-purple-50"
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
            textColor="text-gray-800"
            onClick={() => navigate('/purchase-orders')}
          />

          <StatCard
            title="Expenses"
            value="Ksh 0.00"
            icon={<FileTextIcon className="h-5 w-5" />}
            bgColor="bg-yellow-50"
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-100"
            textColor="text-gray-800"
            onClick={() => navigate('/expense-summary')}
          />

          <StatCard
            title="Gross Profit"
            value={stats ? formatCurrency(stats.totalSales - stats.totalPurchases) : 'Ksh 0.00'}
            icon={<BarChart3Icon className="h-5 w-5" />}
            bgColor="bg-green-50"
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
            textColor="text-gray-800"
            onClick={() => navigate('/reports')}
          />
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
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
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[10px] font-semibold bg-red-600 text-white shadow-lg">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboardPage;