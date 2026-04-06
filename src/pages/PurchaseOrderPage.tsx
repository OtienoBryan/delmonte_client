import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Package, 
  DollarSign, 
  FileText,
  Search,
  ChevronDown
} from 'lucide-react';
import { 
  suppliersService, 
  productsService, 
  purchaseOrdersService 
} from '../services/financialService';
import { 
  Supplier, 
  Product, 
  CreatePurchaseOrderForm,
  TaxType
} from '../types/financial';

interface PurchaseOrderItem {
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number; // tax-inclusive unit price entered by the user
  total_price: number; // quantity * unit_price (gross)
  tax_type: TaxType;   // '16%' | 'zero_rated' | 'exempted'
}

const PurchaseOrderPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [selectedSupplier, setSelectedSupplier] = useState<number | ''>('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);

  // Supplier search state
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (dropdownRef.current && !dropdownRef.current.contains(target) && 
          !target.closest('.supplier-search-container')) {
        // Add a small delay to allow click events to complete
        setTimeout(() => {
          setShowSupplierDropdown(false);
          setHighlightedIndex(-1);
        }, 150);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter suppliers based on search term
  useEffect(() => {
    if (supplierSearchTerm.trim() === '') {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter(supplier => 
        (supplier.company_name && supplier.company_name.toLowerCase().includes(supplierSearchTerm.toLowerCase())) ||
        (supplier.contact_person && supplier.contact_person.toLowerCase().includes(supplierSearchTerm.toLowerCase())) ||
        (supplier.email && supplier.email.toLowerCase().includes(supplierSearchTerm.toLowerCase())) ||
        (supplier.phone && supplier.phone.toLowerCase().includes(supplierSearchTerm.toLowerCase())) ||
        (supplier.supplier_code && supplier.supplier_code.toLowerCase().includes(supplierSearchTerm.toLowerCase()))
      );
      setFilteredSuppliers(filtered);
    }
  }, [supplierSearchTerm, suppliers]);



  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [suppliersResponse, productsResponse] = await Promise.all([
        suppliersService.getAll(),
        productsService.getAll()
      ]);

      if (suppliersResponse.success && suppliersResponse.data) {
        setSuppliers(suppliersResponse.data);
      }

      if (productsResponse.success && productsResponse.data) {
        setProducts(productsResponse.data);
      }
    } catch (err) {
      setError('Failed to fetch initial data');
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTaxRate = (taxType: TaxType): number => {
    if (taxType === '16%') return 0.16;
    return 0; // zero_rated and exempted
  };

  const addItem = () => {
    const newItem: PurchaseOrderItem = {
      product_id: 0,
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      tax_type: '16%'
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    console.log(`Updating item ${index}, field ${field} to value:`, value, 'type:', typeof value);
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total price when quantity, unit_price, or tax_type changes
    if (field === 'quantity' || field === 'unit_price' || field === 'tax_type') {
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      const unitPrice = field === 'unit_price' ? value : updatedItems[index].unit_price;
      const taxType = field === 'tax_type' ? value : updatedItems[index].tax_type;
      const taxRate = getTaxRate(taxType);
      // Calculate total as (quantity × unit_price) × (1 + tax_rate)
      updatedItems[index].total_price = quantity * unitPrice * (1 + taxRate);
      console.log(`Recalculated total for item ${index}:`, updatedItems[index].total_price);
    }
    
    // Update product details if product_id changed
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      updatedItems[index].product = product;
    }
    
    setItems(updatedItems);
  };

  const calculateSubtotal = () => {
    // Sum of tax-exclusive line totals (quantity × unit_price)
    return items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
  };

  const calculateTax = () => {
    // Sum of tax amounts per line
    return items.reduce((sum, item) => {
      const rate = getTaxRate(item.tax_type);
      if (rate === 0) return sum;
      const lineNet = item.quantity * item.unit_price;
      const lineTax = lineNet * rate;
      return sum + lineTax;
    }, 0);
  };

  const calculateTotal = () => {
    // Total equals the sum of tax-inclusive line totals
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const validateForm = () => {
    if (!selectedSupplier || !supplierSearchTerm.trim()) {
      setError('Please select a supplier');
      return false;
    }
    
    if (items.length === 0) {
      setError('Please add at least one item');
      return false;
    }
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id) {
        setError(`Please select a product for item ${i + 1}`);
        return false;
      }
      if (item.quantity <= 0) {
        setError(`Quantity must be greater than 0 for item ${i + 1}`);
        return false;
      }
      if (item.unit_price <= 0) {
        setError(`Unit price must be greater than 0 for item ${i + 1}`);
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

      const purchaseOrderData: CreatePurchaseOrderForm = {
        supplier_id: selectedSupplier as number,
        order_date: orderDate,
        expected_delivery_date: expectedDeliveryDate || undefined,
        notes: notes || undefined,
        items: items.map(item => {
           // Calculate tax-inclusive unit price for database storage
           const taxRate = getTaxRate(item.tax_type);
           const taxInclusiveUnitPrice = item.unit_price * (1 + taxRate);
           
          return {
            product_id: item.product_id,
            quantity: item.quantity,
             // Post tax-inclusive unit price to database
             unit_price: Number(taxInclusiveUnitPrice.toFixed(2)),
            tax_type: item.tax_type
          };
        })
      };

      const response = await purchaseOrdersService.create(purchaseOrderData);
      
      if (response.success) {
        alert('Purchase order created successfully!');
        // Reset form
        setSelectedSupplier('');
        setSupplierSearchTerm('');
        setOrderDate(new Date().toISOString().split('T')[0]);
        setExpectedDeliveryDate('');
        setNotes('');
        setItems([]);
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

  const handleSupplierSelect = (supplier: Supplier) => {
    console.log('Supplier selected:', supplier); // Debug log
    // Update all states immediately for instant feedback
    setSelectedSupplier(supplier.id);
    setSupplierSearchTerm(supplier.company_name || '');
    setShowSupplierDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleSupplierSearchChange = (value: string) => {
    setSupplierSearchTerm(value);
    setShowSupplierDropdown(true);
    setHighlightedIndex(-1);
    // Clear selection if search term is empty or if user starts typing something different
    if (!value.trim()) {
      setSelectedSupplier('');
    } else if (selectedSupplier) {
      const selectedSupplierData = suppliers.find(s => s.id === selectedSupplier);
      if (selectedSupplierData && !value.toLowerCase().includes(selectedSupplierData.company_name?.toLowerCase() || '')) {
        setSelectedSupplier('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSupplierDropdown) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuppliers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuppliers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredSuppliers[highlightedIndex]) {
          handleSupplierSelect(filteredSuppliers[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSupplierDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const clearSupplierSelection = () => {
    setSelectedSupplier('');
    setSupplierSearchTerm('');
    setShowSupplierDropdown(false);
    setHighlightedIndex(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Create Purchase Order</h1>
              <p className="text-xs text-gray-600 mt-0.5">Create a new purchase order from suppliers</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => window.history.back()}
                className="bg-gray-600 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 flex items-center text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
              <div className="flex">
                <div className="text-red-600 text-xs">{error}</div>
              </div>
            </div>
          )}

          {/* Purchase Order Details */}
          <div className="bg-white rounded-lg shadow p-3">
            <h2 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-1.5" />
              Purchase Order Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Supplier Selection */}
              <div className="relative supplier-search-container">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Supplier <span className="text-red-500">*</span>
                  {selectedSupplier && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                      Selected
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={supplierSearchTerm}
                    onChange={(e) => handleSupplierSearchChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSupplierDropdown(true)}
                    className={`w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 ${
                      selectedSupplier ? 'bg-green-50 border-green-300' : ''
                    }`}
                    placeholder="Search by company name, contact person, email, phone, or supplier code..."
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : selectedSupplier ? (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    ) : (
                      <Search className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
                                 {showSupplierDropdown && filteredSuppliers.length > 0 && (
                   <div ref={dropdownRef} className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {supplierSearchTerm.trim() === '' && (
                      <div className="px-2 py-1.5 text-[10px] text-gray-500 border-b border-gray-200">
                        {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''} available
                      </div>
                    )}
                    {supplierSearchTerm.trim() !== '' && (
                      <div className="px-2 py-1.5 text-[10px] text-gray-500 border-b border-gray-200">
                        {filteredSuppliers.length} result{filteredSuppliers.length !== 1 ? 's' : ''} for "{supplierSearchTerm}"
                      </div>
                    )}
                                         {filteredSuppliers.map((supplier, index) => (
                       <div
                         key={supplier.id}
                         className={`px-2 py-1.5 cursor-pointer hover:bg-blue-50 text-xs ${
                           index === highlightedIndex ? 'bg-blue-100' : ''
                         }`}
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           handleSupplierSelect(supplier);
                         }}
                         onMouseDown={(e) => e.preventDefault()}
                       >
                        <div className="font-medium">{supplier.company_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Code: {supplier.supplier_code || 'N/A'}</div>
                        {supplier.contact_person && (
                          <div className="text-xs text-gray-600">{supplier.contact_person}</div>
                        )}
                        {supplier.email && (
                          <div className="text-xs text-gray-500">{supplier.email}</div>
                        )}
                        {supplier.phone && (
                          <div className="text-[10px] text-gray-500">{supplier.phone}</div>
                        )}
                        {supplier.address && (
                          <div className="text-[10px] text-gray-500">{supplier.address}</div>
                        )}
                        {supplier.tax_id && (
                          <div className="text-[10px] text-gray-500">Tax ID: {supplier.tax_id}</div>
                        )}
                        <div className="text-[10px] text-gray-500">
                          Payment Terms: {supplier.payment_terms || 'N/A'} days
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Credit Limit: ${(supplier.credit_limit || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Status: {supplier.is_active ? 'Active' : 'Inactive'}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Created: {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Updated: {supplier.updated_at ? new Date(supplier.updated_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showSupplierDropdown && supplierSearchTerm.trim() === '' && suppliers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                    <div className="px-4 py-3 text-center">
                      <div className="text-gray-500 mb-2">Start typing to search suppliers...</div>
                      <div className="text-xs text-gray-400">Search by company name, contact person, email, phone, or supplier code</div>
                      <div className="text-xs text-gray-400 mt-1">You can also browse all available suppliers below</div>
                    </div>
                  </div>
                )}
                {showSupplierDropdown && supplierSearchTerm.trim() !== '' && filteredSuppliers.length === 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                    <div className="px-4 py-3 text-center">
                      <div className="text-gray-500 mb-2">No suppliers found matching "{supplierSearchTerm}"</div>
                      <div className="text-xs text-gray-400">Try searching by company name, contact person, email, phone, or supplier code</div>
                    </div>
                  </div>
                )}
                {showSupplierDropdown && suppliers.length === 0 && !loading && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                    <div className="px-4 py-3 text-center">
                      <div className="text-gray-500 mb-2">No suppliers available</div>
                      <div className="text-xs text-gray-400">Please add suppliers first before creating purchase orders</div>
                    </div>
                  </div>
                )}
                {selectedSupplier && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-green-800">
                          {suppliers.find(s => s.id === selectedSupplier)?.company_name || 'N/A'}
                        </div>
                        <div className="text-xs text-green-600">
                          Code: {suppliers.find(s => s.id === selectedSupplier)?.supplier_code || 'N/A'}
                        </div>
                        {suppliers.find(s => s.id === selectedSupplier)?.contact_person && (
                          <div className="text-xs text-green-600">
                            Contact: {suppliers.find(s => s.id === selectedSupplier)?.contact_person}
                          </div>
                        )}
                        {suppliers.find(s => s.id === selectedSupplier)?.email && (
                          <div className="text-xs text-green-600">
                            Email: {suppliers.find(s => s.id === selectedSupplier)?.email}
                          </div>
                        )}
                        {suppliers.find(s => s.id === selectedSupplier)?.phone && (
                          <div className="text-xs text-green-600">
                            Phone: {suppliers.find(s => s.id === selectedSupplier)?.phone}
                          </div>
                        )}
                        {suppliers.find(s => s.id === selectedSupplier)?.address && (
                          <div className="text-xs text-green-600">
                            Address: {suppliers.find(s => s.id === selectedSupplier)?.address}
                          </div>
                        )}
                        {suppliers.find(s => s.id === selectedSupplier)?.tax_id && (
                          <div className="text-xs text-green-600">
                            Tax ID: {suppliers.find(s => s.id === selectedSupplier)?.tax_id}
                          </div>
                        )}
                        <div className="text-xs text-green-600">
                          Payment Terms: {suppliers.find(s => s.id === selectedSupplier)?.payment_terms || 'N/A'} days
                        </div>
                        <div className="text-xs text-green-600">
                          Credit Limit: ${(suppliers.find(s => s.id === selectedSupplier)?.credit_limit || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600">
                          Status: {suppliers.find(s => s.id === selectedSupplier)?.is_active ? 'Active' : 'Inactive'}
                        </div>
                        <div className="text-xs text-green-600">
                          Created: {suppliers.find(s => s.id === selectedSupplier)?.created_at ? new Date(suppliers.find(s => s.id === selectedSupplier)?.created_at || '').toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-xs text-green-600">
                          Updated: {suppliers.find(s => s.id === selectedSupplier)?.updated_at ? new Date(suppliers.find(s => s.id === selectedSupplier)?.updated_at || '').toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearSupplierSelection}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Clear selection"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Order Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Expected Delivery Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter any additional notes..."
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Order Items
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No items added yet. Click "Add Item" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-sm font-medium text-gray-900">Item {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Product Selection */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Product <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.product_id}
                          onChange={(e) => updateItem(index, 'product_id', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value={0}>Select a product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.product_name} ({product.product_code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              updateItem(index, 'quantity', 1);
                            } else {
                              const numValue = parseInt(value);
                              if (!isNaN(numValue) && numValue >= 1) {
                                updateItem(index, 'quantity', numValue);
                              }
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      {/* Unit Price */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                           Unit Price (excl. tax) <span className="text-red-500">*</span>
                        </label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                           value={item.unit_price || ''}
                           onChange={(e) => {
                             const value = e.target.value;
                             console.log('Unit price input change:', value, 'type:', typeof value);
                             if (value === '') {
                               updateItem(index, 'unit_price', 0);
                             } else {
                               const numValue = parseFloat(value);
                               console.log('Parsed value:', numValue);
                               if (!isNaN(numValue) && numValue >= 0) {
                                 updateItem(index, 'unit_price', numValue);
                               }
                             }
                           }}
                           className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                      </div>

                      {/* Tax Type */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Tax Type
                        </label>
                        <select
                          value={item.tax_type}
                          onChange={(e) => updateItem(index, 'tax_type', e.target.value as TaxType)}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={'16%'}>16%</option>
                          <option value={'zero_rated'}>Zero rated</option>
                          <option value={'exempted'}>Exempted</option>
                        </select>
                      </div>

                      {/* Total Price */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                           Total Price (incl. tax)
                        </label>
                          <input
                            type="number"
                            value={item.total_price.toFixed(2)}
                            readOnly
                           className="w-full border border-gray-300 rounded-lg px-2 py-1.5 bg-gray-50 text-gray-900"
                          />
                      </div>
                    </div>

                    {/* Product Details */}
                    {item.product && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Category:</span>
                            <span className="ml-2 font-medium">{item.product.category || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Unit:</span>
                            <span className="ml-2 font-medium">{item.product.unit_of_measure}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Current Stock:</span>
                            <span className="ml-2 font-medium">{item.product.current_stock}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Reorder Level:</span>
                            <span className="ml-2 font-medium">{item.product.reorder_level}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary Section */}
          {items.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Order Summary
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                   <span className="font-medium">{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                   <span className="font-medium">{calculateTax().toFixed(2)}</span>
                </div>
                <div className="border-top pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                     <span className="text-lg font-semibold text-gray-900">{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || items.length === 0}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
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

export default PurchaseOrderPage; 