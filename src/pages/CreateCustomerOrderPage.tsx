import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Package, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  FileText,
  User,
  Search
} from 'lucide-react';
import { 
  customersService, 
  productsService, 
  salesOrdersService 
} from '../services/financialService';
import { 
  Customer, 
  Product, 
  CreateSalesOrderForm 
} from '../types/financial';

interface SalesOrderItem {
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_type: '16%' | 'zero_rated' | 'exempted';
  tax_amount: number;
  net_price: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'KES' 
  }).format(amount);
};

const CreateCustomerOrderPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<number | ''>('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SalesOrderItem[]>([]);
  
  // Search state
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.customer-dropdown')) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      const [customersResponse, productsResponse] = await Promise.all([
        customersService.getAll(),
        productsService.getAll()
      ]);

      if (customersResponse.success && customersResponse.data) {
        setCustomers(customersResponse.data);
      } else {
        console.error('Failed to get customers:', customersResponse);
        setError('Failed to fetch customers');
      }

      if (productsResponse.success && productsResponse.data) {
        setProducts(productsResponse.data);
      } else {
        console.error('Failed to get products:', productsResponse);
        setError('Failed to fetch products');
      }
    } catch (err) {
      setError('Failed to fetch initial data');
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const newItem: SalesOrderItem = {
      product_id: 0,
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      tax_type: '16%',
      tax_amount: 0,
      net_price: 0
    };
    console.log('Adding new item:', newItem);
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SalesOrderItem, value: any) => {
    console.log('updateItem called:', { index, field, value, currentItems: items });
    
    const updatedItems = [...items];
    
    // Update the field first
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    console.log('Field updated:', { field, newValue: updatedItems[index][field] });
    
            // Update product details if product_id changed (do this before price calculations)
        if (field === 'product_id' && value > 0) {
          const product = products.find(p => p.id === value);
          if (product) {
            console.log('Product found:', product);
            updatedItems[index].product = product;
            
            // Only set unit_price if product has a valid selling_price
            if (product.selling_price && product.selling_price > 0) {
              updatedItems[index].unit_price = product.selling_price;
              console.log('Using product selling price:', product.selling_price);
            } else {
              // Reset unit_price to 0 if product has no selling price
              updatedItems[index].unit_price = 0;
              console.log('Product has no selling price, unit_price reset to 0');
            }
            
            // Use product's default tax type if available, otherwise keep current
            if (product.tax_type) {
              updatedItems[index].tax_type = product.tax_type;
            }
            console.log('Product details updated:', { 
              unit_price: updatedItems[index].unit_price, 
              tax_type: updatedItems[index].tax_type 
            });
          }
        }
    
    // Always recalculate prices after any field update that affects pricing
    if (field === 'quantity' || field === 'unit_price' || field === 'tax_type' || field === 'product_id') {
      const quantity = updatedItems[index].quantity;
      const unitPrice = updatedItems[index].unit_price;
      const taxType = updatedItems[index].tax_type;
      
      console.log('Calculating prices:', { quantity, unitPrice, taxType });
      
      const netPrice = quantity * unitPrice;
      let taxRate = 0;
      
      if (taxType === '16%') {
        taxRate = 0.16;
      } else if (taxType === 'zero_rated' || taxType === 'exempted') {
        taxRate = 0;
      }
      
      const taxAmount = netPrice * taxRate;
      const totalPrice = netPrice + taxAmount;
      
      console.log('Price calculations:', { netPrice, taxAmount, totalPrice });
      
      updatedItems[index].net_price = netPrice;
      updatedItems[index].tax_amount = taxAmount;
      updatedItems[index].total_price = totalPrice;
    }
    
    console.log('Final updated item:', updatedItems[index]);
    setItems(updatedItems);
  };

  const calculateSubtotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.net_price, 0);
    console.log('Calculating subtotal:', { items: items.map(i => ({ id: i.product_id, net_price: i.net_price })), subtotal });
    return subtotal;
  };

  const calculateTax = () => {
    const tax = items.reduce((sum, item) => sum + item.tax_amount, 0);
    console.log('Calculating tax:', { items: items.map(i => ({ id: i.product_id, tax_amount: i.tax_amount })), tax });
    return tax;
  };

  const calculateTotal = () => {
    const total = items.reduce((sum, item) => sum + item.total_price, 0);
    console.log('Calculating total:', { items: items.map(i => ({ id: i.product_id, total_price: i.total_price })), total });
    return total;
  };

  // Calculate tax breakdown by tax type
  const calculateTaxBreakdown = () => {
    const breakdown = {
      '16%': 0,
      'zero_rated': 0,
      'exempted': 0
    };

    items.forEach(item => {
      breakdown[item.tax_type] += item.tax_amount;
    });

    return breakdown;
  };

  // Calculate net amount breakdown by tax type
  const calculateNetBreakdown = () => {
    const breakdown = {
      '16%': 0,
      'zero_rated': 0,
      'exempted': 0
    };

    items.forEach(item => {
      breakdown[item.tax_type] += item.net_price;
    });

    return breakdown;
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    (customer.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.contact || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.email || '').toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Get selected customer name
  const selectedCustomerName = customers.find(c => c.id === selectedCustomer)?.name || '';

  // Get the list of customers to display (filtered or all)
  const displayCustomers = customerSearch ? filteredCustomers : customers;

  const validateForm = () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return false;
    }

    if (!orderDate) {
      setError('Please select an order date');
      return false;
    }

    if (items.length === 0) {
      setError('Please add at least one item');
      return false;
    }

    // Check for duplicate products
    const selectedProductIds = items
      .filter(item => item.product_id > 0) // Only check items with selected products
      .map(item => item.product_id);
    
    const uniqueProductIds = new Set(selectedProductIds);
    
    if (selectedProductIds.length !== uniqueProductIds.size) {
      setError('Duplicate products detected. Each product can only be added once to the order.');
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
    
    console.log('=== FORM SUBMISSION START ===');
    console.log('Form validation result:', validateForm());
    
    if (!validateForm()) {
      console.log('Form validation failed, returning');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      console.log('Selected customer:', selectedCustomer);
      console.log('Order date:', orderDate);
      console.log('Expected delivery date:', expectedDeliveryDate);
      console.log('Notes:', notes);
      console.log('Items:', items);

                                                       const salesOrderData: CreateSalesOrderForm = {
          client_id: selectedCustomer as number,
          order_date: orderDate,
          expected_delivery_date: expectedDeliveryDate || undefined,
          notes: notes || undefined,
          subtotal: calculateSubtotal(),
          tax_amount: calculateTax(),
          total_amount: calculateTotal(),
          items: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_type: item.tax_type,
            tax_amount: item.tax_amount
          }))
        };
       
       console.log('=== ITEMS BEFORE MAPPING ===');
       console.log('Raw items:', JSON.stringify(items, null, 2));
               console.log('=== MAPPED ITEMS ===');
        console.log('Mapped items:', JSON.stringify(salesOrderData.items, null, 2));
        
        console.log('=== ORDER TOTALS ===');
        console.log('Subtotal:', salesOrderData.subtotal);
        console.log('Tax Amount:', salesOrderData.tax_amount);
        console.log('Total Amount:', salesOrderData.total_amount);

        console.log('=== SUBMITTING SALES ORDER ===');
        console.log('Sales order data:', JSON.stringify(salesOrderData, null, 2));
      
      const response = await salesOrdersService.create(salesOrderData);
      console.log('=== SALES ORDER RESPONSE ===');
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        setSuccess('Customer order created successfully!');
        // Reset form
        setSelectedCustomer('');
        setOrderDate(new Date().toISOString().split('T')[0]);
        setExpectedDeliveryDate('');
        setNotes('');
        setItems([]);
      } else {
        setError(response.error || 'Failed to create customer order');
      }
    } catch (err) {
      setError('Failed to create customer order');
      console.error('Error creating customer order:', err);
    } finally {
      setSaving(false);
    }
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
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center">
              <ShoppingCart className="h-5 w-5 text-blue-600 mr-2" />
              <h1 className="text-sm font-bold text-gray-900">Create Customer Order</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto py-3 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-xs">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-3 text-xs">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4">
          {/* Customer and Date Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative customer-dropdown">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Customer *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3 w-3 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                    setSelectedIndex(-1);
                    if (!e.target.value) {
                      setSelectedCustomer('');
                    }
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedIndex(prev => 
                        prev < Math.min(displayCustomers.length - 1, 9) ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                    } else if (e.key === 'Enter' && selectedIndex >= 0) {
                      e.preventDefault();
                      const customer = displayCustomers[selectedIndex];
                      if (customer) {
                        setSelectedCustomer(customer.id);
                        setCustomerSearch(customer.name || '');
                        setShowCustomerDropdown(false);
                        setSelectedIndex(-1);
                      }
                    } else if (e.key === 'Escape') {
                      setShowCustomerDropdown(false);
                      setSelectedIndex(-1);
                    }
                  }}
                  placeholder={selectedCustomer ? selectedCustomerName : "Search customers..."}
                  className="w-full border border-gray-300 rounded-md pl-10 pr-10 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer('');
                      setCustomerSearch('');
                      setShowCustomerDropdown(false);
                    }}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {showCustomerDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {customerSearch ? (
                    // Show filtered results
                    filteredCustomers.length > 0 ? (
                      filteredCustomers.slice(0, 10).map((customer, index) => (
                        <div
                          key={customer.id}
                          className={`px-3 py-1.5 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                            index === selectedIndex ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            setSelectedCustomer(customer.id);
                            setCustomerSearch(customer.name || '');
                            setShowCustomerDropdown(false);
                            setSelectedIndex(-1);
                          }}
                        >
                          <div className="font-medium text-xs text-gray-900">{customer.name}</div>
                          {customer.contact && (
                            <div className="text-[10px] text-gray-500">Contact: {customer.contact}</div>
                          )}
                          {customer.email && (
                            <div className="text-[10px] text-gray-500">Email: {customer.email}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-1.5 text-[10px] text-gray-500">No customers found</div>
                    )
                  ) : (
                    // Show first 10 customers when no search
                    <>
                      <div className="px-3 py-1.5 text-[10px] text-gray-500 border-b border-gray-100">
                        Type to search or select from recent customers:
                      </div>
                      {customers.slice(0, 10).map((customer, index) => (
                        <div
                          key={customer.id}
                          className={`px-3 py-1.5 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                            index === selectedIndex ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            setSelectedCustomer(customer.id);
                            setCustomerSearch(customer.name || '');
                            setShowCustomerDropdown(false);
                            setSelectedIndex(-1);
                          }}
                        >
                          <div className="font-medium text-xs text-gray-900">{customer.name}</div>
                          {customer.contact && (
                            <div className="text-[10px] text-gray-500">Contact: {customer.contact}</div>
                          )}
                          {customer.email && (
                            <div className="text-[10px] text-gray-500">Email: {customer.email}</div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
              
              {/* Validation for required field */}
              {!selectedCustomer && (
                <div className="text-red-500 text-[10px] mt-1">Please select a customer</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Order Date *
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-gray-900">Order Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                <p className="text-xs">No items added yet. Click "Add Item" to start building your order.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Product *
                        </label>
                        <select
                          value={item.product_id}
                          onChange={(e) => updateItem(index, 'product_id', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value={0}>Select Product</option>
                          {products
                            .filter(product => {
                              // Show all products if this item has no product selected
                              if (item.product_id === 0) return true;
                              // Show the currently selected product for this item
                              if (product.id === item.product_id) return true;
                              // Hide products that are already selected in other items
                              return !items.some((otherItem, otherIndex) => 
                                otherIndex !== index && otherItem.product_id === product.id
                              );
                            })
                            .map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.product_name} - {product.product_code}
                              </option>
                            ))}
                        </select>
                        <p className="text-[9px] text-gray-500 mt-0.5">
                          Product's selling price will be used as the base unit price (exclusive of tax)
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Unit Price (Exclusive of Tax) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : Number(e.target.value);
                            console.log('Updating unit price:', { index, value, currentItem: item });
                            updateItem(index, 'unit_price', value);
                          }}
                          className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        
          {item.unit_price > 0 && (
            <div className="mt-1.5 p-1.5 bg-gray-50 rounded text-[9px] hidden">
              <div className="flex justify-between">
                <span>Base Price:</span>
                <span>{formatCurrency(item.unit_price)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({item.tax_type || '16%'}):</span>
                <span>{formatCurrency(item.tax_amount || 0)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-0.5">
                <span>Total Price:</span>
                <span>{formatCurrency(item.total_price || 0)}</span>
              </div>
            </div>
          )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Tax Type *
                        </label>
                        <select
                          value={item.tax_type}
                          onChange={(e) => updateItem(index, 'tax_type', e.target.value as '16%' | 'zero_rated' | 'exempted')}
                          className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="16%">16% VAT</option>
                          <option value="zero_rated">Zero Rated</option>
                          <option value="exempted">Exempted</option>
                        </select>
                      </div>

                      <div className="flex items-end space-x-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tax Amount
                          </label>
                          <div className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 bg-gray-50 text-gray-900 text-xs">
                             {item.tax_amount.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Total
                          </label>
                          <div className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 bg-gray-50 text-gray-900 text-xs">
                            {item.total_price.toFixed(2)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1.5 text-red-600 hover:text-red-800 focus:outline-none"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>



                     {/* Debug Information */}
           {items.length > 0 && (
             <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md hidden">
               <h4 className="text-xs font-medium text-yellow-800 mb-2">Debug Info (Current Items State)</h4>
               <pre className="text-[10px] text-yellow-700 overflow-auto">
                 {JSON.stringify(items, null, 2)}
               </pre>
             </div>
           )}
           
           {/* Order Summary */}
           {items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="text-xs font-medium text-gray-900 mb-3">Order Summary</h3>
              
              {/* Pricing Information Note */}
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md hidden">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-2">
                    <h4 className="text-xs font-medium text-blue-800">Pricing Information</h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Unit prices are entered exclusive of tax. Tax is calculated and added automatically based on the selected tax type for each item.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any additional notes for this order..."
                  />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-medium text-gray-900 mb-2">Amount Summary</h4>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Net Amount:</span>
                    <span className="font-medium">KES {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Tax Amount:</span>
                    <span className="font-medium">KES {calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold border-t pt-1.5">
                    <span>Total:</span>
                    <span>KES {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-medium text-gray-900 mb-2">Tax Breakdown</h4>
                  {(() => {
                    const taxBreakdown = calculateTaxBreakdown();
                    const netBreakdown = calculateNetBreakdown();
                    const hasTaxItems = Object.values(taxBreakdown).some(amount => amount > 0);
                    
                    if (!hasTaxItems) {
                      return (
                        <div className="text-xs text-gray-500">
                          No taxable items in this order
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-1">
                        {taxBreakdown['16%'] > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">16% VAT:</span>
                            <span className="font-medium">KES {taxBreakdown['16%'].toFixed(2)}</span>
                          </div>
                        )}
                        {taxBreakdown['zero_rated'] > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Zero Rated Tax:</span>
                            <span className="font-medium">KES {taxBreakdown['zero_rated'].toFixed(2)}</span>
                          </div>
                        )}
                        {taxBreakdown['exempted'] > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Exempted Tax:</span>
                            <span className="font-medium">KES {taxBreakdown['exempted'].toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCustomer('');
                setOrderDate(new Date().toISOString().split('T')[0]);
                setExpectedDeliveryDate('');
                setNotes('');
                setItems([]);
                setError(null);
                setSuccess(null);
              }}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-3 w-3 mr-1.5" />
              Clear Form
            </button>
            <button
              type="submit"
              disabled={saving || items.length === 0}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                  Creating Order...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1.5" />
                  Create Customer Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCustomerOrderPage; 