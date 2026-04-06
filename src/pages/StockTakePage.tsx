import React, { useEffect, useState } from 'react';
import { storeService } from '../services/storeService';
import { productsService, categoriesService } from '../services/financialService';
import axios from 'axios';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const StockTakePage: React.FC = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inventory, setInventory] = useState<any[]>([]);
  const [counts, setCounts] = useState<{ [productId: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchInventory(selectedStore);
      // Reset category filter when store changes
      setSelectedCategory('all');
    } else {
      setInventory([]);
      setSelectedCategory('all');
    }
  }, [selectedStore]);

  const fetchStores = async () => {
    const res = await storeService.getAllStores();
    if (res.success) setStores(res.data || []);
  };
  const fetchProducts = async () => {
    const res = await productsService.getAll();
    if (res.success) setProducts(res.data || []);
  };
  const fetchCategories = async () => {
    try {
      const res = await categoriesService.getAll();
      if (res.success) setCategories(res.data || []);
    } catch {
      setCategories([]);
    }
  };

  const getFilteredInventory = () => {
    if (selectedCategory === 'all') {
      return inventory;
    }
    return inventory.filter(item => {
      // Check if item has category directly (from StoreInventory)
      if (item.category === selectedCategory) {
        return true;
      }
      // Otherwise, check product category
      const product = products.find(p => p.id === item.product_id);
      return product && product.category === selectedCategory;
    });
  };

  const fetchInventory = async (storeId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await storeService.getStoreInventory(storeId);
      if (res.success && res.data) {
        setInventory(res.data);
        // Initialize counts with system quantity
        const initialCounts: { [productId: number]: string } = {};
        res.data.forEach((item: any) => {
          initialCounts[item.product_id] = String(item.quantity);
        });
        setCounts(initialCounts);
      } else {
        setInventory([]);
        setCounts({});
      }
    } catch {
      setInventory([]);
      setCounts({});
      setError('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleCountChange = (productId: number, value: string) => {
    setCounts({ ...counts, [productId]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const items = inventory.map((item: any) => ({
        product_id: item.product_id,
        counted_quantity: Number(counts[item.product_id] || item.quantity)
      }));
      const res = await axios.post('/api/financial/stock-take', {
        store_id: selectedStore,
        items,
        staff_id: 1 // TODO: Replace with actual user ID
      });
      if (res.data.success) {
        setResult(res.data);
      } else {
        setError(res.data.error || 'Failed to post stock take');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post stock take');
    } finally {
      setSubmitting(false);
    }
  };

  const exportToPDF = () => {
    try {
      console.log('Starting PDF export...');
      const doc = new jsPDF();
      
      // Initialize autoTable plugin
      autoTable(doc, {
        head: [["Product", "System Qty", "Counted Qty", "Difference", "Count"]],
        body: getFilteredInventory().map((item: any) => [
          products.find((p: any) => p.id === item.product_id)?.product_name || item.product_id,
          item.quantity,
          counts[item.product_id] || item.quantity,
          (counts[item.product_id] || item.quantity) - item.quantity,
          '' // Empty Count column for manual annotations
        ]),
        startY: 60,
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        }
      });
      
      const store = stores.find(s => s.id === selectedStore);
      const storeName = store ? store.store_name : `Store ${selectedStore}`;
      const currentDate = new Date().toISOString().slice(0, 10);
      
      console.log('Store:', storeName, 'Date:', currentDate);
      
      // Add title and store info
      doc.setFontSize(20);
      doc.text('Stock Take Report', 14, 22);
      doc.setFontSize(12);
      doc.text(`Store: ${storeName}`, 14, 32);
      doc.text(`Date: ${currentDate}`, 14, 40);
      doc.text(`Category: ${selectedCategory === 'all' ? 'All Categories' : selectedCategory}`, 14, 48);
      
      console.log('Table data prepared and added to PDF');
      
      // Add summary
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      const totalItems = getFilteredInventory().length;
      const totalSystemQty = getFilteredInventory().reduce((sum, item) => sum + item.quantity, 0);
      const totalCountedQty = getFilteredInventory().reduce((sum, item) => sum + (Number(counts[item.product_id]) || item.quantity), 0);
      
      doc.setFontSize(12);
      doc.text(`Total Items: ${totalItems}`, 14, finalY);
      doc.text(`Total System Quantity: ${totalSystemQty}`, 14, finalY + 8);
      doc.text(`Total Counted Quantity: ${totalCountedQty}`, 14, finalY + 16);
      
      console.log('Saving PDF...');
      doc.save(`stock_take_${storeName.replace(/\s+/g, '_')}_${currentDate}.pdf`);
      console.log('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please try again. Check console for details.');
    }
  };

  const testPDF = () => {
    try {
      console.log('Testing simple PDF export...');
      const doc = new jsPDF();
      doc.text('Test PDF Export', 20, 20);
      doc.text('This is a test to verify PDF generation works', 20, 30);
      doc.save('test_export.pdf');
      console.log('Test PDF created successfully!');
    } catch (error) {
      console.error('Test PDF error:', error);
      alert('Test PDF failed. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            to="/stock-take-history"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            View Stock Take History
          </Link>
          {/* <button
            onClick={testPDF}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
          >
            Test PDF
          </button> */}
          {selectedStore && getFilteredInventory().length > 0 && (
            <button
              onClick={exportToPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Export to PDF
            </button>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Stock Take</h1>
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Store</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedStore}
                onChange={e => setSelectedStore(Number(e.target.value) || '')}
              >
                <option value="">Select a store</option>
                {stores.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.store_name}</option>
                ))}
              </select>
            </div>
            {selectedStore && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category: any) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        {selectedStore && (
          <form onSubmit={handleSubmit}>
            {/* Filter Indicators */}
            {(selectedCategory !== 'all') && (
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                  Category: {selectedCategory}
                </span>
              </div>
            )}
            <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : getFilteredInventory().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {selectedCategory !== 'all' 
                    ? `No inventory found for category "${selectedCategory}".` 
                    : 'No inventory found for this store.'}
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-semibold text-gray-900">{getFilteredInventory().length}</span> of{' '}
                      <span className="font-semibold text-gray-900">{inventory.length}</span> items
                      {selectedCategory !== 'all' && (
                        <span className="ml-2 text-blue-600">(filtered by: {selectedCategory})</span>
                      )}
                    </div>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counted Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">Count</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredInventory().map((item: any) => {
                        const counted = counts[item.product_id] !== undefined ? Number(counts[item.product_id]) : item.quantity;
                        const diff = counted - item.quantity;
                        const product = products.find((p: any) => p.id === item.product_id);
                        const itemCategory = item.category || product?.category || 'Uncategorized';
                        return (
                          <tr key={item.product_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{product ? product.product_name : item.product_id}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {itemCategory}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <input
                                type="number"
                                className="border border-gray-300 rounded-lg px-3 py-1 w-24 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={counts[item.product_id] ?? item.quantity}
                                onChange={e => handleCountChange(item.product_id, e.target.value)}
                              />
                            </td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${diff === 0 ? 'text-gray-700' : diff > 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {diff > 0 ? `+${diff}` : diff}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border border-gray-300"></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>
            <button
              type="submit"
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              disabled={submitting || loading}
            >
              {submitting ? 'Posting...' : 'Post Stock Take'}
            </button>
            {error && <div className="mt-2 text-red-600">{error}</div>}
            {result && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded p-4">
                <div className="font-bold text-green-700 mb-2">Stock take posted successfully!</div>
                {result.adjustments && result.adjustments.length > 0 ? (
                  <div>
                    <div className="mb-2 font-semibold">Adjustments:</div>
                    <ul className="list-disc ml-6">
                      {result.adjustments.map((adj: any) => {
                        const product = products.find((p: any) => p.id === adj.product_id);
                        return (
                          <li key={adj.product_id}>
                            {product ? product.product_name : adj.product_id}: System {adj.system_quantity}, Counted {adj.counted_quantity}, Difference {adj.diff}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <div>No adjustments were needed. All quantities matched.</div>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default StockTakePage; 