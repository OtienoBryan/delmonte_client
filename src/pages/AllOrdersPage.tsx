// AllOrdersPage.tsx - View all sales orders in one place
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { salesOrdersService } from '../services/financialService';
import { SalesOrder } from '../types/financial';
import { receiptsService } from '../services/financialService';

interface SalesOrderRow {
  id: number;
  order_number: string;
  customer: string;
  order_date: string;
  status: string;
  my_status: number;
  total_amount: number;
  outstanding_balance: number;
  client_type_name?: string;
  outlet_account_name?: string;
}

const AllOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrderRow[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  // Get first and last day of current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(lastDayOfMonth);
  const [clientFilter, setClientFilter] = useState<string>('');
  const [clientTypeFilter, setClientTypeFilter] = useState<string>('');
  const [outletAccountFilter, setOutletAccountFilter] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  // For modal temp state
  const [tempStartDate, setTempStartDate] = useState<string>(startDate);
  const [tempEndDate, setTempEndDate] = useState<string>(endDate);
  const [tempClientFilter, setTempClientFilter] = useState<string>(clientFilter);
  const [tempClientTypeFilter, setTempClientTypeFilter] = useState<string>(clientTypeFilter);
  const [tempOutletAccountFilter, setTempOutletAccountFilter] = useState<string>(outletAccountFilter);
  const [clientTypes, setClientTypes] = useState<{ id: number; name: string }[]>([]);
  const [outletAccounts, setOutletAccounts] = useState<{ id: number; name: string }[]>([]);

  // Get unique client names from orders
  const clientNames = Array.from(new Set(orders.map(o => o.customer))).filter(Boolean);

  useEffect(() => {
    fetchSalesOrders();
    fetchReceipts();
    fetchClientTypes();
    fetchOutletAccounts();
  }, []);

  const fetchSalesOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching all sales orders (including drafts)...');
      console.log('API URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/financial/sales-orders-all`);
      
      const soRes = await salesOrdersService.getAllIncludingDrafts();
      console.log('Sales orders response:', soRes);
      console.log('Sales orders data:', soRes.data);
      console.log('Response success:', soRes.success);
      console.log('Response error:', soRes.error);
      
      const soRows: SalesOrderRow[] = (soRes.data || []).map((so: SalesOrder & { customer_name?: string; customer_balance?: number; client_type_name?: string; outlet_account_name?: string }) => ({
        id: so.id,
        order_number: so.so_number,
        customer: (so.customer_name || so.customer?.company_name || 'N/A'),
        order_date: so.order_date,
        status: so.status,
        my_status: so.my_status || 0,
        total_amount: so.total_amount,
        outstanding_balance: so.customer_balance || 0,
        client_type_name: so.client_type_name || 'N/A',
        outlet_account_name: so.outlet_account_name || 'N/A'
      }));
      
      console.log('Processed sales orders:', soRows);
      setOrders(soRows.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime()));
    } catch (err: any) {
      console.error('Error fetching sales orders:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      if (err.response?.data?.error) {
        setError(`Failed to fetch sales orders: ${err.response.data.error}`);
      } else if (err.message) {
        setError(`Failed to fetch sales orders: ${err.message}`);
      } else {
        setError('Failed to fetch sales orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReceipts = async () => {
    try {
      const res = await receiptsService.getAll();
      setReceipts(res.data || []);
    } catch (err) {
      // Optionally handle error
    }
  };

  const fetchClientTypes = async () => {
    try {
      const { clientService } = await import('../services/clientService');
      const types = await clientService.getClientTypes();
      setClientTypes(types);
    } catch (err) {
      console.error('Failed to fetch client types:', err);
    }
  };

  const fetchOutletAccounts = async () => {
    try {
      const { clientService } = await import('../services/clientService');
      const accounts = await clientService.getOutletAccounts();
      setOutletAccounts(accounts);
    } catch (err) {
      console.error('Failed to fetch outlet accounts:', err);
    }
  };

  const getAmountPaid = (orderId: number) => {
    return receipts
      .filter(r => r.invoice_id === orderId && r.status === 'confirmed')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
  };

  const fetchOrderDetails = async (id: number) => {
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const res = await salesOrdersService.getById(id);
      if (res.success && res.data) {
        setSelectedOrder(res.data);
      } else {
        setDetailsError(res.error || 'Failed to fetch order details');
      }
    } catch (err) {
      setDetailsError('Failed to fetch order details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setDetailsError(null);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(amount);

  // When opening modal, sync temp state
  const openFilterModal = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempClientFilter(clientFilter);
    setTempClientTypeFilter(clientTypeFilter);
    setTempOutletAccountFilter(outletAccountFilter);
    setShowFilterModal(true);
  };
  const closeFilterModal = () => setShowFilterModal(false);
  const applyFilters = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setClientFilter(tempClientFilter);
    setClientTypeFilter(tempClientTypeFilter);
    setOutletAccountFilter(tempOutletAccountFilter);
    setShowFilterModal(false);
  };

  // Filter orders by date range, client, client type, and outlet account
  const filteredOrders = orders.filter(order => {
    if (startDate && new Date(order.order_date) < new Date(startDate)) return false;
    if (endDate && new Date(order.order_date) > new Date(endDate)) return false;
    if (clientFilter && order.customer !== clientFilter) return false;
    if (clientTypeFilter && order.client_type_name !== clientTypeFilter) return false;
    if (outletAccountFilter && order.outlet_account_name !== outletAccountFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Sales Orders</h1>
              <p className="mt-2 text-sm text-gray-600">View all sales orders including drafts and confirmed orders</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/products-sale-report"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Products Sale Report
              </Link>
            </div>
          </div>
          {/* Debug Info */}
          {/* <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info:</h3>
            <p className="text-xs text-gray-600">Total Orders: {orders.length}</p>
            <p className="text-xs text-gray-600">Filtered Orders: {filteredOrders.length}</p>
            <p className="text-xs text-gray-600">Loading: {loading ? 'Yes' : 'No'}</p>
            <p className="text-xs text-gray-600">Error: {error || 'None'}</p>
          </div> */}
        </div>
        {/* Filter Button */}
        <div className="mb-4 flex justify-end">
          <button onClick={openFilterModal} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Filter</button>
        </div>
        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Filter Orders</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={tempStartDate} onChange={e => setTempStartDate(e.target.value)} className="border rounded px-2 py-1 w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={tempEndDate} onChange={e => setTempEndDate(e.target.value)} className="border rounded px-2 py-1 w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select value={tempClientFilter} onChange={e => setTempClientFilter(e.target.value)} className="border rounded px-2 py-1 w-full">
                    <option value="">All Clients</option>
                    {clientNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
                  <select value={tempClientTypeFilter} onChange={e => setTempClientTypeFilter(e.target.value)} className="border rounded px-2 py-1 w-full">
                    <option value="">All Client Types</option>
                    {clientTypes.map(type => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Category</label>
                  <select value={tempOutletAccountFilter} onChange={e => setTempOutletAccountFilter(e.target.value)} className="border rounded px-2 py-1 w-full">
                    <option value="">All Client Categories</option>
                    {outletAccounts.map(account => (
                      <option key={account.id} value={account.name}>{account.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button onClick={closeFilterModal} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                <button onClick={applyFilters} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Apply</button>
              </div>
            </div>
          </div>
        )}
        {/* Total Amount for All Orders */}
        {filteredOrders.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center">
            <span className="text-lg font-semibold text-blue-900 mr-2">Total Amount for All Orders:</span>
            <span className="text-xl font-bold text-blue-700">{formatCurrency(filteredOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0))}</span>
          </div>
        )}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sales orders found</h3>
              <p className="mt-1 text-sm text-gray-500">No sales orders have been created yet.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding Balance</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.customer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.client_type_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.outlet_account_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(order.order_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex flex-col">
                        <span className={order.my_status === 0 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                          {order.my_status === 0 ? 'Draft' : 'Confirmed'}
                        </span>
                        <span className="text-xs text-gray-500">{order.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(order.total_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(getAmountPaid(order.id))}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(order.total_amount - getAmountPaid(order.id))}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(order.outstanding_balance)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/sales-orders/${order.id}`} className="text-blue-600 hover:text-blue-900">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllOrdersPage; 