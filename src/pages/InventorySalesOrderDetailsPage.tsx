import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { salesOrdersService, salesOrderItemsService } from '../services/financialService';
import { SalesOrder, SalesOrderItem } from '../types/financial';
import { riderService, Rider } from '../services/riderService';

const InventorySalesOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Assign Rider modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch order details
      const orderRes = await salesOrdersService.getById(parseInt(id!));
      if (orderRes.success && orderRes.data) {
        setOrder(orderRes.data);
        
        // Fetch order items
        const itemsRes = await salesOrderItemsService.getBySalesOrderId(orderRes.data.id);
        if (itemsRes.success && itemsRes.data) {
          setOrderItems(itemsRes.data);
        }
      } else {
        setError('Order not found');
      }
    } catch (err: any) {
      setError('Failed to fetch order details');
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Assign Rider modal logic
  const openAssignRiderModal = async () => {
    if (!order) return;
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
    setSelectedRider(null);
    setAssignError(null);
  };

  const handleAssignRider = async () => {
    if (!order || !selectedRider) return;
    setAssignLoading(true);
    setAssignError(null);
    try {
      const response = await salesOrdersService.assignRider(order.id, selectedRider);
      if (response.success) {
        alert('Rider assigned successfully! Order status updated to shipped and stock quantities reduced in store ID 1.');
      }
      closeAssignModal();
      fetchOrderDetails(); // Refresh order details
    } catch (err) {
      setAssignError('Failed to assign rider');
    } finally {
      setAssignLoading(false);
    }
  };

  // Handler for receiving items back to stock
  const handleReceiveBackToStock = async () => {
    if (!order) return;
    if (!window.confirm(`Are you sure you want to receive items back to stock for order #${order.so_number}?`)) return;
    try {
      const res = await salesOrdersService.receiveBackToStock(order.id);
      if (res.success) {
        alert('Items received back to stock successfully.');
        fetchOrderDetails(); // Refresh order details
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

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      'in payment': 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error || 'Order not found'}</div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/inventory-sales"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              ← Back to Inventory Sales
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white shadow-sm border-b mb-6">
          <div className="px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-4">
                <Link
                  to="/inventory-sales"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  ← Back to Inventory Sales
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
              </div>
              <p className="text-gray-600 mt-1">Order #{order.so_number}</p>
            </div>
            <div className="flex items-center gap-3">
              {order.my_status === 1 && (
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                  onClick={openAssignRiderModal}
                >
                  Assign Rider
                </button>
              )}
              {order.my_status === 4 && (
                <button
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 text-sm font-medium"
                  onClick={handleReceiveBackToStock}
                >
                  Receive Back to Stock
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Order Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Order Number:</span>
                <span className="text-sm text-gray-900">{order.so_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Order Date:</span>
                <span className="text-sm text-gray-900">{order.order_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <span className="text-sm">{getStatusBadge(order.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Progress:</span>
                <span className="text-sm text-gray-900">{getProgressStatus(order.my_status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Total Amount:</span>
                <span className="text-sm font-semibold text-gray-900">{number_format(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-500">Customer:</span>
                <span className="text-sm text-gray-900">{order.customer_name || order.customer?.company_name || order.customer_id}</span>
              </div>
              {order.rider_name && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Assigned Rider:</span>
                  <span className="text-sm text-gray-900">{order.rider_name} ({order.rider_contact})</span>
                </div>
              )}
              {order.notes && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Notes:</span>
                  <span className="text-sm text-gray-900">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
          {orderItems.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No items found for this order.</div>
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
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(item.tax_amount || 0)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(item.net_price || 0)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(item.total_price || 0)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.shipped_quantity || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign Rider Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button onClick={closeAssignModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            <h2 className="text-xl font-bold mb-4">Assign Rider to Order {order.so_number}</h2>
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

export default InventorySalesOrderDetailsPage; 