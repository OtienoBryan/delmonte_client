import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Package, 
  DollarSign, 
  FileText,
  ArrowLeft,
  Building2,
  Calendar
} from 'lucide-react';
import { 
  suppliersService, 
  assetPurchaseOrdersService,
  myAssetsService
} from '../services/financialService';
import { Supplier, TaxType } from '../types/financial';

interface MyAsset {
  id: number;
  asset_code: string;
  asset_name: string;
  asset_type: string;
  price: number;
  quantity: number;
}

interface AssetOrderItem {
  asset_id: number;
  asset_name: string;
  asset_type: string;
  quantity: number;
  price: number;
  tax_type: TaxType;
}

const AssetPurchaseOrderPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allAssets, setAllAssets] = useState<MyAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [selectedSupplier, setSelectedSupplier] = useState<number | ''>('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [assets, setAssets] = useState<AssetOrderItem[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchSuppliers(), fetchAssets()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersService.getAll();
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (err) {
      setError('Failed to fetch suppliers');
      console.error('Error fetching suppliers:', err);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await myAssetsService.getAll();
      if (response.success && response.data) {
        setAllAssets(response.data);
      }
    } catch (err) {
      setError('Failed to fetch assets');
      console.error('Error fetching assets:', err);
    }
  };

  const getTaxRate = (taxType: TaxType): number => {
    if (taxType === '16%') return 0.16;
    return 0; // zero_rated and exempted
  };

  const addAsset = () => {
    const newAsset: AssetOrderItem = {
      asset_id: 0,
      asset_name: '',
      asset_type: '',
      quantity: 1,
      price: 0,
      tax_type: '16%'
    };
    setAssets([...assets, newAsset]);
  };

  const removeAsset = (index: number) => {
    setAssets(assets.filter((_, i) => i !== index));
  };

  const updateAsset = (index: number, field: keyof AssetOrderItem, value: any) => {
    const updatedAssets = [...assets];
    
    // If asset_id changes, populate the asset details
    if (field === 'asset_id' && value) {
      const selectedAsset = allAssets.find(a => a.id === value);
      if (selectedAsset) {
        updatedAssets[index] = {
          ...updatedAssets[index],
          asset_id: value,
          asset_name: selectedAsset.asset_name,
          asset_type: selectedAsset.asset_type,
          price: selectedAsset.price
        };
      }
    } else {
      updatedAssets[index] = { ...updatedAssets[index], [field]: value };
    }
    
    setAssets(updatedAssets);
  };

  const calculateSubtotal = () => {
    // Sum of tax-exclusive line totals (quantity × unit_price)
    return assets.reduce((sum, asset) => {
      return sum + (asset.price * asset.quantity);
    }, 0);
  };

  const calculateTax = () => {
    // Sum of tax amounts per line
    return assets.reduce((sum, asset) => {
      const rate = getTaxRate(asset.tax_type);
      if (rate === 0) return sum;
      const lineNet = asset.quantity * asset.price;
      const lineTax = lineNet * rate;
      return sum + lineTax;
    }, 0);
  };

  const calculateTotal = () => {
    // Total = subtotal + tax
    return calculateSubtotal() + calculateTax();
  };

  const validateForm = () => {
    if (!selectedSupplier) {
      setError('Please select a supplier');
      return false;
    }

    if (!orderDate) {
      setError('Please select an order date');
      return false;
    }

    if (assets.length === 0) {
      setError('Please add at least one asset');
      return false;
    }

    for (let i = 0; i < assets.length; i++) {
      if (!assets[i].asset_id) {
        setError(`Please select an asset for item ${i + 1}`);
        return false;
      }

      if (assets[i].quantity <= 0) {
        setError(`Quantity must be greater than 0 for asset ${i + 1}`);
        return false;
      }

      if (assets[i].price <= 0) {
        setError(`Price must be greater than 0 for asset ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const purchaseOrderData = {
        supplier_id: selectedSupplier as number,
        order_date: orderDate,
        expected_delivery_date: expectedDeliveryDate || undefined,
        notes: notes || undefined,
        assets: assets.map(asset => ({
          asset_id: asset.asset_id,
          quantity: asset.quantity,
          unit_price: asset.price,
          tax_type: asset.tax_type
        }))
      };

      console.log('Sending asset purchase order data:', purchaseOrderData);
      const response = await assetPurchaseOrdersService.create(purchaseOrderData);
      console.log('Response received:', response);
      
      if (response.success) {
        alert(`Asset purchase order ${response.data.apo_number} created successfully!`);
        // Reset form
        setSelectedSupplier('');
        setOrderDate(new Date().toISOString().split('T')[0]);
        setExpectedDeliveryDate('');
        setNotes('');
        setAssets([]);
      } else {
        setError(response.error || 'Failed to create purchase order');
      }
    } catch (err) {
      setError('Failed to create purchase order');
      console.error('Error creating purchase order:', err);
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <Link
            to="/my-assets"
            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mb-3"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to Assets
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Asset Purchase Order</h1>
              <p className="mt-1 text-xs text-gray-600">Create a purchase order for company assets</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Supplier and Date Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
              <Package className="h-4 w-4 mr-2 text-blue-600" />
              Purchase Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supplier */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Building2 className="h-3 w-3 inline mr-1" />
                  Supplier *
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  Order Date *
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Expected Delivery Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <FileText className="h-3 w-3 inline mr-1" />
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any additional notes..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Assets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 flex items-center">
                <Package className="h-4 w-4 mr-2 text-blue-600" />
                Assets *
              </h2>
              <button
                type="button"
                onClick={addAsset}
                className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Asset
              </button>
            </div>

            {assets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                <p className="text-xs">No assets added yet. Click "Add Asset" to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asset
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price (unit)
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tax Type
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tax Amount
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assets.map((asset, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <select
                            value={asset.asset_id}
                            onChange={(e) => updateAsset(index, 'asset_id', parseInt(e.target.value))}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select Asset</option>
                            {allAssets.map(a => (
                              <option key={a.id} value={a.id}>
                                {a.asset_code} - {a.asset_name} ({a.asset_type})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            min="1"
                            value={asset.quantity}
                            onChange={(e) => updateAsset(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={asset.price}
                            onChange={(e) => updateAsset(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <select
                            value={asset.tax_type}
                            onChange={(e) => updateAsset(index, 'tax_type', e.target.value as TaxType)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="16%">16%</option>
                            <option value="zero_rated">Zero Rated</option>
                            <option value="exempted">Exempted</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-700">
                          {((asset.price * asset.quantity) * getTaxRate(asset.tax_type)).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'KES',
                            minimumFractionDigits: 2
                          })}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {((asset.price * asset.quantity) * (1 + getTaxRate(asset.tax_type))).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'KES',
                            minimumFractionDigits: 2
                          })}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                          <button
                            type="button"
                            onClick={() => removeAsset(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold text-gray-900">
                        Subtotal:
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-gray-900">
                        {calculateSubtotal().toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 2
                        })}
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right text-xs font-semibold text-gray-900">
                        Tax:
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-semibold text-gray-900">
                        {calculateTax().toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 2
                        })}
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right text-xs font-bold text-gray-900 border-t border-gray-300">
                        Total Amount:
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-gray-900 border-t border-gray-300">
                        {calculateTotal().toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'KES',
                          minimumFractionDigits: 2
                        })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <Link
              to="/my-assets"
              className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || assets.length === 0}
              className="flex items-center px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-2" />
                  Create Purchase Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetPurchaseOrderPage;
