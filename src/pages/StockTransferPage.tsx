import React, { useEffect, useState } from 'react';
import { stockTransferService, productsService } from '../services/financialService';
import { storeService } from '../services/storeService';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Package, Store, Calendar, FileText, Plus, Trash2, AlertCircle, CheckCircle, X } from 'lucide-react';

interface StockTransferPageProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

const StockTransferPage: React.FC<StockTransferPageProps> = ({ onSuccess, isModal }) => {
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [fromStoreInventory, setFromStoreInventory] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [form, setForm] = useState({
    from_store_id: '',
    to_store_id: '',
    transfer_date: new Date().toISOString().split('T')[0],
    staff_id: user?.id || 0,
    reference: '',
    notes: '',
    items: [
      { product_id: '', quantity: '' }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
    fetchProducts();
  }, []);

  // Update staff_id when user changes
  useEffect(() => {
    if (user?.id) {
      setForm(prev => ({ ...prev, staff_id: user.id }));
    }
  }, [user]);

  useEffect(() => {
    if (form.from_store_id) {
      fetchFromStoreInventory(Number(form.from_store_id));
    } else {
      setFromStoreInventory([]);
    }
  }, [form.from_store_id]);

  const fetchStores = async () => {
    try {
      const res = await storeService.getAllStores();
      if (res.success) setStores(res.data || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productsService.getAll();
      if (res.success) setProducts(res.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchFromStoreInventory = async (storeId: number) => {
    setLoadingInventory(true);
    try {
      const res = await storeService.getStoreInventory(storeId);
      if (res.success) {
        setFromStoreInventory(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setFromStoreInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  const getAvailableQuantity = (productId: string | number): number => {
    if (!productId || !form.from_store_id) return 0;
    const inventoryItem = fromStoreInventory.find(
      item => Number(item.product_id) === Number(productId)
    );
    return inventoryItem ? Number(inventoryItem.quantity) || 0 : 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'from_store_id') {
      // Reset items when changing from store
      setForm(prev => ({
        ...prev,
        from_store_id: value,
        items: [{ product_id: '', quantity: '' }]
      }));
    }
  };

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [e.target.name]: e.target.value };
    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { product_id: '', quantity: '' }] });
  };

  const removeItem = (index: number) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      // Ensure staff_id is set from logged-in user before processing
      const currentStaffId = user?.id || form.staff_id;
      
      if (!currentStaffId) {
        setError('Unable to determine staff ID. Please ensure you are logged in.');
        setLoading(false);
        return;
      }

      const data = {
        from_store_id: Number(form.from_store_id),
        to_store_id: Number(form.to_store_id),
        transfer_date: form.transfer_date,
        staff_id: Number(currentStaffId),
        reference: form.reference || undefined,
        notes: form.notes || undefined,
        items: form.items
          .filter(item => item.product_id && item.quantity)
          .map(item => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity)
          }))
      };

      if (data.items.length === 0) {
        setError('Please add at least one product to transfer');
        setLoading(false);
        return;
      }

      const res: any = await stockTransferService.transfer(data);
      if (res.success) {
        setSuccess('Stock transfer recorded successfully!');
        setForm({
          from_store_id: '',
          to_store_id: '',
          transfer_date: new Date().toISOString().split('T')[0],
          staff_id: user?.id || 0,
          reference: '',
          notes: '',
          items: [{ product_id: '', quantity: '' }]
        });
        setFromStoreInventory([]);
        if (onSuccess) onSuccess();
      } else {
        if (res && typeof res === 'object' && 'details' in res && Array.isArray(res.details)) {
          const details = res.details;
          const idToName = Object.fromEntries(products.map((p: any) => [String(p.id), p.product_name]));
          const msg = details.map((d: any) => {
            const name = idToName[String(d.product_id)] || `Product ID ${d.product_id}`;
            return `${name}: requested ${d.requested}, available ${d.available}`;
          }).join('\n');
          setError(`Insufficient quantity for:\n${msg}`);
        } else {
          setError(res.error || 'Failed to record stock transfer');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record stock transfer');
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId: string | number) => {
    const product = products.find(p => Number(p.id) === Number(productId));
    return product?.product_name || '';
  };

  return (
    <div className={isModal ? '' : 'min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8'}>
      <div className={isModal ? '' : 'max-w-4xl mx-auto'}>
        {!isModal && (
          <div className="mb-4">
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stock Transfer
            </h1>
            <p className="text-[10px] text-gray-500 mt-0.5">Transfer stock between stores</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          {/* Store Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Store className="h-3 w-3" />
                From Store *
              </label>
              <select
                name="from_store_id"
                value={form.from_store_id}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Store</option>
                {stores.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.store_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Store className="h-3 w-3" />
                To Store *
              </label>
              <select
                name="to_store_id"
                value={form.to_store_id}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Store</option>
                {stores
                  .filter((s: any) => s.id !== Number(form.from_store_id))
                  .map((s: any) => (
                  <option key={s.id} value={s.id}>{s.store_name}</option>
                ))}
              </select>
            </div>
                </div>

          {/* Transfer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Transfer Date *
              </label>
              <input
                type="date"
                name="transfer_date"
                value={form.transfer_date}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Reference
              </label>
              <input
                type="text"
                name="reference"
                value={form.reference}
                onChange={handleChange}
                placeholder="Optional reference number"
                className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Products to Transfer */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-medium text-gray-700 flex items-center gap-1">
                <Package className="h-3 w-3" />
                Products to Transfer *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Product
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-2 py-1.5 text-center text-[9px] font-medium text-gray-500 uppercase tracking-wider w-12">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {form.items.map((item, idx) => {
                    const availableQty = getAvailableQuantity(item.product_id);
                    const requestedQty = Number(item.quantity) || 0;
                    const isInsufficient = requestedQty > availableQty && item.quantity !== '';
                    
                    return (
                      <tr key={idx} className={isInsufficient ? 'bg-red-50' : ''}>
                        <td className="px-2 py-1.5">
                          <select
                            name="product_id"
                            value={item.product_id}
                            onChange={e => handleItemChange(idx, e)}
                            required
                            className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Product</option>
                            {products
                              .filter((p: any) => p.is_active !== false)
                              .map((p: any) => (
                                <option key={p.id} value={p.id}>
                                  {p.product_name} {p.product_code ? `(${p.product_code})` : ''}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          {form.from_store_id && item.product_id ? (
                            <span className={`text-xs font-medium ${availableQty === 0 ? 'text-red-600' : availableQty < requestedQty ? 'text-orange-600' : 'text-green-600'}`}>
                              {loadingInventory ? 'Loading...' : availableQty.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            name="quantity"
                            value={item.quantity}
                            onChange={e => handleItemChange(idx, e)}
                            required
                            min={1}
                            max={availableQty || undefined}
                            placeholder="Qty"
                            className={`w-full border rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                              isInsufficient ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                          {isInsufficient && (
                            <p className="text-[9px] text-red-600 mt-0.5">Insufficient stock</p>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            disabled={form.items.length === 1}
                            className="text-red-600 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-3">
            <label className="block text-[10px] font-medium text-gray-700 mb-1 flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Additional notes (optional)"
              rows={2}
              className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-red-800">Error</p>
                <p className="text-xs text-red-700 whitespace-pre-line mt-0.5">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-green-800">Success</p>
                <p className="text-xs text-green-700 mt-0.5">{success}</p>
              </div>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="text-green-600 hover:text-green-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setForm({
                  from_store_id: '',
                  to_store_id: '',
                  transfer_date: new Date().toISOString().split('T')[0],
                  staff_id: user?.id || 0,
                  reference: '',
                  notes: '',
                  items: [{ product_id: '', quantity: '' }]
                });
                setError(null);
                setSuccess(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading || !form.from_store_id || !form.to_store_id || form.items.every(item => !item.product_id || !item.quantity)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                  Transferring...
                </>
              ) : (
                <>
                  <ArrowRight className="h-3 w-3" />
                  Transfer Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockTransferPage; 
