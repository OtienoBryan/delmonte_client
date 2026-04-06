import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { purchaseOrdersService } from '../services/financialService';

const SupplierInvoicesPage: React.FC = () => {
  const { supplierId: paramSupplierId } = useParams<{ supplierId: string }>();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const supplierId = paramSupplierId || query.get('supplierId');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!supplierId) {
        setError('Supplier ID is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await purchaseOrdersService.getAll();
        if (res.success) {
          let filtered = (res.data || []).filter((po: any) => String(po.supplier_id) === String(supplierId));
          
          // Apply status filter
          if (statusFilter !== 'all') {
            filtered = filtered.filter((po: any) => po.status === statusFilter);
          }
          
          setInvoices(filtered);
        } else {
          setError(res.error || 'Failed to fetch invoices');
        }
      } catch (err: any) {
        console.error('Error fetching invoices:', err);
        setError(err?.message || 'Failed to fetch invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [supplierId, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full py-8 px-2 sm:px-4 lg:px-6">
        <h1 className="text-xl font-bold mb-4">Purchase Orders for Supplier</h1>
        <div className="mb-4 flex items-center justify-between">
          <Link to="/suppliers" className="text-xs text-blue-600 hover:underline">Back to Suppliers</Link>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-700">Filter by status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-xs text-gray-600">Loading purchase orders...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-600 mb-4">{error}</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Delivery</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Remaining</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 text-center text-xs text-gray-500">
                        {statusFilter === 'all' 
                          ? 'No purchase orders found for this supplier.' 
                          : `No purchase orders with status "${statusFilter}" found for this supplier.`}
                      </td>
                    </tr>
                  ) : (
                    invoices.map((po: any) => (
                      <tr key={po.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">{po.po_number}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">{po.order_date}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">{po.expected_delivery_date || '-'}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-xs text-blue-700 font-semibold">{Number(po.total_amount).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-xs text-green-700 font-semibold">{Number(po.amount_paid || 0).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-xs text-red-700 font-semibold">{Number(po.balance_remaining || (po.total_amount - (po.amount_paid || 0))).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">{po.status}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">
                          <Link to={`/purchase-orders/${po.id}`} className="text-blue-600 hover:underline">View</Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierInvoicesPage; 