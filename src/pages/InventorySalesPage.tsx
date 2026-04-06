import React, { useEffect, useState } from 'react';
import { salesOrdersService, salesOrderItemsService } from '../services/financialService';
import { SalesOrder, SalesOrderItem } from '../types/financial';
import { Link } from 'react-router-dom';
import { riderService, Rider } from '../services/riderService';

const statusOptions = [
  'all',
  'draft',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled'
];

const progressOptions = [
  { value: 'all', label: 'All' },
  { value: 1, label: 'Approved' },
  { value: 2, label: 'In Transit' },
  { value: 3, label: 'Delivered' },
  { value: 4, label: 'Cancelled' }
];

const InventorySalesPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('all');
  const [progress, setProgress] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  // Assign Rider modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<SalesOrder | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    fetchSalesOrders();
    // eslint-disable-next-line
  }, [status, progress]);

  const fetchSalesOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await salesOrdersService.getAll();
      let data: SalesOrder[] = res.data || [];
      if (status !== 'all') {
        data = data.filter((o) => o.status === status);
      }
      if (progress !== 'all') {
        data = data.filter((o) => o.my_status === Number(progress));
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

  // Assign Rider modal logic
  const openAssignRiderModal = async (order: SalesOrder) => {
    setAssigningOrder(order);
    setAssignModalOpen(true);
    setAssignError(null);
    setSelectedRider(null);
    try {
      const ridersList = await riderService.getRiders();
      setRiders(ridersList);
      if (ridersList.length === 0) {
        setAssignError('No riders found. Please add riders.');
      }
    } catch (err) {
      setRiders([]);
      setAssignError('Failed to fetch riders');
    }
  };
  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setAssigningOrder(null);
    setSelectedRider(null);
    setAssignError(null);
  };
  const handleAssignRider = async () => {
    if (!assigningOrder || !selectedRider) return;
    setAssignLoading(true);
    setAssignError(null);
    try {
      const response = await salesOrdersService.assignRider(assigningOrder.id, selectedRider);
      if (response.success) {
        alert('Rider assigned successfully! Order status updated to shipped and stock quantities reduced in store ID 1.');
      }
      closeAssignModal();
      fetchSalesOrders();
    } catch (err) {
      setAssignError('Failed to assign rider');
    } finally {
      setAssignLoading(false);
    }
  };

  // Handler for receiving items back to stock
  const handleReceiveBackToStock = async (order: SalesOrder) => {
    if (!window.confirm(`Are you sure you want to receive items back to stock for order #${order.so_number}?`)) return;
    try {
      const res = await salesOrdersService.receiveBackToStock(order.id);
      if (res.success) {
        alert('Items received back to stock successfully.');
        fetchSalesOrders();
      } else {
        alert(res.error || 'Failed to receive items back to stock.');
      }
    } catch (err) {
      alert('Failed to receive items back to stock.');
    }
  };

  const number_format = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Map my_status to human-readable label
  const getProgressStatus = (my_status?: number) => {
    switch (my_status) {
      case 1:
        return 'Approved';
      case 2:
        return 'In Transit';
      case 3:
        return 'Delivered';
      case 4:
        return 'Cancelled';
      default:
        return '-';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b mb-6">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Sales</h1>
            <p className="text-gray-600 mt-1">View all sales orders and their status</p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Status:</label>
            <select
              id="status-filter"
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
            <label htmlFor="progress-filter" className="text-sm font-medium text-gray-700 ml-4">Progress:</label>
            <select
              id="progress-filter"
              value={progress}
              onChange={e => setProgress(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {progressOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="max-w-8xl mx-auto bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-gray-500 text-center">No sales orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rider</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Outstanding Balance</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openOrderItemsModal(order)}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{order.so_number}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{order.customer_name || order.customer?.company_name || order.customer_id}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{order.order_date}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 capitalize">{order.status}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{getProgressStatus(order.my_status)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{order.rider_name ? `${order.rider_name} (${order.rider_contact})` : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(order.total_amount)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format((order as any).customer_balance || 0)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{order.notes || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {order.my_status === 1 && (
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                          onClick={e => { e.stopPropagation(); openAssignRiderModal(order); }}
                        >
                          Assign Rider
                        </button>
                      )}
                      {order.my_status === 4 && (
                        <button
                          className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 text-xs ml-2"
                          onClick={e => { e.stopPropagation(); handleReceiveBackToStock(order); }}
                        >
                          Receive Back to Stock
                        </button>
                      )}
                    </td>
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

      {/* Assign Rider Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button onClick={closeAssignModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            <h2 className="text-xl font-bold mb-4">Assign Rider to Order {assigningOrder?.so_number}</h2>
            {assignError && <div className="text-red-600 mb-2">{assignError}</div>}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Rider</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={selectedRider ?? ''}
                onChange={e => setSelectedRider(Number(e.target.value))}
                disabled={riders.length === 0}
              >
                <option value="">-- Select Rider --</option>
                {riders.map(rider => (
                  <option key={rider.id} value={rider.id}>{rider.name} ({rider.contact})</option>
                ))}
              </select>
              {riders.length === 0 && (
                <div className="text-xs text-red-500 mt-2">No riders available. Please add riders.</div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeAssignModal}
                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                disabled={assignLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRider}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                disabled={assignLoading || !selectedRider}
              >
                {assignLoading ? 'Assigning...' : 'Assign Rider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySalesPage; 