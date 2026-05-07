import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Download, Home, Package, Search, ShoppingCart } from 'lucide-react';

type OrderItemRow = {
  id: number;
  sales_order_id: number;
  so_number: string;
  client_id: number;
  customer_name: string | null;
  region_name: string | null;
  outlet_type_name: string | null;
  outlet_account_name: string | null;
  order_date: string | null;
  created_at: string | null;
  my_status: number | null;
  status: string | null;
  product_id: number;
  product_name: string | null;
  quantity: number;
  tax_type: string | null;
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

const CustomerOrderItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);
  const ALL_LIMIT = 1000000;

  const buildCsv = (rows: OrderItemRow[]) => {
    const escape = (value: any) => {
      if (value == null) return '';
      const s = String(value);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headers = ['Order #', 'Customer', 'Region', 'Outlet Type', 'Outlet Account', 'Product', 'Qty', 'Date'];
    const lines = rows.map((r) => [
      escape(r.so_number),
      escape(r.customer_name || ''),
      escape(r.region_name || ''),
      escape(r.outlet_type_name || ''),
      escape(r.outlet_account_name || ''),
      escape(r.product_name || r.product_id),
      escape(r.quantity),
      escape(r.order_date || r.created_at || '')
    ].join(','));

    return [headers.join(','), ...lines].join('\r\n');
  };

  const exportCsv = async () => {
    try {
      setExporting(true);
      setError(null);

      let rows: OrderItemRow[] = items;

      if (limit !== ALL_LIMIT && total > items.length) {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('limit', String(ALL_LIMIT));
        if (search.trim()) params.set('search', search.trim());
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);

        const response = await axios.get(`/api/customer-orders/items?${params.toString()}`);
        const payload = response.data?.data;
        rows = Array.isArray(payload?.items) ? payload.items : [];
      }

      const csv = buildCsv(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

      const nameParts = ['ordered-items'];
      if (startDate) nameParts.push(startDate);
      if (endDate) nameParts.push(endDate);
      const filename = `${nameParts.join('_')}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.response?.data?.details || e?.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        if (search.trim()) params.set('search', search.trim());
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);

        const response = await axios.get(`/api/customer-orders/items?${params.toString()}`);
        const payload = response.data?.data;

        if (cancelled) return;

        setItems(Array.isArray(payload?.items) ? payload.items : []);
        setTotal(Number(payload?.pagination?.total) || 0);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.response?.data?.details || e?.message || 'Failed to load order items');
        setItems([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [page, limit, search, startDate, endDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center">
              <Package className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-sm font-bold text-gray-900">All Ordered Items</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-gray-500">{total} items</span>
              <button
                onClick={exportCsv}
                disabled={exporting || items.length === 0}
                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export to CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
              </button>
              <button
                onClick={() => navigate('/financial/customer-orders')}
                className="px-3 py-1.5 text-xs bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center space-x-1.5"
                title="Back to Customer Orders"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Customer Orders</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center space-x-1.5"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-xs rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3">
          <div className="flex flex-col lg:flex-row lg:items-end gap-2">
            <div className="flex-1">
              <label className="block text-[9px] font-medium text-gray-600 mb-0.5">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search order #, customer, product..."
                  className="w-full pl-7 pr-2 py-1.5 text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-[9px] font-medium text-gray-600 mb-0.5">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2 py-1.5 text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-[9px] font-medium text-gray-600 mb-0.5">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2 py-1.5 text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="w-full sm:w-32">
              <label className="block text-[9px] font-medium text-gray-600 mb-0.5">Per page</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full px-2 py-1.5 text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={ALL_LIMIT}>All</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-xs font-medium text-gray-900">Items</h3>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-xs font-medium text-gray-900 mb-1">No items found</h3>
              <p className="text-[10px] text-gray-500">Try adjusting your search or date range.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-4 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-4 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Outlet Type
                    </th>
                    <th className="px-4 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Outlet Account
                    </th>
                    <th className="px-4 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-2 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider w-20">
                      Cases
                    </th>
                    <th className="px-4 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider w-28">
                      Date
                    </th>
                    <th className="px-2 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-[10px] font-medium text-gray-900">{row.so_number || '—'}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">{row.customer_name || 'Unknown'}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">{row.region_name || '—'}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">{row.outlet_type_name || '—'}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">{row.outlet_account_name || '—'}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-[10px] text-gray-900">{row.product_name || `Product ${row.product_id}`}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <div className="text-[10px] text-gray-900">{row.quantity ?? '—'}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">{formatDate(row.order_date || row.created_at)}</div>
                      </td>
                      <td className="px-2 py-2 text-[10px] font-medium">
                        <button
                          onClick={() => navigate(`/sales-orders/${row.sales_order_id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Open order"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="text-[10px] text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 text-[10px] border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-1 text-[10px] border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderItemsPage;

