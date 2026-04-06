import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { purchaseOrdersService, productsService } from '../services/financialService';
import { storeService } from '../services/storeService';
import { PurchaseOrder, Store, ReceiveItemsForm } from '../types/financial';

const ReceiveItemsPage: React.FC = () => {
  const { purchaseOrderId } = useParams<{ purchaseOrderId: string }>();
  const navigate = useNavigate();
  
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | ''>('');
  const [receivingItems, setReceivingItems] = useState<{
    product_id: number;
    received_quantity: number;
    unit_cost: number;
    product_name?: string;
    product_code?: string;
    max_quantity: number;
  }[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (purchaseOrderId) {
      fetchPurchaseOrder();
      fetchStores();
    }
  }, [purchaseOrderId]);

  const fetchPurchaseOrder = async () => {
    try {
      const response = await purchaseOrdersService.getWithReceipts(parseInt(purchaseOrderId!));
      if (response.success) {
        setPurchaseOrder(response.data);
        // Initialize receiving items with remaining quantities
        const items = response.data.items?.map((item: any) => ({
          product_id: item.product_id,
          received_quantity: 0,
          unit_cost: item.unit_price,
          product_name: item.product_name,
          product_code: item.product_code,
          max_quantity: item.quantity - (item.received_quantity || 0)
        })) || [];
        setReceivingItems(items);
      } else {
        setError(response.error || 'Failed to fetch purchase order');
      }
    } catch (err) {
      setError('Failed to fetch purchase order');
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await storeService.getAllStores();
      if (response.success) {
        setStores(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    }
  };

  const handleQuantityChange = (index: number, value: number) => {
    const updatedItems = [...receivingItems];
    const item = updatedItems[index];
    const maxQuantity = item.max_quantity;
    
    // Ensure quantity doesn't exceed max and is not negative
    const validQuantity = Math.max(0, Math.min(value, maxQuantity));
    
    updatedItems[index] = {
      ...item,
      received_quantity: validQuantity
    };
    
    setReceivingItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStore) {
      setError('Please select a store');
      return;
    }

    const itemsToReceive = receivingItems.filter(item => item.received_quantity > 0);
    
    if (itemsToReceive.length === 0) {
      setError('Please enter quantities for at least one item');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const receiveData: ReceiveItemsForm = {
        storeId: selectedStore as number,
        items: itemsToReceive,
        notes
      };

      const response = await purchaseOrdersService.receiveItems(
        parseInt(purchaseOrderId!),
        receiveData
      );

      if (response.success) {
         // Update product cost prices for received items
         try {
           const updatePromises = itemsToReceive.map(item => 
             productsService.update(item.product_id, { cost_price: item.unit_cost })
           );
           
           await Promise.all(updatePromises);
           console.log('Product cost prices updated successfully');
         } catch (updateError) {
           console.error('Failed to update product cost prices:', updateError);
           // Don't fail the entire operation, just log the error
         }
         
        alert('Items received successfully!');
        navigate('/purchase-orders');
      } else {
        setError(response.error || 'Failed to receive items');
      }
    } catch (err) {
      setError('Failed to receive items');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getTotalReceiving = () => {
    return receivingItems.reduce((total, item) => {
      return total + (item.received_quantity * item.unit_cost);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Purchase Order not found</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Receive Items</h1>
                 <p className="mt-2 text-base text-gray-600">
                   Purchase Order #{purchaseOrder.po_number}
              </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/purchase-orders')}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Purchase Orders
            </button>
          </div>
        </div>

        {/* Purchase Order Summary */}
        <div className="bg-white shadow-xl rounded-2xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
                         <h2 className="text-xl font-bold text-gray-900">Purchase Order Details</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                             <p className="text-xs text-gray-500 font-medium mb-1">PO Number</p>
               <p className="text-base font-bold text-blue-600">{purchaseOrder.po_number}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                             <p className="text-xs text-gray-500 font-medium mb-1">Supplier</p>
               <p className="text-base font-bold text-green-600">
                 {(purchaseOrder as any).supplier_name || 'N/A'}
               </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                             <p className="text-xs text-gray-500 font-medium mb-1">Order Date</p>
               <p className="text-base font-bold text-purple-600">
                {new Date(purchaseOrder.order_date).toLocaleDateString()}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                             <p className="text-xs text-gray-500 font-medium mb-1">Status</p>
               <p className="text-base font-bold text-orange-600 capitalize">{purchaseOrder.status}</p>
            </div>
          </div>
        </div>

        {/* Receive Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <div className="flex items-center mb-8">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
                         <h2 className="text-xl font-bold text-gray-900">Receive Items</h2>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm font-medium text-red-700">{error}</div>
              </div>
            </div>
          )}

          {/* Store Selection */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
                             <label htmlFor="store" className="text-base font-semibold text-gray-900">
              Select Store *
            </label>
            </div>
            <select
              id="store"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value ? parseInt(e.target.value) : '')}
              className="block w-full border-2 border-blue-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-4 transition-all duration-200"
              required
            >
              <option value="">Select a store...</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.store_name} ({store.store_code})
                </option>
              ))}
            </select>
          </div>

          {/* Items to Receive */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Items to Receive</h3>
            </div>
            
            <div className="grid gap-6">
                  {receivingItems.map((item, index) => (
                <div key={item.product_id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:shadow-md transition-all duration-200">
                  <div className="grid grid-cols-1 lg:grid-cols-8 gap-6 items-center">
                    {/* Product Code */}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 font-medium mb-1">Product Code</div>
                      <div className="text-base font-semibold text-gray-900">
                            {item.product_code}
                          </div>
                        </div>

                    {/* Product Name */}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 font-medium mb-1">Product Name</div>
                      <div className="text-base font-semibold text-gray-900">
                        {item.product_name}
                      </div>
                    </div>

                    {/* Ordered Quantity */}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 font-medium mb-1">Ordered</div>
                                             <div className="text-base font-semibold text-blue-600">
                        {purchaseOrder.items?.find(i => i.product_id === item.product_id)?.quantity || 0}
                       </div>
                    </div>

                    {/* Already Received */}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 font-medium mb-1">Received</div>
                                             <div className="text-base font-semibold text-green-600">
                        {purchaseOrder.items?.find(i => i.product_id === item.product_id)?.received_quantity || 0}
                       </div>
                    </div>

                    {/* Remaining Quantity */}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 font-medium mb-1">Remaining</div>
                                             <div className="text-xl font-bold text-orange-600">{item.max_quantity}</div>
                    </div>

                    {/* Receive Quantity Input */}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 font-medium mb-2">Receive Qty</div>
                        <input
                          type="number"
                          min="0"
                          max={item.max_quantity}
                         value={item.received_quantity === 0 ? '' : item.received_quantity}
                         onChange={(e) => handleQuantityChange(index, e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                         className="block w-24 mx-auto text-center border-2 border-blue-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-semibold transition-all duration-200"
                          disabled={item.max_quantity === 0}
                         placeholder="0"
                       />
                    </div>

                    {/* Unit Cost */}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 font-medium mb-1">Unit Cost</div>
                                             <div className="text-base font-semibold text-gray-900">{formatCurrency(item.unit_cost)}</div>
                    </div>

                    {/* Total */}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 font-medium mb-1">Total</div>
                                             <div className="text-lg font-bold text-green-600">
                        {formatCurrency(item.received_quantity * item.unit_cost)}
                       </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {item.max_quantity > 0 && (
                    <div className="mt-6">
                      <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span>Receiving Progress</span>
                        <span>{Math.round((item.received_quantity / item.max_quantity) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((item.received_quantity / item.max_quantity) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
                             <label htmlFor="notes" className="text-base font-semibold text-gray-900">
              Notes (Optional)
            </label>
            </div>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full border-2 border-blue-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-4 transition-all duration-200"
              placeholder="Add any notes about this receipt..."
            />
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8 border border-green-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M9 11h.01M9 8h.01M12 8h.01M15 5h.01M9 5h.01M9 2h.01M12 2h.01M15 2h.01" />
                  </svg>
                </div>
                                 <span className="text-base font-semibold text-gray-900">Total Receiving:</span>
               </div>
               <span className="text-2xl font-bold text-green-600">
                {formatCurrency(getTotalReceiving())}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/purchase-orders')}
              className="px-6 py-3 border-2 border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || getTotalReceiving() === 0}
              className="px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {submitting ? 'Receiving...' : 'Receive Items'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiveItemsPage; 