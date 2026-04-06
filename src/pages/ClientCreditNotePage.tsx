import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Save, 
  Package, 
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Receipt,
  ShoppingCart
} from 'lucide-react';
import { 
  creditNoteService,
  CreditNoteItem,
  CustomerInvoice
} from '../services/creditNoteService';
import { 
  invoiceService
} from '../services/financialService';
import { 
  Product
} from '../types/financial';

const ClientCreditNotePage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [clientInvoices, setClientInvoices] = useState<CustomerInvoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<CustomerInvoice[]>([]);
  const [invoiceItemsMap, setInvoiceItemsMap] = useState<{ [invoiceId: number]: any[] }>({});
  const [selectedItems, setSelectedItems] = useState<CreditNoteItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvoiceItems, setLoadingInvoiceItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [creditNoteDate, setCreditNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (clientId) {
      fetchClientInvoices();
      fetchProducts();
    }
  }, [clientId]);

  const fetchClientInvoices = async () => {
    try {
      const response = await creditNoteService.getCustomerInvoices(parseInt(clientId!));
      if (response.success) {
        setClientInvoices(response.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching client invoices:', err);
      setError('Failed to fetch client invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/financial/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
    }
  };

  const handleInvoiceSelect = async (invoice: CustomerInvoice) => {
    setLoadingInvoiceItems(true);
    
    try {
      // Check if invoice is already selected
      const isAlreadySelected = selectedInvoices.some(inv => inv.id === invoice.id);
      
      if (isAlreadySelected) {
        // Remove invoice from selection
        setSelectedInvoices(selectedInvoices.filter(inv => inv.id !== invoice.id));
        // Remove items from this invoice from selected items
        setSelectedItems(selectedItems.filter(item => item.invoice_id !== invoice.id));
        // Remove items from invoiceItemsMap
        const newInvoiceItemsMap = { ...invoiceItemsMap };
        delete newInvoiceItemsMap[invoice.id];
        setInvoiceItemsMap(newInvoiceItemsMap);
      } else {
        // Add invoice to selection
        setSelectedInvoices([...selectedInvoices, invoice]);
        
        // Load invoice items if not already loaded
        if (!invoiceItemsMap[invoice.id]) {
          const response = await invoiceService.getById(invoice.id);
          
          if (response.success && response.data && response.data.items) {
            setInvoiceItemsMap({
              ...invoiceItemsMap,
              [invoice.id]: response.data.items
            });
          } else {
            setInvoiceItemsMap({
              ...invoiceItemsMap,
              [invoice.id]: []
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading invoice items:', error);
    } finally {
      setLoadingInvoiceItems(false);
    }
  };

  const handleItemToggle = (item: any, invoiceId: number, isSelected: boolean) => {
    if (isSelected) {
      // Add item to selected items
      const creditNoteItem: CreditNoteItem = {
        product_id: item.product_id,
        invoice_id: invoiceId,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price)
      };
      setSelectedItems([...selectedItems, creditNoteItem]);
    } else {
      // Remove item from selected items
      setSelectedItems(selectedItems.filter(selected => 
        selected.product_id !== item.product_id || 
        selected.invoice_id !== invoiceId ||
        selected.quantity !== Number(item.quantity)
      ));
    }
  };

  const updateSelectedItem = (index: number, field: keyof CreditNoteItem, value: any) => {
    const updatedItems = [...selectedItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Calculate total price
    if (field === 'quantity' || field === 'unit_price') {
      const item = updatedItems[index];
      item.total_price = Number(item.quantity) * Number(item.unit_price);
    }

    setSelectedItems(updatedItems);
  };

  const removeSelectedItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const TAX_RATE = 0.16;
  const TAX_DIVISOR = 1 + TAX_RATE;

  const calculateNet = (price: number) => price / TAX_DIVISOR;
  const calculateTax = (price: number) => price - calculateNet(price);

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => sum + calculateNet(Number(item.total_price)), 0);
  };

  const calculateTaxTotal = () => {
    return selectedItems.reduce((sum, item) => sum + calculateTax(Number(item.total_price)), 0);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + Number(item.total_price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedInvoices.length === 0) {
      setError('Please select at least one invoice first');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Please select at least one item');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const creditNoteData = {
        customer_id: parseInt(clientId!),
        credit_note_date: creditNoteDate,
        reason: reason || undefined,
        original_invoice_id: selectedInvoices[0].id, // Use first selected invoice as primary
        items: selectedItems,
        scenario_type: 'faulty_no_stock' as const, // Default to scenario 1
        damage_store_id: null
      };

      const response = await creditNoteService.create(creditNoteData);
      
      if (response.success) {
        setSuccess(`Credit note ${response.data.credit_note_number} created successfully!`);
        // Reset form
        setCreditNoteDate(new Date().toISOString().split('T')[0]);
        setReason('');
        setSelectedInvoices([]);
        setSelectedItems([]);
        setInvoiceItemsMap({});
        
        // Redirect back to client details after a short delay
        setTimeout(() => {
          navigate(`/dashboard/clients/${clientId}`);
        }, 2000);
      } else {
        setError(response.error || 'Failed to create credit note');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create credit note');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/dashboard/clients/${clientId}`)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Credit Note</h1>
                <p className="text-sm text-gray-500">Select invoice and items for credit note</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Two Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Invoices List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-blue-600" />
                Client Invoices
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Select invoices to view their items (multiple selection allowed)
              </p>
            </div>
            
            <div className="p-6">
              {clientInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No invoices available for this client</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      onClick={() => handleInvoiceSelect(invoice)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedInvoices.some(inv => inv.id === invoice.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {invoice.invoice_number}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(invoice.invoice_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total: ${Number(invoice.total_amount).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            ${Number(invoice.remaining_amount).toFixed(2)} remaining
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Invoice Items and Credit Note Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
                Invoice Items & Credit Note
              </h2>
              {selectedInvoices.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedInvoices.length === 1 
                    ? `Invoice: ${selectedInvoices[0].invoice_number}`
                    : `${selectedInvoices.length} invoices selected`
                  }
                </p>
              )}
            </div>

            <div className="p-6">
              {selectedInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select invoices to view their items</p>
                </div>
              ) : (
                <>
                  {/* Invoice Items Loading */}
                  {loadingInvoiceItems && (
                    <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-blue-700">Loading invoice items...</span>
                    </div>
                  )}

                  {/* Invoice Items List */}
                  {!loadingInvoiceItems && Object.keys(invoiceItemsMap).length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Select Items for Credit Note</h3>
                      <div className="space-y-4">
                        {selectedInvoices.map((invoice) => {
                          const invoiceItems = invoiceItemsMap[invoice.id] || [];
                          return (
                            <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                                <Receipt className="h-4 w-4 mr-2 text-blue-600" />
                                Invoice: {invoice.invoice_number}
                              </h4>
                              <div className="space-y-2">
                                {invoiceItems.map((item, index) => {
                                  const isSelected = selectedItems.some(selected => 
                                    selected.product_id === item.product_id && 
                                    selected.invoice_id === invoice.id &&
                                    selected.quantity === Number(item.quantity)
                                  );
                                  return (
                                    <div
                                      key={index}
                                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'border-green-500 bg-green-50'
                                          : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                      onClick={() => handleItemToggle(item, invoice.id, !isSelected)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900">
                                            {item.product_name || `Product ${item.product_id}`}
                                          </p>
                                          <p className="text-sm text-gray-500">
                                            Qty: {item.quantity} × ${item.unit_price}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium text-gray-900">
                                            ${Number(item.total_price).toFixed(2)}
                                          </p>
                                          <div className={`w-4 h-4 rounded border-2 ${
                                            isSelected 
                                              ? 'bg-green-500 border-green-500' 
                                              : 'border-gray-300'
                                          }`}>
                                            {isSelected && (
                                              <div className="w-full h-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Credit Note Form */}
                  {selectedItems.length > 0 && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Date and Reason */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Credit Note Date *
                          </label>
                          <input
                            type="date"
                            value={creditNoteDate}
                            onChange={(e) => setCreditNoteDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Credit Note
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter the reason for this credit note..."
                        />
                      </div>

                      {/* Selected Items */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Items</h3>
                        <div className="space-y-4">
                          {selectedItems.map((item, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product
                                  </label>
                                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                                    {products.find(p => p.id === item.product_id)?.product_name || `Product ${item.product_id}`}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.quantity}
                                    onChange={(e) => updateSelectedItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit Price
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unit_price}
                                    onChange={(e) => updateSelectedItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>

                                <div className="flex items-end space-x-2">
                                  <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Total Price
                                    </label>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                                      ${Number(item.total_price).toFixed(2)}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeSelectedItem(index)}
                                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totals */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Credit Note Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal (Net):</span>
                            <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax (16%):</span>
                            <span className="font-medium">${calculateTaxTotal().toFixed(2)}</span>
                          </div>
                          <div className="border-t border-gray-300 pt-2">
                            <div className="flex justify-between">
                              <span className="text-lg font-semibold text-gray-900">Total Credit Amount:</span>
                              <span className="text-lg font-semibold text-gray-900">${calculateTotal().toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/clients/${clientId}`)}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {submitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Create Credit Note
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCreditNotePage; 