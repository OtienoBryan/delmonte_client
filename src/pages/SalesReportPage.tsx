import React, { useEffect, useState } from 'react';
import { salesOrdersService } from '../services/financialService';
import { SalesOrder } from '../types/financial';
import { salesOrderItemsService } from '../services/financialService';
import { SalesOrderItem } from '../types/financial';
import { Download, Filter } from 'lucide-react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const statusOptions = [
  'all',
  'draft',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'in payment',
  'paid',
];

const SalesReportPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [countryId, setCountryId] = useState('all');
  const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);
  const [regionId, setRegionId] = useState('all');
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  // Local state for modal filters
  const [modalStatus, setModalStatus] = useState(status);
  const [modalCountryId, setModalCountryId] = useState(countryId);
  const [modalRegionId, setModalRegionId] = useState(regionId);
  const [modalStartDate, setModalStartDate] = useState(startDate);
  const [modalEndDate, setModalEndDate] = useState(endDate);

  useEffect(() => {
    fetchCountries();
    fetchRegions();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await axios.get('/api/sales/countries');
      setCountries(res.data);
    } catch (err) {
      // ignore
    }
  };

  const fetchRegions = async () => {
    try {
      const res = await axios.get('/api/sales/regions');
      setRegions(res.data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchSalesOrders();
    // eslint-disable-next-line
  }, [status, startDate, endDate, countryId, regionId]);

  const fetchSalesOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await salesOrdersService.getAll();
      let data: SalesOrder[] = res.data || [];
      if (status !== 'all') {
        data = data.filter((o) => o.status === status);
      }
      if (startDate) {
        data = data.filter((o) => o.order_date >= startDate);
      }
      if (endDate) {
        data = data.filter((o) => o.order_date <= endDate);
      }
      if (countryId !== 'all') {
        data = data.filter((o) => String(o.countryId) === String(countryId));
      }
      if (regionId !== 'all') {
        data = data.filter((o) => String(o.region_id) === String(regionId));
      }
      setOrders(data);
    } catch (err: any) {
      setError('Failed to fetch sales orders');
    } finally {
      setLoading(false);
    }
  };

  const openOrderItemsModal = async (order: SalesOrder) => {
    setSelectedOrder(order);
    setModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    try {
      const res = await salesOrderItemsService.getBySalesOrderId(order.id);
      if (res.success && res.data) {
        setOrderItems(res.data);
      } else {
        setOrderItems([]);
        setModalError(res.error || 'Failed to fetch order items');
      }
    } catch (err) {
      setOrderItems([]);
      setModalError('Failed to fetch order items');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setOrderItems([]);
    setSelectedOrder(null);
    setModalError(null);
  };

  const openFilterModal = () => {
    setModalStatus(status);
    setModalCountryId(countryId);
    setModalRegionId(regionId);
    setModalStartDate(startDate);
    setModalEndDate(endDate);
    setFilterModalOpen(true);
  };
  const closeFilterModal = () => setFilterModalOpen(false);
  const applyFilters = () => {
    setStatus(modalStatus);
    setCountryId(modalCountryId);
    setRegionId(modalRegionId);
    setStartDate(modalStartDate);
    setEndDate(modalEndDate);
    setFilterModalOpen(false);
  };

  const number_format = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Summary calculations
  const totalSales = orders && Array.isArray(orders)
    ? orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
    : 0;
  const totalPaid = orders && Array.isArray(orders)
    ? orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
    : 0;
  const outstanding = totalSales - totalPaid;

  // Compute monthly sales data for the line chart
  const monthlySalesData = React.useMemo(() => {
    const monthMap: { [key: string]: number } = {};
    orders.forEach((order) => {
      if (!order.order_date || !order.total_amount) return;
      const date = new Date(order.order_date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthMap[key] = (monthMap[key] || 0) + Number(order.total_amount);
    });
    // Convert to array and sort by date
    return Object.entries(monthMap)
      .map(([key, amount]) => {
        const [year, month] = key.split('-');
        return {
          month: `${getMonthName(Number(month))} ${year}`,
          sales: amount as number,
        };
      })
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        if (aYear !== bYear) return Number(aYear) - Number(bYear);
        return getMonthIndex(aMonth) - getMonthIndex(bMonth);
      });
  }, [orders]);

  function getMonthName(month: number) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1] || '';
  }
  function getMonthIndex(monthName: string) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months.indexOf(monthName);
  }

  const exportToCSV = () => {
    if (!orders.length) return;
    const header = [
      'Order #',
      'Customer',
      'Order Date',
      'Status',
      'Total',
      'Notes',
    ];
    const rows = orders.map((o) => [
      o.so_number,
      o.customer_name || o.customer?.company_name || o.customer_id,
      o.order_date,
      o.status,
      number_format(o.total_amount),
      o.notes || '',
    ]);
    const csvContent = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Report</h1>
              <p className="text-gray-600 mt-1">Summary and details of all sales orders</p>
            </div>
            <div className="flex space-x-3">
            <button
          onClick={openFilterModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </button>
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Sales Trend Line Chart */}
      <div className="max-w-7xl mx-auto mt-8 mb-8 bg-white rounded-lg shadow p-6 hidden">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlySalesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => number_format(Number(value))} />
            <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {filterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-10 relative border border-gray-200 animate-fade-in">
            <button onClick={closeFilterModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition">
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 tracking-tight">Filter Sales Report</h2>
            <div className="space-y-6">
              {/* Status & Date */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex flex-col gap-1 w-full md:w-1/2">
                  <label className="text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select
                    value={modalStatus}
                    onChange={e => setModalStatus(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 w-full md:w-1/2">
                  <label className="text-xs font-semibold text-gray-600 mb-1">Date Range</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={modalStartDate}
                      onChange={e => setModalStartDate(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="date"
                      value={modalEndDate}
                      onChange={e => setModalEndDate(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full"
                    />
                  </div>
                </div>
              </div>
              {/* Country & Region */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex flex-col gap-1 w-full md:w-1/2">
                  <label className="text-xs font-semibold text-gray-600 mb-1">Country</label>
                  <select
                    value={modalCountryId}
                    onChange={e => setModalCountryId(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">All</option>
                    {countries.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 w-full md:w-1/2">
                  <label className="text-xs font-semibold text-gray-600 mb-1">Region</label>
                  <select
                    value={modalRegionId}
                    onChange={e => setModalRegionId(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">All</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button onClick={closeFilterModal} className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold transition">Cancel</button>
                <button onClick={applyFilters} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow transition">Apply Filters</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-7xl mx-auto">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto m-3">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <div className="text-gray-500 text-sm">Total Sales</div>
          <div className="text-2xl font-bold text-blue-700 mt-2">{number_format(totalSales)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <div className="text-gray-500 text-sm">Total Paid</div>
          <div className="text-2xl font-bold text-green-700 mt-2">{number_format(totalPaid)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <div className="text-gray-500 text-sm">Outstanding</div>
          <div className="text-2xl font-bold text-red-700 mt-2">{number_format(outstanding)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-gray-500 text-center">No sales orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openOrderItemsModal(order)}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{order.so_number}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{order.customer_name || order.customer?.company_name || order.customer_id}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{order.country_name || order.countryId || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{order.region_name || order.region_id || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{order.order_date}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{order.status}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(order.total_amount)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{order.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Items Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
            <button onClick={closeModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            <h2 className="text-xl font-bold mb-4">Order Items for {selectedOrder?.so_number}</h2>
            {modalLoading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : modalError ? (
              <div className="text-red-600 text-center">{modalError}</div>
            ) : orderItems.length === 0 ? (
              <div className="text-gray-500 text-center">No items found for this order.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Net Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Shipped Qty</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.product?.product_name || item.product_id}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(item.unit_price)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(item.tax_amount ?? 0)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(item.net_price ?? 0)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(item.total_price)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.shipped_quantity ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReportPage; 