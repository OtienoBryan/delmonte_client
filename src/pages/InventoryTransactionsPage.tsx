import React, { useEffect, useState } from 'react';
import { inventoryTransactionsService, productsService } from '../services/financialService';
import { storeService } from '../services/storeService';

interface InventoryTransaction {
  id: number;
  product_id: number;
  reference: string;
  amount_in: number;
  amount_out: number;
  balance: number;
  date_received: string;
  store_id: number;
  staff_id: number;
  product_name?: string;
  store_name?: string;
  staff_name?: string;
}

interface Product {
  id: number;
  product_code: string;
  product_name: string;
}

interface Store {
  id: number;
  store_name: string;
}

const InventoryTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(50);

  useEffect(() => {
    fetchProducts();
    fetchStores();
  }, []);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, [selectedProduct, selectedStore, page]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedProduct) params.product_id = selectedProduct;
      if (selectedStore) params.store_id = selectedStore;
      params.page = page;
      params.limit = pageSize;
      params.orderBy = 'id';
      params.orderDirection = 'DESC';
      const response = await inventoryTransactionsService.getAll(params);
      if (response.success && response.data) {
        setTransactions(response.data);
        if (response.pagination && response.pagination.totalPages) setTotalPages(response.pagination.totalPages);
        else setTotalPages(1);
      } else {
        setError(response.error || 'Failed to fetch inventory transactions');
        setTotalPages(1);
      }
    } catch (err) {
      setError('Failed to fetch inventory transactions');
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsService.getAll();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch {}
  };

  const fetchStores = async () => {
    try {
      const response = await storeService.getAllStores();
      if (response.success && response.data) {
        setStores(response.data);
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <h1 className="text-sm font-bold text-gray-900 mb-4">Inventory Transactions</h1>
        <div className="mb-3 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="product-select" className="text-[10px] font-medium text-gray-700">Product:</label>
            <select
              id="product-select"
              className="border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.product_code} - {p.product_name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="store-select" className="text-[10px] font-medium text-gray-700">Store:</label>
            <select
              id="store-select"
              className="border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={selectedStore}
              onChange={e => setSelectedStore(e.target.value)}
            >
              <option value="">All Stores</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.store_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center">
              <div className="mb-2 text-xs">{error}</div>
              <button onClick={fetchTransactions} className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-xs">Retry</button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-gray-500 text-center text-xs py-4">No inventory transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-3 py-2 text-right text-[9px] font-medium text-green-700 uppercase tracking-wider">Amount In</th>
                    <th className="px-3 py-2 text-right text-[9px] font-medium text-red-700 uppercase tracking-wider">Amount Out</th>
                    <th className="px-3 py-2 text-right text-[9px] font-medium text-indigo-700 uppercase tracking-wider bg-indigo-50">Balance</th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Store</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{tx.date_received ? new Date(tx.date_received).toLocaleString() : '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{tx.product_name || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{tx.reference || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-green-700 text-right font-medium">{tx.amount_in ? tx.amount_in.toLocaleString() : '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-red-700 text-right font-medium">{tx.amount_out ? tx.amount_out.toLocaleString() : '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-indigo-900 font-bold text-right bg-indigo-50">{tx.balance.toLocaleString()}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{tx.store_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-3">
            <button
              className="px-2.5 py-1 rounded border bg-white disabled:opacity-50 text-xs hover:bg-gray-50 transition-colors"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-[10px] text-gray-600">Page {page} of {totalPages}</span>
            <button
              className="px-2.5 py-1 rounded border bg-white disabled:opacity-50 text-xs hover:bg-gray-50 transition-colors"
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

export default InventoryTransactionsPage; 