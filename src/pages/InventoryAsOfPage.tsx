import React, { useEffect, useState } from 'react';
import { inventoryAsOfService, productsService } from '../services/financialService';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InventoryAsOfPage: React.FC = () => {
  const [stores, setStores] = useState<{ id: number; store_name: string; store_code: string }[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [asOfInventory, setAsOfInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchInventoryAsOf(selectedDate, selectedStore);
    } else {
      setAsOfInventory([]);
    }
    // eslint-disable-next-line
  }, [selectedDate, selectedStore]);

  const fetchStores = async () => {
    try {
      const response = await axios.get('/api/financial/stores');
      if (response.data.success && response.data.data) {
        setStores(response.data.data);
      }
    } catch {}
  };

  const fetchInventoryAsOf = async (date: string, store: number | 'all') => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { date };
      if (store !== 'all') params.store_id = store;
      const response = await inventoryAsOfService.getAll(params);
      if (response.success && response.data) {
        setAsOfInventory(response.data);
      } else {
        setAsOfInventory([]);
      }
    } catch {
      setError('Failed to fetch inventory as of date');
      setAsOfInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const getTotalInventoryValue = () => {
    return asOfInventory.reduce((total, item) => {
      return total + (Number(item.inventory_value) || 0);
    }, 0);
  };

  const number_format = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const exportToCSV = () => {
    if (!asOfInventory.length) return;
    const headers = [
      ...(selectedStore === 'all' ? ['Store'] : []),
      'Product', 'Category', 'Quantity', 'Unit', 'Cost Price', 'Selling Price', 'Inventory Value'
    ];
    const rows = asOfInventory.map(item => [
      ...(selectedStore === 'all' ? [item.store_name] : []),
      item.product_name,
      item.category || 'N/A',
      item.quantity,
      item.unit_of_measure,
      item.cost_price,
      item.selling_price,
      item.inventory_value
    ]);
    let csvContent = '';
    csvContent += headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(val => `"${val}"`).join(',') + '\n';
    });
    const totalValue = number_format(getTotalInventoryValue());
    // Add total value row
    csvContent += Array(headers.length - 2).fill('').join(',') + ',Total Value,"' + totalValue + '"\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory_as_of_${selectedDate || 'date'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!asOfInventory.length) return;
    const doc = new jsPDF();
    const headers = [
      ...(selectedStore === 'all' ? ['Store'] : []),
      'Product', 'Category', 'Quantity', 'Unit', 'Cost Price', 'Selling Price', 'Inventory Value'
    ];
    const rows = asOfInventory.map(item => [
      ...(selectedStore === 'all' ? [item.store_name] : []),
      item.product_name,
      item.category || 'N/A',
      item.quantity,
      item.unit_of_measure,
      item.cost_price,
      item.selling_price,
      item.inventory_value
    ]);
    doc.text(`Inventory as of ${selectedDate || 'date'}`, 14, 16);
    // @ts-ignore
    doc.autoTable({ head: [headers], body: rows, startY: 22 });
    const totalValue = number_format(getTotalInventoryValue());
    // Add total value row
    const finalY = (doc as any).lastAutoTable.finalY || 22;
    doc.text(`Total Value: ${totalValue}`, 14, finalY + 10);
    doc.save(`inventory_as_of_${selectedDate || 'date'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Inventory as of Date</h1>
        <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
          <div>
            <label htmlFor="store-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Store
            </label>
            <select
              id="store-filter"
              value={selectedStore}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedStore(value === 'all' ? 'all' : Number(value));
              }}
              className="block w-64 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.store_name} ({store.store_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Inventory as of Date
            </label>
            <input
              id="date-filter"
              type="date"
              className="block w-48 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4 flex gap-2">
            <button onClick={exportToCSV} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Export to CSV</button>
            <button onClick={exportToPDF} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Export to PDF</button>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center">
              <div className="mb-2">{error}</div>
              <button onClick={() => fetchInventoryAsOf(selectedDate, selectedStore)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Retry</button>
            </div>
          ) : asOfInventory.length === 0 ? (
            <div className="text-gray-500 text-center">No inventory found for the selected date.</div>
          ) : (
            <>
              <div className="mb-4 flex gap-8">
                <div>
                  <div className="text-xs text-gray-500">Total Products</div>
                  <div className="text-lg font-bold text-gray-900">{new Set(asOfInventory.map(item => item.product_id)).size}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Total Value</div>
                  <div className="text-lg font-bold text-gray-900">{number_format(getTotalInventoryValue())}</div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedStore === 'all' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Store
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Selling Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inventory Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {asOfInventory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {selectedStore === 'all' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.store_name}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.product_code}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.category || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.quantity <= 10 
                              ? 'bg-red-100 text-red-800' 
                              : item.quantity <= 50 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.unit_of_measure}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.cost_price ? number_format(item.cost_price) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.selling_price ? number_format(item.selling_price) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.inventory_value ? number_format(item.inventory_value) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryAsOfPage; 