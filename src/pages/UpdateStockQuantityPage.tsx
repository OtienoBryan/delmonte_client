import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeService } from '../services/storeService';
import { productsService } from '../services/financialService';
import { Store, StoreInventory, Product } from '../types/financial';

interface UpdateStockForm {
  store_id: number;
  product_id: number;
  new_quantity: number;
  reason: string;
}

interface ProductInventoryRow {
  product: Product;
  storeQuantities: { [storeId: number]: number };
  totalQuantity: number;
}

const UpdateStockQuantityPage: React.FC = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<StoreInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ productId: number; storeId: number } | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [currentQuantity, setCurrentQuantity] = useState<number>(0);
  const [editReason, setEditReason] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stores, products, and inventory in parallel
      const [storesResponse, productsResponse, inventoryResponse] = await Promise.all([
        storeService.getAllStores(),
        productsService.getAll(),
        storeService.getAllStoresInventory()
      ]);
      
      if (storesResponse.success) {
        setStores(storesResponse.data || []);
        console.log('Stores loaded:', storesResponse.data?.length || 0);
      } else {
        console.error('Failed to fetch stores:', storesResponse.error);
      }

      if (productsResponse.success) {
        setProducts(productsResponse.data || []);
        console.log('Products loaded:', productsResponse.data?.length || 0);
      } else {
        console.error('Failed to fetch products:', productsResponse.error);
      }

      if (inventoryResponse.success) {
        const inventoryData = inventoryResponse.data || [];
        setInventory(inventoryData);
        console.log('Inventory loaded:', inventoryData.length, 'items');
        if (inventoryData.length > 0) {
          console.log('Sample inventory item:', inventoryData[0]);
          // Log some quantities to verify data
          const sampleQuantities = inventoryData
            .filter((item: any) => item.quantity && Number(item.quantity) > 0)
            .slice(0, 5)
            .map((item: any) => ({
              store_id: item.store_id,
              product_id: item.product_id,
              quantity: item.quantity,
              product_name: item.product_name
            }));
          console.log('Sample quantities:', sampleQuantities);
        }
      } else {
        console.error('Failed to fetch inventory:', inventoryResponse.error);
        setError('Failed to fetch inventory data. Please refresh the page.');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getProductInventoryRows = (): ProductInventoryRow[] => {
    const rows: ProductInventoryRow[] = [];
    
    // Filter products by category if selected
    const filteredProducts = selectedCategory 
      ? products.filter(product => product.category === selectedCategory)
      : products;
    
    filteredProducts.forEach(product => {
      const storeQuantities: { [storeId: number]: number } = {};
      let totalQuantity = 0;
      
      stores.forEach(store => {
        // More robust matching - handle both string and number comparisons
        const inventoryItem = inventory.find(
          item => 
            (Number(item.store_id) === Number(store.id) || String(item.store_id) === String(store.id)) &&
            (Number(item.product_id) === Number(product.id) || String(item.product_id) === String(product.id))
        );
        
        // Get quantity, handling various data types and null/undefined
        let quantity = 0;
        if (inventoryItem) {
          const qty = inventoryItem.quantity;
          if (qty !== null && qty !== undefined && qty !== '') {
            quantity = Number(qty);
            if (isNaN(quantity)) {
              quantity = 0;
            }
          }
        }
        
        storeQuantities[store.id] = quantity;
        totalQuantity += quantity;
      });
      
      rows.push({
        product,
        storeQuantities,
        totalQuantity
      });
    });
    
    return rows.sort((a, b) => a.product.product_name.localeCompare(b.product.product_name));
  };

  const getUniqueCategories = (): string[] => {
    const categories = products
      .map(product => product.category)
      .filter((category): category is string => Boolean(category));
    return [...new Set(categories)].sort();
  };

  const handleQuantityClick = (productId: number, storeId: number, currentQuantity: number) => {
    // Get the actual current quantity from inventory state
    const inventoryItem = inventory.find(
      item => item.store_id === storeId && item.product_id === productId
    );
    const actualCurrentQuantity = inventoryItem?.quantity || currentQuantity || 0;
    
    setEditingCell({ productId, storeId });
    setCurrentQuantity(actualCurrentQuantity);
    setEditQuantity(actualCurrentQuantity);
    setEditReason('');
    setShowEditModal(true);
  };

  const handleUpdateQuantity = async () => {
    if (!editingCell) return;
    
    const { productId, storeId } = editingCell;
    const currentInventory = inventory.find(
      item => item.store_id === storeId && item.product_id === productId
    );
    const actualCurrentQuantity = Number(currentInventory?.quantity) || Number(currentQuantity) || 0;
    const newQuantity = Number(editQuantity);
    
    if (newQuantity === actualCurrentQuantity) {
      setError('New quantity must be different from current quantity');
      return;
    }
    
    if (isNaN(newQuantity) || newQuantity < 0) {
      setError('Please enter a valid quantity (0 or greater)');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const response = await storeService.updateStockQuantity({
        store_id: storeId,
        product_id: productId,
        new_quantity: newQuantity,
        reason: editReason || 'Manual Stock Update'
      });

      if (response.success) {
        setSuccess('Stock quantity updated successfully!');
        setShowEditModal(false);
        setEditingCell(null);
        // Refresh inventory data
        await fetchData();
      } else {
        setError(response.error || 'Failed to update stock quantity');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update stock quantity');
    } finally {
      setSubmitting(false);
    }
  };

  const getStoreName = (storeId: number) => {
    const store = stores.find(s => s.id === storeId);
    return store ? store.store_name : 'Unknown Store';
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product ? product.product_name : 'Unknown Product';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-xs text-gray-600">Loading stock data...</p>
        </div>
      </div>
    );
  }

  const productRows = getProductInventoryRows();
  const categories = getUniqueCategories();

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-bold text-gray-900">Update Stock Quantities</h1>
              <p className="mt-1 text-xs text-gray-600">
                Click on any quantity to update stock levels for products across all stores
              </p>
            </div>
            <button
              onClick={() => navigate('/store-inventory')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Inventory
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-md p-2.5">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2">
                <h3 className="text-xs font-medium text-red-800">Error</h3>
                <div className="mt-0.5 text-xs text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-3 bg-green-50 border border-green-200 rounded-md p-2.5">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2">
                <h3 className="text-xs font-medium text-green-800">Success</h3>
                <div className="mt-0.5 text-xs text-green-700">{success}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-3 bg-white shadow rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <label htmlFor="category-filter" className="block text-[10px] font-medium text-gray-700 mb-1.5">
                Filter by Category
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs px-2.5 py-1.5"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setSelectedCategory('')}
                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filter
              </button>
            </div>
          </div>
          {selectedCategory && (
            <div className="mt-2 text-xs text-gray-600">
              Showing {productRows.length} product{productRows.length !== 1 ? 's' : ''} in category: <span className="font-medium">{selectedCategory}</span>
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    Product
                  </th>
                  <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                    Total Stock
                  </th>
                  {stores.map((store) => (
                    <th key={store.id} className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      {store.store_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productRows.map((row) => (
                  <tr key={row.product.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 sticky left-0 bg-white z-10">
                      {row.product.product_name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {row.product.product_code}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {row.product.category || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 font-semibold">
                      {row.totalQuantity}
                    </td>
                    {stores.map((store) => {
                      const quantity = row.storeQuantities[store.id] ?? 0;
                      // Double-check quantity from inventory state
                      const inventoryItem = inventory.find(
                        item => 
                          (Number(item.store_id) === Number(store.id) || String(item.store_id) === String(store.id)) &&
                          (Number(item.product_id) === Number(row.product.id) || String(item.product_id) === String(row.product.id))
                      );
                      const actualQuantity = inventoryItem 
                        ? (Number(inventoryItem.quantity) || 0)
                        : quantity;
                      
                      return (
                        <td key={store.id} className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          <button
                            onClick={() => handleQuantityClick(row.product.id, store.id, actualQuantity)}
                            className="w-full text-left px-1.5 py-0.5 rounded border border-transparent hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-xs"
                            title={`Click to update quantity (Current: ${actualQuantity})`}
                          >
                            {actualQuantity.toLocaleString()}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {productRows.length === 0 && (
            <div className="text-center py-4 text-xs text-gray-500">
              {selectedCategory ? `No products found in category "${selectedCategory}"` : 'No products found'}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-2.5">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2">
              <h3 className="text-xs font-medium text-blue-800">Instructions</h3>
              <div className="mt-1 text-xs text-blue-700">
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Use the category filter to narrow down products by type</li>
                  <li>Click on any quantity in the table to update it</li>
                  <li>Enter the new quantity and optionally provide a reason</li>
                  <li>All changes are logged in the inventory transaction history</li>
                  <li>The table shows current stock levels across all stores</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingCell && (() => {
        // Get current quantity from inventory state - always fetch fresh data
        const inventoryItem = inventory.find(
          item => Number(item.store_id) === Number(editingCell.storeId) && Number(item.product_id) === Number(editingCell.productId)
        );
        const actualCurrentQuantity = Number(inventoryItem?.quantity) || Number(currentQuantity) || 0;
        
        return (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-3 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-1">
                <h3 className="text-xs font-medium text-gray-900 mb-3">
                  Update Stock Quantity
                </h3>
                <div className="mb-3">
                  <p className="text-xs text-gray-600">
                    <strong>Product:</strong> {getProductName(editingCell.productId)}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Store:</strong> {getStoreName(editingCell.storeId)}
                  </p>
                </div>
                
                <div className="mb-3 p-2 bg-blue-50 rounded-md border border-blue-200">
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Current Stock Available
                  </label>
                  <p className="text-lg font-bold text-blue-900">{actualCurrentQuantity.toLocaleString()}</p>
                </div>
              
              <div className="mb-3">
                <label htmlFor="edit_quantity" className="block text-xs font-medium text-gray-700 mb-1.5">
                  New Quantity *
                </label>
                <input
                  type="number"
                  id="edit_quantity"
                  min="0"
                  step="1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs px-2.5 py-1.5"
                  required
                />
                {editQuantity !== actualCurrentQuantity && (
                  <p className="mt-1 text-xs text-gray-500">
                    Change: <span className={editQuantity > actualCurrentQuantity ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {editQuantity > actualCurrentQuantity ? '+' : ''}{editQuantity - actualCurrentQuantity}
                    </span> 
                    {' '}({editQuantity > actualCurrentQuantity ? 'Increase' : 'Decrease'})
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="edit_reason" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Reason for Update
                </label>
                <textarea
                  id="edit_reason"
                  rows={2}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g., Stock adjustment, Damaged goods, etc."
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs px-2.5 py-1.5"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCell(null);
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateQuantity}
                  disabled={submitting}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update Quantity'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};

export default UpdateStockQuantityPage; 