import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storeService } from '../services/storeService';
import { categoriesService } from '../services/financialService';
import { Store, Product } from '../types/financial';

interface OpeningQuantityItem {
  store_id: number;
  product_id: number;
  opening_quantity: number;
  product_name?: string;
  product_code?: string;
  store_name?: string;
  category?: string;
  unit_of_measure?: string;
  cost_price?: number;
}

const OpeningQuantitiesPage: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [openingQuantities, setOpeningQuantities] = useState<OpeningQuantityItem[]>([]);
  const [existingOpeningBalances, setExistingOpeningBalances] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (stores.length > 0 && products.length > 0) {
      initializeOpeningQuantities();
    }
  }, [stores, products, selectedStore, selectedCategory, existingOpeningBalances]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all stores
      const storesResponse = await storeService.getAllStores();
      if (storesResponse.success) {
        setStores(storesResponse.data || []);
      }

      // Fetch all products
      const productsResponse = await categoriesService.getAllProducts();
      if (productsResponse.success) {
        setProducts(productsResponse.data || []);
      }

      // Fetch all categories
      const categoriesResponse = await categoriesService.getAll();
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data || []);
      }

      // Fetch existing opening balances
      const existingBalancesResponse = await storeService.getExistingOpeningBalances();
      if (existingBalancesResponse.success) {
        const existingSet = new Set<string>();
        existingBalancesResponse.data?.forEach((item: any) => {
          existingSet.add(`${item.store_id}-${item.product_id}`);
        });
        setExistingOpeningBalances(existingSet);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const initializeOpeningQuantities = () => {
    let filteredStores = stores;
    let filteredProducts = products;

    // Filter by store
    if (selectedStore !== 'all') {
      filteredStores = stores.filter(store => store.id === selectedStore);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filteredProducts = products.filter(product => product.category === selectedCategory);
    }

    const quantities: OpeningQuantityItem[] = [];
    
    filteredStores.forEach(store => {
      filteredProducts.forEach(product => {
        // Skip products that already have opening balances
        const key = `${store.id}-${product.id}`;
        if (!existingOpeningBalances.has(key)) {
          quantities.push({
            store_id: store.id,
            product_id: product.id,
            opening_quantity: 0,
            product_name: product.product_name,
            product_code: product.product_code,
            store_name: store.store_name,
            category: product.category,
            unit_of_measure: product.unit_of_measure,
            cost_price: product.cost_price
          });
        }
      });
    });

    setOpeningQuantities(quantities);
  };

  const handleQuantityChange = (storeId: number, productId: number, quantity: number) => {
    setOpeningQuantities(prev => 
      prev.map(item => 
        item.store_id === storeId && item.product_id === productId
          ? { ...item, opening_quantity: quantity }
          : item
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Filter out items with zero quantities
      const itemsToSave = openingQuantities.filter(item => item.opening_quantity > 0);

      if (itemsToSave.length === 0) {
        setError('Please enter at least one opening quantity');
        return;
      }

      const response = await storeService.saveOpeningQuantities(itemsToSave);
      
      if (response.success) {
        setSuccess('Opening quantities saved successfully');
        // Reset quantities after successful save
        setOpeningQuantities(prev => 
          prev.map(item => ({ ...item, opening_quantity: 0 }))
        );
      } else {
        // Handle duplicate opening balance error
        if (response.error === 'Opening balance already exists for some products' && response.duplicateItems) {
          const duplicateList = response.duplicateItems.map((item: any) => 
            `${item.product_name} (${item.product_code}) in ${item.store_name} (${item.store_code})`
          ).join(', ');
          setError(`Opening balance already exists for: ${duplicateList}`);
        } else {
          setError(response.message || response.error || 'Failed to save opening quantities');
        }
      }
    } catch (err) {
      setError('Failed to save opening quantities');
    } finally {
      setSaving(false);
    }
  };

  const getFilteredQuantities = () => {
    let filtered = openingQuantities;
    
    // Filter by store
    if (selectedStore !== 'all') {
      filtered = filtered.filter(item => item.store_id === selectedStore);
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    return filtered;
  };

  const getTotalItems = () => {
    return getFilteredQuantities().reduce((total, item) => total + item.opening_quantity, 0);
  };

  const getTotalValue = () => {
    return getFilteredQuantities().reduce((total, item) => {
      return total + (item.opening_quantity * (item.cost_price || 0));
    }, 0);
  };

  const number_format = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredQuantities = getFilteredQuantities();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Opening Quantities</h1>
              <p className="mt-2 text-sm text-gray-600">
                Enter opening stock quantities for each store
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/store-inventory"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Inventory
              </Link>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">{success}</div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                    <dd className="text-lg font-medium text-gray-900">{getTotalItems()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {number_format(getTotalValue())}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

                     <div className="bg-white overflow-hidden shadow rounded-lg">
             <div className="p-5">
               <div className="flex items-center">
                 <div className="flex-shrink-0">
                   <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </div>
                 <div className="ml-5 w-0 flex-1">
                   <dl>
                     <dt className="text-sm font-medium text-gray-500 truncate">Entries</dt>
                     <dd className="text-lg font-medium text-gray-900">
                       {filteredQuantities.filter(item => item.opening_quantity > 0).length}
                     </dd>
                   </dl>
                 </div>
               </div>
             </div>
           </div>

           <div className="bg-white overflow-hidden shadow rounded-lg">
             <div className="p-5">
               <div className="flex items-center">
                 <div className="flex-shrink-0">
                   <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                 </div>
                 <div className="ml-5 w-0 flex-1">
                   <dl>
                     <dt className="text-sm font-medium text-gray-500 truncate">Existing Balances</dt>
                     <dd className="text-lg font-medium text-gray-900">
                       {existingOpeningBalances.size}
                     </dd>
                   </dl>
                 </div>
               </div>
             </div>
           </div>
        </div>

                 {/* Info about existing opening balances */}
         {existingOpeningBalances.size > 0 && (
           <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
             <div className="flex">
               <div className="flex-shrink-0">
                 <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                 </svg>
               </div>
               <div className="ml-3">
                 <h3 className="text-sm font-medium text-blue-800">Existing Opening Balances</h3>
                 <div className="mt-2 text-sm text-blue-700">
                   {existingOpeningBalances.size} product(s) already have opening balances set. These products are not shown in the table below to prevent duplicates.
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Filters */}
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
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedCategory(value);
              }}
              className="block w-64 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Opening Quantities'
            )}
          </button>
        </div>

        {/* Opening Quantities Table */}
        {filteredQuantities.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No products found for the selected filters.
            </p>
          </div>
        ) : (
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
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opening Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuantities.map((item) => (
                  <tr key={`${item.store_id}-${item.product_id}`} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.unit_of_measure}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.cost_price ? number_format(item.cost_price) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.opening_quantity}
                        onChange={(e) => handleQuantityChange(item.store_id, item.product_id, Number(e.target.value) || 0)}
                        className="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {number_format(item.opening_quantity * (item.cost_price || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpeningQuantitiesPage; 