import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { assetPurchaseOrdersService } from '../services/financialService';

const AssetPurchaseOrdersPage: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await assetPurchaseOrdersService.getAll();
      if (response.success) {
        setPurchaseOrders(response.data || []);
      } else {
        setError(response.error || 'Failed to fetch asset purchase orders');
      }
    } catch (err) {
      setError('Failed to fetch asset purchase orders');
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
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2
    }).format(amount);
  };

  const filteredOrders = useMemo(() => {
    let filtered = purchaseOrders.filter(po => {
      // Status filter
      if (statusFilter !== 'all' && po.status !== statusFilter) return false;
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesPO = po.apo_number?.toLowerCase().includes(search);
        const matchesSupplier = po.supplier_name?.toLowerCase().includes(search);
        const matchesNotes = po.notes?.toLowerCase().includes(search);
        if (!matchesPO && !matchesSupplier && !matchesNotes) return false;
      }
      
      return true;
    });

    return filtered;
  }, [purchaseOrders, statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Asset Purchase Orders</h1>
              <p className="mt-1 text-xs text-gray-600">Manage asset purchase orders and receipts</p>
            </div>
            <Link
              to="/asset-purchase-order"
              className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              New Purchase Order
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by APO number, supplier, notes..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">APO Number</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">
                      No asset purchase orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {po.apo_number}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                        {po.supplier_name || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                        {formatDate(po.order_date)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        KES {formatCurrency(po.total_amount)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {getStatusBadge(po.status)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        {po.status !== 'received' && po.status !== 'cancelled' && (
                          <Link
                            to={`/receive-asset-purchase-order/${po.id}`}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Receive
                          </Link>
                        )}
                        <Link
                          to={`/asset-purchase-order/${po.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetPurchaseOrdersPage;

