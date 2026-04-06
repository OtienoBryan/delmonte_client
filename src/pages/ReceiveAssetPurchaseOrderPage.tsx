import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assetPurchaseOrdersService } from '../services/financialService';
import { storeService } from '../services/storeService';

const ReceiveAssetPurchaseOrderPage: React.FC = () => {
  const { assetPurchaseOrderId } = useParams<{ assetPurchaseOrderId: string }>();
  const navigate = useNavigate();
  
  const [purchaseOrder, setPurchaseOrder] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assetPurchaseOrderId) {
      fetchPurchaseOrder();
      fetchStores();
    }
  }, [assetPurchaseOrderId]);

  const fetchPurchaseOrder = async () => {
    try {
      const response = await assetPurchaseOrdersService.getById(parseInt(assetPurchaseOrderId!));
      if (response.success) {
        setPurchaseOrder(response.data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const location = customLocation.trim() || selectedLocation;
    
    if (!location) {
      setError('Please provide a location');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await assetPurchaseOrdersService.receiveAssets(
        parseInt(assetPurchaseOrderId!),
        { location, notes }
      );

      if (response.success) {
        alert(response.message || 'Assets received successfully!');
        navigate('/my-assets');
      } else {
        setError(response.error || 'Failed to receive assets');
      }
    } catch (err: any) {
      console.error('Error receiving assets:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response);
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        setError(err.response.data?.error || err.response.data?.message || 'Failed to receive assets');
      } else {
        setError('Failed to receive assets');
      }
    } finally {
      setSubmitting(false);
    }
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
            <h3 className="text-lg font-medium text-gray-900">Asset purchase order not found</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Receive Assets</h1>
              <p className="mt-1 text-xs text-gray-600">
                Asset Purchase Order #{purchaseOrder.apo_number}
              </p>
            </div>
            <button
              onClick={() => navigate('/my-assets')}
              className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Assets
            </button>
          </div>
        </div>

        {/* Purchase Order Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Purchase Order Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-gray-500 font-medium">APO Number</p>
              <p className="font-bold text-blue-600">{purchaseOrder.apo_number}</p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <p className="text-gray-500 font-medium">Supplier</p>
              <p className="font-bold text-green-600">{purchaseOrder.supplier_name || 'N/A'}</p>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded-lg">
              <p className="text-gray-500 font-medium">Order Date</p>
              <p className="font-bold text-purple-600">
                {new Date(purchaseOrder.order_date).toLocaleDateString()}
              </p>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded-lg">
              <p className="text-gray-500 font-medium">Status</p>
              <p className="font-bold text-orange-600 capitalize">{purchaseOrder.status}</p>
            </div>
          </div>
        </div>

        {/* Receive Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Receive Assets</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-xs text-red-700">{error}</div>
            </div>
          )}

          {/* Location Selection */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Location *
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                if (e.target.value) {
                  setCustomLocation('');
                }
              }}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
            >
              <option value="">Select from stores...</option>
              {stores.map((store) => (
                <option key={store.id} value={store.store_name}>
                  {store.store_name}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500 text-center mb-2">OR</div>
            <input
              type="text"
              value={customLocation}
              onChange={(e) => {
                setCustomLocation(e.target.value);
                if (e.target.value) {
                  setSelectedLocation('');
                }
              }}
              placeholder="Enter custom location (e.g., IT Department)"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes about this receipt..."
            />
          </div>

          {/* Assets List */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Assets to Receive</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Asset Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrder.items?.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-xs">{item.asset_name}</td>
                      <td className="px-3 py-2 text-xs">{item.asset_type}</td>
                      <td className="px-3 py-2 text-xs">{item.quantity}</td>
                      <td className="px-3 py-2 text-xs">
                        {item.unit_price.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 2
                        })}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {(item.unit_price * item.quantity).toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 2
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-right">Total Amount:</td>
                    <td className="px-3 py-2 text-xs font-bold">
                      {purchaseOrder.total_amount?.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'KES',
                        minimumFractionDigits: 2
                      })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/my-assets')}
              className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Receiving...
                </>
              ) : (
                'Receive Assets'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiveAssetPurchaseOrderPage;

