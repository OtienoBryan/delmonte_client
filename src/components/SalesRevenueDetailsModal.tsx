import React, { useState, useEffect } from 'react';
import { X, DollarSign, TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface SalesRevenueItem {
  item_id: number;
  sales_order_id: number;
  so_number: string;
  order_date: string;
  customer_name: string;
  product_name: string;
  product_code: string;
  cost_price: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  total_cost: number;
  tax_type: string;
  net_price: number;
  tax_amount: number;
}

interface ProductSummary {
  product_id: number;
  product_name: string;
  product_code: string;
  cost_price: number;
  total_quantity: number;
  total_cost: number;
  total_revenue: number;
  total_profit: number;
  net_profit: number;
  profit_margin: number;
  net_profit_margin: number;
  tax_type: string;
  total_tax: number;
  first_sale_date: string;
  last_sale_date: string;
}

interface CategorySummary {
  category_name: string;
  total_items: number;
  total_quantity: number;
  total_cost: number;
  total_revenue: number;
  total_profit: number;
  net_profit: number;
  total_tax: number;
  profit_margin: number;
  net_profit_margin: number;
}

interface SalesRevenueData {
  items: SalesRevenueItem[];
  summary: {
    total_items: number;
    total_quantity: number;
    total_cost: number;
    total_revenue: number;
    total_tax: number;
    total_profit: number;
    net_profit: number;
    profit_margin: number;
    net_profit_margin: number;
  };
  product_summary: ProductSummary[];
  category_summary: CategorySummary[];
}

interface Category {
  id: number;
  name: string;
}

interface SalesRevenueDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: string;
  customStartDate?: string;
  customEndDate?: string;
}

const SalesRevenueDetailsModal: React.FC<SalesRevenueDetailsModalProps> = ({
  isOpen,
  onClose,
  period,
  customStartDate,
  customEndDate
}) => {
  const [data, setData] = useState<SalesRevenueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'summary' | 'category'>('summary');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchSalesRevenueDetails();
    }
  }, [isOpen, period, customStartDate, customEndDate, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/financial/reports/categories`);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchSalesRevenueDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (period === 'custom' && customStartDate && customEndDate) {
        params.append('start_date', customStartDate);
        params.append('end_date', customEndDate);
      }
      if (selectedCategory !== 'all') {
        params.append('category_id', selectedCategory);
      }

      const response = await axios.get(`${API_BASE_URL}/financial/reports/sales-revenue-details?${params}`);
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch sales revenue details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales revenue details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(amount);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Sales Revenue Details</h2>
              <p className="text-sm text-gray-500 mt-1">
                Period: {period === 'custom' && customStartDate && customEndDate 
                  ? `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`
                  : period.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Period:</span>
              <select 
                value={period} 
                onChange={(e) => {
                  // This would need to be handled by the parent component
                  // For now, we'll just show the current period
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled
              >
                <option value="current_month">Current Month</option>
                <option value="last_month">Last Month</option>
                <option value="current_year">Current Year</option>
                <option value="last_year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Category:</span>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            {period === 'custom' && customStartDate && customEndDate && (
              <span className="text-sm text-gray-600">
                {formatDate(customStartDate)} - {formatDate(customEndDate)}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Product Summary
            </button>
            <button
              onClick={() => setActiveTab('category')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'category'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Category Summary
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'items'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="h-4 w-4 inline mr-2" />
              Individual Items
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Loading sales revenue details...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="ml-2 text-sm font-medium text-green-800">Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(data.summary.total_revenue - data.summary.total_tax)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <span className="ml-2 text-sm font-medium text-blue-800">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(data.summary.total_revenue)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="ml-2 text-sm font-medium text-red-800">Total Cost</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">{formatCurrency(data.summary.total_cost)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <span className="ml-2 text-sm font-medium text-purple-800">Gross Profit</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(data.summary.total_profit)}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-indigo-600" />
                    <span className="ml-2 text-sm font-medium text-indigo-800">Net Profit</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-900">{formatCurrency(data.summary.net_profit)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <span className="ml-2 text-sm font-medium text-gray-800">Date Range</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {data.items.length > 0 ? (
                      <>
                        {formatDate(data.items[data.items.length - 1].order_date)} - {formatDate(data.items[0].order_date)}
                      </>
                    ) : 'N/A'}
                  </p>
                </div>
              </div>

              {activeTab === 'summary' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Summary</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Product
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Cost Price
                           </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Revenue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Profit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Net Profit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Margin
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Net Margin
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tax Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            First Sale
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Sale
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.product_summary.map((product) => (
                          <tr key={product.product_id} className="hover:bg-gray-50">
                                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                               {product.product_name}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                               {formatCurrency(product.cost_price)}
                             </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.total_quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(product.total_cost)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(product.total_revenue)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              product.total_profit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(product.total_profit)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              product.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(product.net_profit)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              product.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatPercentage(product.profit_margin)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              product.net_profit_margin >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatPercentage(product.net_profit_margin)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.tax_type || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.first_sale_date ? formatDate(product.first_sale_date) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.last_sale_date ? formatDate(product.last_sale_date) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'category' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Category Summary</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Revenue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Tax
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Revenue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Net Profit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Profit Margin
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Net Margin
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.category_summary.map((category, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {category.category_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {category.total_items}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {category.total_quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(category.total_revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(category.total_tax)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(category.total_revenue - category.total_tax)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(category.total_cost)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              category.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(category.net_profit)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              category.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatPercentage(category.profit_margin)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              category.net_profit_margin >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatPercentage(category.net_profit_margin)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'items' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Individual Items</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cost Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Profit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Net Profit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tax Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tax Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.items.map((item) => (
                          <tr key={item.item_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.so_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(item.order_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.customer_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.product_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(item.cost_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(item.total_cost)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(item.total_price)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              (item.total_price - item.total_cost) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(item.total_price - item.total_cost)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              (item.total_price - item.total_cost - (item.tax_amount || 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(item.total_price - item.total_cost - (item.tax_amount || 0))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.tax_type || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(item.tax_amount || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesRevenueDetailsModal;
