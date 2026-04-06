import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { assetPurchaseOrdersService } from '../services/financialService';

const AssetPurchaseOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [purchaseOrder, setPurchaseOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPurchaseOrder();
    }
  }, [id]);

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await assetPurchaseOrdersService.getById(parseInt(id!));
      if (response.success) {
        setPurchaseOrder(response.data);
      } else {
        setError(response.error || 'Failed to fetch purchase order');
      }
    } catch (err) {
      setError('Failed to fetch purchase order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; label: string; icon: string } } = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: '📝' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent', icon: '📤' },
      received: { color: 'bg-green-100 text-green-800', label: 'Received', icon: '✅' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: '❌' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleSendPO = async () => {
    if (!id) return;
    try {
      setSubmitting(true);
      const response = await assetPurchaseOrdersService.updateStatus(parseInt(id), 'sent');
      if (response.success) {
        alert('Asset purchase order sent successfully!');
        await fetchPurchaseOrder();
      }
    } catch (err) {
      alert('Failed to send asset purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Asset purchase order not found</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/asset-purchase-orders')}
            className="text-xs text-blue-600 hover:text-blue-800 mb-2 flex items-center"
          >
            ← Back to Asset Purchase Orders
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Asset Purchase Order</h1>
              <p className="mt-1 text-xs text-gray-600">APO #{purchaseOrder.apo_number}</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(purchaseOrder.status)}
              {purchaseOrder.status === 'draft' && (
                <button
                  onClick={handleSendPO}
                  disabled={submitting}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitting ? 'Sending...' : 'Send PO'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Order Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-gray-500">Supplier</p>
              <p className="font-semibold text-gray-900">{purchaseOrder.supplier_name}</p>
            </div>
            <div>
              <p className="text-gray-500">Order Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(purchaseOrder.order_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Items</p>
              <p className="font-semibold text-gray-900">{purchaseOrder.items?.length || 0}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-gray-500">Subtotal</p>
              <p className="font-semibold text-gray-900">{formatCurrency(purchaseOrder.subtotal)}</p>
            </div>
            <div>
              <p className="text-gray-500">Tax</p>
              <p className="font-semibold text-gray-900">{formatCurrency(purchaseOrder.tax_amount)}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Amount</p>
              <p className="font-semibold text-gray-900">{formatCurrency(purchaseOrder.total_amount)}</p>
            </div>
          </div>
          {purchaseOrder.notes && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-gray-500 text-xs">Notes</p>
              <p className="text-xs text-gray-900 mt-1">{purchaseOrder.notes}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Asset Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Asset Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tax</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseOrder.items?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-xs text-gray-900">{item.asset_name}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.asset_type}</td>
                    <td className="px-3 py-2 text-xs text-gray-900">{item.quantity}</td>
                    <td className="px-3 py-2 text-xs text-gray-900">{formatCurrency(item.unit_price)}</td>
                    <td className="px-3 py-2 text-xs text-gray-700">{item.tax_amount ? formatCurrency(item.tax_amount) : 'N/A'}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-gray-900">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold text-gray-900">
                    Total Amount:
                  </td>
                  <td className="px-3 py-2 text-xs font-bold text-gray-900">
                    {formatCurrency(purchaseOrder.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        {purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled' && (
          <div className="mt-4 flex justify-end">
            <Link
              to={`/receive-asset-purchase-order/${purchaseOrder.id}`}
              className="inline-flex items-center px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Receive Assets
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetPurchaseOrderDetailsPage;

