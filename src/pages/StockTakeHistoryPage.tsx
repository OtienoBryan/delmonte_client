import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { productsService, stockTakeService } from '../services/financialService';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

const StockTakeHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    store_id: '',
    start_date: '',
    end_date: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [items, setItems] = useState<Record<number, any[]>>({});
  const [itemsLoading, setItemsLoading] = useState<Record<number, boolean>>({});
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchStores();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, [filters, page]);

  const fetchStores = async () => {
    const res = await axios.get('/api/financial/stores');
    if (res.data.success) setStores(res.data.data || []);
  };

  const fetchProducts = async () => {
    const res = await productsService.getAll();
    if (res.success) setProducts(res.data || []);
  };

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { ...filters, page, limit: pageSize };
      const res = await axios.get('/api/financial/stock-take-history', { params });
      if (res.data.success && res.data.data) {
        setHistory(res.data.data);
        if (res.data.pagination && res.data.pagination.totalPages) setTotalPages(res.data.pagination.totalPages);
        else setTotalPages(1);
      } else {
        setHistory([]);
        setTotalPages(1);
      }
    } catch (err) {
      setError('Failed to fetch stock take history');
      setHistory([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!items[id]) {
      setItemsLoading(prev => ({ ...prev, [id]: true }));
      const res = await stockTakeService.getItems(id);
      if (res.success) {
        setItems(prev => ({ ...prev, [id]: res.data }));
      }
      setItemsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    if (!history.length) return;
    let csvContent = 'Date,Store,Staff,Notes,Product,System Qty,Counted Qty,Difference\n';
    for (const t of history) {
      let itemsForTake = items[t.id];
      if (!itemsForTake) {
        // fetch if not loaded
        const res = await stockTakeService.getItems(t.id);
        itemsForTake = res.success ? res.data : [];
      }
      if (itemsForTake && itemsForTake.length > 0) {
        for (const item of itemsForTake) {
          csvContent += [
            t.take_date ? new Date(t.take_date).toLocaleDateString() : '-',
            t.store_name,
            t.staff_name,
            t.notes || '-',
            item.product_name || item.product_id,
            item.system_quantity,
            item.counted_quantity,
            item.difference
          ].map(val => `"${val}"`).join(',') + '\n';
        }
      } else {
        csvContent += [
          t.take_date ? new Date(t.take_date).toLocaleDateString() : '-',
          t.store_name,
          t.staff_name,
          t.notes || '-',
          '', '', '', ''
        ].map(val => `"${val}"`).join(',') + '\n';
      }
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stock_take_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!history.length) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    const headers = ['Date', 'Store', 'Staff', 'Notes', 'Product', 'System Qty', 'Counted Qty', 'Difference'];
    const body: any[] = [];
    for (const t of history) {
      let itemsForTake = items[t.id];
      if (!itemsForTake) {
        // fetch if not loaded
        const res = await stockTakeService.getItems(t.id);
        itemsForTake = res.success ? res.data : [];
      }
      if (itemsForTake && itemsForTake.length > 0) {
        for (const item of itemsForTake) {
          body.push([
            t.take_date ? new Date(t.take_date).toLocaleDateString() : '-',
            t.store_name,
            t.staff_name,
            t.notes || '-',
            item.product_name || item.product_id,
            item.system_quantity,
            item.counted_quantity,
            item.difference
          ]);
        }
      } else {
        body.push([
          t.take_date ? new Date(t.take_date).toLocaleDateString() : '-',
          t.store_name,
          t.staff_name,
          t.notes || '-',
          '', '', '', ''
        ]);
      }
    }
    doc.text('Stock Take History', 14, 16);
    // @ts-ignore
    autoTable(doc, { head: [headers], body, startY: 22 });
    doc.save('stock_take_history.pdf');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Stock Take History</h1>
        <div className="mb-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
            <select name="store_id" value={filters.store_id} onChange={handleFilterChange} className="border rounded px-3 py-2">
              <option value="">All</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>{s.store_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} className="border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} className="border rounded px-3 py-2" />
          </div>
        </div>
        <div className="mb-4 flex gap-2">
          <button onClick={exportToCSV} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Export to CSV</button>
          <button onClick={exportToPDF} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Export to PDF</button>
        </div>
        <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No stock take history found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {history.map((t: any) => (
                  <React.Fragment key={t.id}>
                    <tr className={expandedId === t.id ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                        <button className="text-blue-600 underline" onClick={() => handleExpand(t.id)}>
                          {expandedId === t.id ? '▼' : '▶'}
                        </button>{' '}
                        {t.take_date ? new Date(t.take_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{t.store_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{t.staff_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{t.notes || '-'}</td>
                    </tr>
                    {expandedId === t.id && (
                      <tr>
                        <td colSpan={4} className="bg-gray-50 px-4 py-2">
                          {itemsLoading[t.id] ? (
                            <div>Loading...</div>
                          ) : items[t.id] && items[t.id].length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs border">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="px-2 py-1 text-left">Product</th>
                                    <th className="px-2 py-1 text-right">System Qty</th>
                                    <th className="px-2 py-1 text-right">Counted Qty</th>
                                    <th className="px-2 py-1 text-right">Difference</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items[t.id].map((item: any) => (
                                    <tr key={item.id}>
                                      <td className="px-2 py-1">{item.product_name || item.product_id}</td>
                                      <td className="px-2 py-1 text-right">{item.system_quantity}</td>
                                      <td className="px-2 py-1 text-right">{item.counted_quantity}</td>
                                      <td className={`px-2 py-1 text-right ${item.difference === 0 ? '' : item.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>{item.difference}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-gray-500">No items found for this stock take.</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <button
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockTakeHistoryPage; 