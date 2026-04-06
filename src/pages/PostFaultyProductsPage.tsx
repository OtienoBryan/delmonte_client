import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Save, X, Trash2, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { productsService, storesService, faultyProductsService } from '../services/financialService';

interface Product {
  id: number;
  product_name: string;
  product_code: string;
  description?: string;
}

interface Store {
  id: number;
  store_name: string;
  location?: string;
}

interface FaultyProductItem {
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  fault_comment: string;
}

const PostFaultyProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<number>(0);
  const [faultyItems, setFaultyItems] = useState<FaultyProductItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, storesRes] = await Promise.all([
          productsService.getAll(),
          storesService.getAll()
        ]);
        
        if (productsRes.success && productsRes.data) {
          setProducts(productsRes.data);
        }
        
        if (storesRes.success && storesRes.data) {
          setStores(storesRes.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch required data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.product_name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.product_code.toLowerCase().includes(productSearch.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [productSearch, products]);

  const addFaultyItem = () => {
    setShowProductDropdown(true);
    setProductSearch('');
  };

  const selectProduct = (product: Product) => {
    const exists = faultyItems.some(item => item.product_id === product.id);
    if (exists) {
      alert('This product is already in the list');
      return;
    }
    
    const newItem: FaultyProductItem = {
      product_id: product.id,
      product_name: product.product_name,
      product_code: product.product_code,
      quantity: 1,
      fault_comment: ''
    };
    setFaultyItems(prev => [...prev, newItem]);
    setShowProductDropdown(false);
    setProductSearch('');
  };

  const removeItem = (index: number) => {
    setFaultyItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof FaultyProductItem, value: string | number) => {
    console.log(`Updating item ${index}, field: ${field}, value:`, value);
    setFaultyItems(prev => {
      const updated = prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      );
      console.log('Updated faultyItems:', updated);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStore === 0) {
      alert('Please select a store');
      return;
    }

    if (faultyItems.length === 0) {
      alert('Please add at least one faulty product');
      return;
    }

    for (const item of faultyItems) {
      if (!item.fault_comment.trim()) {
        alert('Please provide a fault comment for all products');
        return;
      }
    }

    try {
      // Check inventory levels before submitting
      const insufficientItems = [];
      
      console.log('🔍 Starting inventory check for store:', selectedStore);
      
      for (const item of faultyItems) {
        try {
          console.log(`📦 Checking inventory for product: ${item.product_name} (ID: ${item.product_id})`);
          
          // Get current inventory for this product in the selected store
          const inventoryResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/financial/stores/${selectedStore}/inventory`);
          
          if (!inventoryResponse.ok) {
            console.error('Inventory API response not ok:', inventoryResponse.status, inventoryResponse.statusText);
            throw new Error(`HTTP ${inventoryResponse.status}: ${inventoryResponse.statusText}`);
          }
          
          const inventoryData = await inventoryResponse.json();
          console.log('Inventory API response:', inventoryData);
          
          if (inventoryData.success && inventoryData.data) {
            const productInventory = inventoryData.data.find((inv: any) => inv.product_id === item.product_id);
            console.log('Found product inventory:', productInventory);
            
            const availableQuantity = productInventory ? productInventory.quantity : 0;
            console.log(`Available quantity for ${item.product_name}: ${availableQuantity}`);
            
            if (availableQuantity < item.quantity) {
              insufficientItems.push({
                product_name: item.product_name,
                product_code: item.product_code,
                requested: item.quantity,
                available: availableQuantity
              });
              console.log(`❌ Insufficient inventory for ${item.product_name}`);
            } else {
              console.log(`✅ Sufficient inventory for ${item.product_name}`);
            }
          } else {
            console.error('Inventory API returned error:', inventoryData);
            throw new Error('Inventory API returned error');
          }
        } catch (inventoryError) {
          console.error('Error checking inventory for', item.product_name, ':', inventoryError);
          // If we can't check inventory, allow the submission but warn the user
          insufficientItems.push({
            product_name: item.product_name,
            product_code: item.product_code,
            requested: item.quantity,
            available: 'Unknown'
          });
        }
      }

      if (insufficientItems.length > 0) {
        const insufficientMessage = insufficientItems.map(item => 
          `${item.product_name} (${item.product_code}): Requested ${item.requested}, Available ${item.available}`
        ).join('\n');
        
        alert(`Cannot proceed - insufficient inventory for the following products:\n\n${insufficientMessage}`);
        return;
      }

      const reportData = {
        store_id: selectedStore,
        items: faultyItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          fault_comment: item.fault_comment
        }))
      };

      const response = await faultyProductsService.createReport(reportData);
      if (response.success) {
        alert('Faulty products report created successfully');
        setFaultyItems([]);
        setSelectedStore(0);
      } else {
        // Handle insufficient inventory error from backend
        if (response.error === 'Insufficient inventory for some products' && (response as any).insufficient_items) {
          const insufficientMessage = (response as any).insufficient_items.map((item: any) => {
            const product = faultyItems.find(fi => fi.product_id === item.product_id);
            return `${product?.product_name || 'Unknown Product'} (${product?.product_code || 'Unknown Code'}): Requested ${item.requested}, Available ${item.available}`;
          }).join('\n');
          
          alert(`Cannot create report due to insufficient inventory:\n\n${insufficientMessage}`);
        } else {
          alert(response.error || 'Failed to create faulty products report');
        }
      }
    } catch (err) {
      console.error('Error creating faulty products report:', err);
      alert('Failed to create faulty products report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedStoreName = stores.find(store => store.id === selectedStore)?.store_name || 'Select a store';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/inventory-staff-dashboard"
              className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Faulty Products Report</h1>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="hidden sm:inline">Total items:</span>
            <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-medium">
              {faultyItems.length}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Selection */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h2>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Store *</label>
              <button
                type="button"
                onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span className={selectedStore === 0 ? 'text-gray-400' : ''}>
                  {selectedStoreName}
                </span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showStoreDropdown ? 'transform rotate-180' : ''}`} />
              </button>
              
              {showStoreDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    {stores.map((store) => (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => {
                          setSelectedStore(store.id);
                          setShowStoreDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between ${selectedStore === store.id ? 'bg-blue-50' : ''}`}
                      >
                        <div>
                          <div className="font-medium">{store.store_name}</div>
                          {store.location && (
                            <div className="text-sm text-gray-500">{store.location}</div>
                          )}
                        </div>
                        {selectedStore === store.id && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Search and Add */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Faulty Products</h2>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Products *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by product name or code..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={addFaultyItem}
                  className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </button>
              </div>
              
              {showProductDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {filteredProducts.length === 0 ? (
                    <div className="px-4 py-3 text-gray-500 text-sm">No products found</div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => selectProduct(product)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{product.product_name}</div>
                            <div className="text-sm text-gray-500">{product.product_code}</div>
                          </div>
                          {faultyItems.some(item => item.product_id === product.id) && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Faulty Products Table */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Faulty Products List</h2>
              <span className="text-sm text-gray-500">
                {faultyItems.length} {faultyItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {faultyItems.length === 0 ? (
              <div className="text-center py-8 rounded-lg bg-gray-50">
                <AlertTriangle className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-3 text-sm font-medium text-gray-900">No products added</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Search and add products to create your report
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                        Fault Description *
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {faultyItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{item.product_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-20 px-3 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                            required
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <textarea
                              value={item.fault_comment}
                              onChange={(e) => {
                                console.log('Textarea onChange triggered:', e.target.value);
                                updateItem(index, 'fault_comment', e.target.value);
                              }}
                              onInput={(e) => {
                                console.log('Textarea onInput triggered:', e.currentTarget.value);
                              }}
                              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white"
                              rows={3}
                              placeholder="Describe the fault or issue with this product..."
                              required
                              style={{ minHeight: '80px', zIndex: 10 }}
                            />
                            <div className="text-xs text-gray-500">
                              Current value: "{item.fault_comment || 'empty'}"
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-6 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
            <button
              type="submit"
              disabled={faultyItems.length === 0 || selectedStore === 0}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-5 w-5 mr-2" />
              Submit Report
            </button>
          </div>
        </form>
      </div>

      {/* Click outside to close dropdowns */}
      {(showProductDropdown || showStoreDropdown) && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => {
            setShowProductDropdown(false);
            setShowStoreDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default PostFaultyProductsPage;