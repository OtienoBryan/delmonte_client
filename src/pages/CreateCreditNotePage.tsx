import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Receipt,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';
import { 
  customersService, 
  productsService,
  invoiceService
} from '../services/financialService';
import { storeService } from '../services/storeService';
import { Store } from '../types/financial';
import { 
  creditNoteService,
  CreditNoteItem,
  CustomerInvoice
} from '../services/creditNoteService';
import { 
  Customer, 
  Product
} from '../types/financial';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CreateCreditNotePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<CustomerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingInvoiceItems, setLoadingInvoiceItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [clientId, setClientId] = useState('');
  const [creditNoteDate, setCreditNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<Set<number>>(new Set());
  const [items, setItems] = useState<CreditNoteItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Map<number, any[]>>(new Map());
  const [stores, setStores] = useState<Store[]>([]);
  const [deltaCornerStoreId, setDeltaCornerStoreId] = useState<number | null>(null);
  const [damagedFaultyStoreId, setDamagedFaultyStoreId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);

  useEffect(() => {
    fetchData();
  }, []);

  // Handle URL parameters
  useEffect(() => {
    const urlClientId = searchParams.get('customerId');
    const urlInvoiceId = searchParams.get('invoiceId');
    
    if (urlClientId) {
      setClientId(urlClientId);
    }
    
    if (urlInvoiceId && customerInvoices.length > 0) {
      const invoice = customerInvoices.find(inv => inv.id === parseInt(urlInvoiceId));
      if (invoice) {
        setSelectedInvoices(new Set([invoice.id]));
      }
    }
  }, [searchParams, customerInvoices]);

  useEffect(() => {
    if (clientId) {
      fetchCustomerInvoices();
    }
  }, [clientId]);

  // Auto-load invoice items when invoices are selected
  useEffect(() => {
    if (selectedInvoices.size > 0) {
      loadInvoiceItems();
    } else {
      setItems([]);
      setAvailableProducts(new Map());
    }
  }, [selectedInvoices]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [customersRes, productsRes, storesRes] = await Promise.all([
        customersService.getAll(),
        productsService.getAll(),
        storeService.getAllStores()
      ]);

      if (customersRes.success) {
        const customersData = customersRes.data || [];
        console.log('Customers loaded:', customersData.length, customersData);
        setCustomers(customersData);
      } else {
        console.error('Failed to load customers:', customersRes);
      }
      if (productsRes.success) {
        setProducts(productsRes.data || []);
      }
      if (storesRes.success) {
        const storesData = storesRes.data || [];
        setStores(storesData);
        
        // Find Delta Corner Store
        const deltaCornerStore = storesData.find(store => 
          store.store_name.toLowerCase().includes('delta corner') || 
          store.store_name.toLowerCase().includes('delta warehouse') ||
          store.store_code.toLowerCase().includes('delta')
        );
        if (deltaCornerStore) {
          setDeltaCornerStoreId(deltaCornerStore.id);
        }
        
        // Find Damaged/Faulty Store
        const damagedFaultyStore = storesData.find(store => 
          store.store_name.toLowerCase().includes('damaged') || 
          store.store_name.toLowerCase().includes('faulty') ||
          store.store_name.toLowerCase().includes('damage') ||
          store.store_name.toLowerCase().includes('damaged/faulty')
        );
        if (damagedFaultyStore) {
          setDamagedFaultyStoreId(damagedFaultyStore.id);
        } else {
          console.warn('Damaged/Faulty store not found. Please ensure a store with "damaged" or "faulty" in the name exists.');
        }
        
        if (!deltaCornerStore) {
          console.warn('Delta Corner store not found. Please ensure a store with "delta corner" or "delta warehouse" in the name exists.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerInvoices = async () => {
    try {
      const response = await creditNoteService.getCustomerInvoices(parseInt(clientId));
      if (response.success && Array.isArray(response.data)) {
        setCustomerInvoices(response.data);
      } else {
        console.warn('Invalid response format for customer invoices:', response);
        setCustomerInvoices([]);
      }
    } catch (err: any) {
      console.error('Error fetching customer invoices:', err);
      setCustomerInvoices([]);
    }
  };

  const handleInvoiceSelect = (invoiceId: number) => {
    const newSelectedInvoices = new Set(selectedInvoices);
    
    if (newSelectedInvoices.has(invoiceId)) {
      // Removing invoice
      newSelectedInvoices.delete(invoiceId);
      setSelectedInvoices(newSelectedInvoices);
      
      // Clear items and available products when selection changes
      if (newSelectedInvoices.size === 0) {
        setItems([]);
        setAvailableProducts(new Map());
      }
    } else {
      // Adding invoice - allow selection first, validation will happen when adding items
      newSelectedInvoices.add(invoiceId);
      setSelectedInvoices(newSelectedInvoices);
      setError(null); // Clear any previous error
    }
  };

  const addItem = () => {
    const selectedInvoiceIds = Array.from(selectedInvoices);
    if (selectedInvoiceIds.length === 0) {
      setError('Please select at least one invoice first');
      return;
    }
    
    // Check if there are any uncredited products available
    let totalUncreditedProducts = 0;
    let firstAvailableProduct: any = null;
    let firstInvoiceId: number = 0;
    
    for (const invoiceId of selectedInvoiceIds) {
      const invoiceProducts = availableProducts.get(invoiceId);
      if (invoiceProducts && invoiceProducts.length > 0) {
        const uncreditedProducts = invoiceProducts.filter(product => 
          !isProductInvoiceCredited(product.product_id, invoiceId)
        );
        totalUncreditedProducts += uncreditedProducts.length;
        
        // Find the first uncredited product if we haven't found one yet
        if (!firstAvailableProduct && uncreditedProducts.length > 0) {
          firstAvailableProduct = uncreditedProducts[0];
          firstInvoiceId = invoiceId;
        }
      }
    }
    
    if (totalUncreditedProducts === 0) {
      setError('All available products from selected invoices have already been added to the credit note. No more products can be added.');
      return;
    }
    
    if (!firstAvailableProduct) {
      setError('No products available from selected invoices');
      return;
    }
    
    // Double-check that this product-invoice combination isn't already credited
    if (isProductInvoiceCredited(firstAvailableProduct.product_id, firstInvoiceId)) {
      setError('This product from this invoice has already been added to the credit note');
      return;
    }
    
    const newItem: CreditNoteItem = {
      product_id: firstAvailableProduct.product_id,
      invoice_id: firstInvoiceId,
      quantity: firstAvailableProduct.quantity,
      unit_price: firstAvailableProduct.unit_price,
      total_price: firstAvailableProduct.total_price,
      condition: undefined,
      return_store_id: null
    };
    
    setItems([...items, newItem]);
    setError(null); // Clear any previous error
    setSuccess(`Added ${firstAvailableProduct.product_name || 'Product'} from Invoice ${firstInvoiceId}`);
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CreditNoteItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Handle condition change - auto-assign return store
    if (field === 'condition') {
      if (value === 'good' && deltaCornerStoreId) {
        updatedItems[index].return_store_id = deltaCornerStoreId;
      } else if (value === 'damaged' && damagedFaultyStoreId) {
        updatedItems[index].return_store_id = damagedFaultyStoreId;
      } else {
        updatedItems[index].return_store_id = null;
      }
    }

    // Calculate total price
    if (field === 'quantity' || field === 'unit_price') {
      const item = updatedItems[index];
      item.total_price = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    }

    // Set product details if product_id changed
    if (field === 'product_id') {
      const item = updatedItems[index];
      const invoiceProducts = availableProducts.get(item.invoice_id);
      if (invoiceProducts) {
        const product = invoiceProducts.find(p => p.product_id === value);
        if (product) {
          // Check if this product-invoice combination already exists in another item
          const isDuplicate = isProductInvoiceCredited(value, item.invoice_id, index);
          
          if (isDuplicate) {
            setError(`Product "${product.product_name || 'Unknown'}" from this invoice has already been added to the credit note. Each product from each invoice can only be credited once.`);
            return; // Don't update the item
          }
          
          // Use remaining quantity as default quantity
          const remainingQty = product.remaining_quantity !== undefined 
            ? product.remaining_quantity 
            : (product.original_quantity !== undefined 
              ? (product.original_quantity - (product.credited_quantity || 0))
              : Number(product.quantity) || 0);
          
          updatedItems[index].unit_price = Number(product.unit_price) || 0;
          updatedItems[index].quantity = remainingQty; // Set to remaining quantity
          updatedItems[index].total_price = remainingQty * (Number(product.unit_price) || 0);
          setError(null); // Clear any previous error
        }
      }
    }

    // If invoice_id changed, update product_id to match available products
    if (field === 'invoice_id') {
      const item = updatedItems[index];
      const invoiceProducts = availableProducts.get(value);
      if (invoiceProducts && invoiceProducts.length > 0) {
        // Find first available product from this invoice that hasn't been credited yet
        const availableProduct = invoiceProducts.find(product => 
          !isProductInvoiceCredited(product.product_id, value, index)
        );
        
        if (availableProduct) {
          updatedItems[index].product_id = availableProduct.product_id;
          updatedItems[index].unit_price = Number(availableProduct.unit_price) || 0;
          updatedItems[index].total_price = (Number(updatedItems[index].quantity) || 0) * (Number(availableProduct.unit_price) || 0);
        } else {
          updatedItems[index].product_id = 0;
          updatedItems[index].unit_price = 0;
          updatedItems[index].total_price = 0;
        }
      } else {
        updatedItems[index].product_id = 0;
        updatedItems[index].unit_price = 0;
        updatedItems[index].total_price = 0;
      }
    }

    setItems(updatedItems);
  };

  const loadInvoiceItems = async () => {
    if (selectedInvoices.size === 0) return;

    setLoadingInvoiceItems(true);
    try {
      const allItems: CreditNoteItem[] = [];
      const newAvailableProducts = new Map<number, any[]>();
      
      // Load items from all selected invoices with credited quantities
      for (const invoiceId of selectedInvoices) {
        // Fetch invoice items with credited quantities
        const creditedResponse = await creditNoteService.getInvoiceItemsWithCreditedQuantities(invoiceId);
        
        if (creditedResponse.success && creditedResponse.data && creditedResponse.data.length > 0) {
          // Store available products with credited quantities
          newAvailableProducts.set(invoiceId, creditedResponse.data);
          
          // Convert invoice items to credit note items, using remaining quantity
          const creditNoteItems: CreditNoteItem[] = creditedResponse.data
            .filter((item: any) => item.remaining_quantity > 0) // Only include items with remaining quantity
            .map((item: any) => ({
              product_id: item.product_id,
              invoice_id: invoiceId,
              quantity: item.remaining_quantity, // Use remaining quantity as default
              unit_price: Number(item.unit_price) || 0,
              total_price: item.remaining_quantity * (Number(item.unit_price) || 0),
              condition: undefined, // Will be set by user
              return_store_id: null, // Will be set based on condition
              original_quantity: item.original_quantity,
              credited_quantity: item.credited_quantity,
              remaining_quantity: item.remaining_quantity
            }));
          
          allItems.push(...creditNoteItems);
        } else {
          // Fallback to regular invoice items if new endpoint fails
          const response = await invoiceService.getById(invoiceId);
          
          if (response.success && response.data && response.data.items) {
            // Store available products for this invoice
            newAvailableProducts.set(invoiceId, response.data.items);
            
            // Convert invoice items to credit note items
            const creditNoteItems: CreditNoteItem[] = response.data.items.map((item: any) => ({
              product_id: item.product_id,
              invoice_id: invoiceId,
              quantity: Number(item.quantity) || 0,
              unit_price: Number(item.unit_price) || 0,
              total_price: Number(item.total_price) || 0,
              condition: undefined,
              return_store_id: null,
              original_quantity: Number(item.quantity) || 0,
              credited_quantity: 0,
              remaining_quantity: Number(item.quantity) || 0
            }));
            
            allItems.push(...creditNoteItems);
          }
        }
      }
      
      setAvailableProducts(newAvailableProducts);
      
      if (allItems.length > 0) {
        setItems(allItems);
      } else {
        // Fallback to generic items if no items found
        const fallbackItems: CreditNoteItem[] = Array.from(selectedInvoices).map(invoiceId => {
          const invoice = customerInvoices.find(inv => inv.id === invoiceId);
          return {
            product_id: 0,
            invoice_id: invoiceId,
            quantity: 1,
            unit_price: Number(invoice?.total_amount) || 0,
            total_price: Number(invoice?.total_amount) || 0,
            condition: undefined,
            return_store_id: null
          };
        });
        setItems(fallbackItems);
      }
    } catch (error) {
      console.error('Error loading invoice items:', error);
      // Fallback to generic items on error
      const fallbackItems: CreditNoteItem[] = Array.from(selectedInvoices).map(invoiceId => {
        const invoice = customerInvoices.find(inv => inv.id === invoiceId);
        return {
          product_id: 0,
          invoice_id: invoiceId,
          quantity: 1,
          unit_price: Number(invoice?.total_amount) || 0,
          total_price: Number(invoice?.total_amount) || 0,
          condition: undefined,
          return_store_id: null
        };
      });
      setItems(fallbackItems);
    } finally {
      setLoadingInvoiceItems(false);
    }
  };

  const TAX_RATE = 0.16;
  const TAX_DIVISOR = 1 + TAX_RATE;

  // Helper function to check if a product-invoice combination is already credited
  const isProductInvoiceCredited = (productId: number, invoiceId: number, excludeIndex?: number) => {
    return items.some((item, index) => 
      excludeIndex !== undefined ? 
        (index !== excludeIndex && item.product_id === productId && item.invoice_id === invoiceId) :
        (item.product_id === productId && item.invoice_id === invoiceId)
    );
  };

  // Helper function to get count of uncredited products
  const getUncreditedProductsCount = () => {
    let totalUncredited = 0;
    for (const [invoiceId, products] of availableProducts.entries()) {
      const uncreditedProducts = products.filter(product => 
        !isProductInvoiceCredited(product.product_id, invoiceId)
      );
      totalUncredited += uncreditedProducts.length;
    }
    return totalUncredited;
  };

  const calculateNet = (price: number) => price / TAX_DIVISOR;
  const calculateTax = (price: number) => price - calculateNet(price);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + calculateNet(item.total_price), 0);
  };

  const calculateTaxTotal = () => {
    return items.reduce((sum, item) => sum + calculateTax(item.total_price), 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearch.toLowerCase();
    const name = (customer.name || '').toLowerCase();
    const companyName = (customer.company_name || '').toLowerCase();
    const customerCode = (customer.customer_code || '').toLowerCase();
    const contact = (customer.contact || customer.contact_person || '').toLowerCase();
    const email = (customer.email || '').toLowerCase();
    
    return name.includes(searchLower) ||
           companyName.includes(searchLower) ||
           customerCode.includes(searchLower) ||
           contact.includes(searchLower) ||
           email.includes(searchLower);
  });

  // Get selected customer display name
  const selectedCustomerName = customers.find(c => c.id === parseInt(clientId)) 
    ? (customers.find(c => c.id === parseInt(clientId))?.name || 
       customers.find(c => c.id === parseInt(clientId))?.company_name || 
       customers.find(c => c.id === parseInt(clientId))?.customer_code || 
       '')
    : '';

  // Get display customers (filtered or all)
  const displayCustomers = customerSearch ? filteredCustomers : customers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      setError('Please select a customer');
      return;
    }

    if (selectedInvoices.size === 0) {
      setError('Please select at least one invoice');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    if (items.some(item => item.product_id === 0)) {
      setError('Please select products for all items');
      return;
    }

    if (items.some(item => item.invoice_id === 0)) {
      setError('Please select invoices for all items');
      return;
    }

    // Validate that quantities don't exceed remaining quantities
    for (const item of items) {
      const invoiceProducts = availableProducts.get(item.invoice_id);
      if (invoiceProducts) {
        const invoiceProduct = invoiceProducts.find(p => p.product_id === item.product_id);
        if (invoiceProduct) {
          const remainingQty = invoiceProduct.remaining_quantity !== undefined 
            ? invoiceProduct.remaining_quantity 
            : (Number(invoiceProduct.quantity) || 0);
          
          if (item.quantity > remainingQty) {
            setError(`Quantity for product ${invoiceProduct.product_name || 'Unknown'} cannot exceed ${remainingQty} (remaining quantity available for credit)`);
            return;
          }
        }
      }
    }

    // Validate no duplicate product-invoice combinations
    const productInvoiceCombinations = new Set<string>();
    for (const item of items) {
      const combination = `${item.product_id}-${item.invoice_id}`;
      if (productInvoiceCombinations.has(combination)) {
        setError('Duplicate product-invoice combination detected. Each product from each invoice can only be credited once.');
        return;
      }
      productInvoiceCombinations.add(combination);
    }

    // Validate that all items have a condition selected
    if (items.some(item => !item.condition)) {
      setError('Please select a condition (good or damaged) for all items');
      return;
    }

    // Validate that all items have a return store assigned
    if (items.some(item => !item.return_store_id)) {
      setError('Some items are missing return store assignment. Please ensure all items have a condition selected.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const creditNoteData = {
        customer_id: parseInt(clientId),
        credit_note_date: creditNoteDate,
        reason: reason || undefined,
        original_invoice_ids: Array.from(selectedInvoices),
        items: items
      };

      const response = await creditNoteService.create(creditNoteData);
      
      if (response.success) {
        setSuccess(`Credit note ${response.data.credit_note_number} created successfully!`);
        // Reset form
        setClientId('');
        setCreditNoteDate(new Date().toISOString().split('T')[0]);
        setReason('');
        setSelectedInvoices(new Set());
        setItems([]);
        setCustomerInvoices([]);
        setAvailableProducts(new Map());
        setCustomerSearch('');
        setShowCustomerDropdown(false);
        setSelectedCustomerIndex(-1);
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
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
              <div className="w-full px-6 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
                          <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Credit Note</h1>
                <p className="text-sm text-gray-500">Generate a credit note for a client from multiple invoices - only products and quantities from selected invoices are allowed</p>
              </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Customer Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer *
          </label>
          <div className="relative w-full max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={clientId ? selectedCustomerName : customerSearch}
            onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowCustomerDropdown(true);
                setSelectedCustomerIndex(-1);
                if (!e.target.value) {
                  setClientId('');
              setSelectedInvoices(new Set());
              setItems([]);
                }
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              onBlur={() => {
                // Delay to allow click events on dropdown items
                setTimeout(() => setShowCustomerDropdown(false), 200);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedCustomerIndex(prev => 
                    prev < Math.min(displayCustomers.length - 1, 9) ? prev + 1 : prev
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedCustomerIndex(prev => prev > 0 ? prev - 1 : -1);
                } else if (e.key === 'Enter' && selectedCustomerIndex >= 0) {
                  e.preventDefault();
                  const customer = displayCustomers[selectedCustomerIndex];
                  if (customer) {
                    setClientId(customer.id.toString());
                    setCustomerSearch(customer.name || customer.company_name || customer.customer_code || '');
                    setShowCustomerDropdown(false);
                    setSelectedCustomerIndex(-1);
                    setSelectedInvoices(new Set());
                    setItems([]);
                  }
                } else if (e.key === 'Escape') {
                  setShowCustomerDropdown(false);
                  setSelectedCustomerIndex(-1);
                }
              }}
              placeholder="Search customers by name, code, contact, or email..."
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
            required
            />
            {clientId && (
              <button
                type="button"
                onClick={() => {
                  setClientId('');
                  setCustomerSearch('');
                  setShowCustomerDropdown(false);
                  setSelectedInvoices(new Set());
                  setItems([]);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            
            {/* Search Results Dropdown */}
            {showCustomerDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {customerSearch ? (
                  // Show filtered results
                  filteredCustomers.length > 0 ? (
                    filteredCustomers.slice(0, 10).map((customer, index) => {
                      const displayName = customer.name || customer.company_name || customer.customer_code || `Customer ${customer.id}`;
                      return (
                        <div
                          key={customer.id}
                          className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                            index === selectedCustomerIndex ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            setClientId(customer.id.toString());
                            setCustomerSearch(customer.name || customer.company_name || customer.customer_code || '');
                            setShowCustomerDropdown(false);
                            setSelectedCustomerIndex(-1);
                            setSelectedInvoices(new Set());
                            setItems([]);
                          }}
                        >
                          <div className="font-medium text-sm text-gray-900">{displayName}</div>
                          {customer.contact || customer.contact_person ? (
                            <div className="text-sm text-gray-500 mt-1">Contact: {customer.contact || customer.contact_person}</div>
                          ) : null}
                          {customer.email ? (
                            <div className="text-sm text-gray-500">Email: {customer.email}</div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No customers found</div>
                  )
                ) : (
                  // Show first 10 customers when no search
                  <>
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                      Type to search or select from customers:
                    </div>
                    {customers.slice(0, 10).map((customer, index) => {
                      const displayName = customer.name || customer.company_name || customer.customer_code || `Customer ${customer.id}`;
                      return (
                        <div
                          key={customer.id}
                          className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                            index === selectedCustomerIndex ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            setClientId(customer.id.toString());
                            setCustomerSearch(customer.name || customer.company_name || customer.customer_code || '');
                            setShowCustomerDropdown(false);
                            setSelectedCustomerIndex(-1);
                            setSelectedInvoices(new Set());
                            setItems([]);
                          }}
                        >
                          <div className="font-medium text-sm text-gray-900">{displayName}</div>
                          {customer.contact || customer.contact_person ? (
                            <div className="text-sm text-gray-500 mt-1">Contact: {customer.contact || customer.contact_person}</div>
                          ) : null}
                          {customer.email ? (
                            <div className="text-sm text-gray-500">Email: {customer.email}</div>
                          ) : null}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Customer Information Display */}
          {clientId && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              {(() => {
                const selectedCustomer = customers.find(c => c.id === parseInt(clientId));
                return selectedCustomer ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {selectedCustomer.name || selectedCustomer.company_name || selectedCustomer.customer_code || `Customer ${selectedCustomer.id}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Contact:</span>
                      <span className="ml-2 text-gray-700">
                        {selectedCustomer.contact_person || selectedCustomer.contact || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-700">
                        {selectedCustomer.email || '-'}
                      </span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Two Panel Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Panel - Invoices List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 xl:col-span-1">
            <div className="px-4 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-blue-600" />
                Available Invoices
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Select multiple invoices to include in the credit note. Only products and quantities from these invoices can be used.
              </p>
              {clientId && customerInvoices && Array.isArray(customerInvoices) && customerInvoices.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-700">
                      <span className="font-medium">Total Available Credit:</span>
                      <span className="ml-2 text-lg font-bold">
                        {(customerInvoices && Array.isArray(customerInvoices) ? customerInvoices.reduce((sum, inv) => sum + (Number(inv.remaining_amount) || 0), 0) : 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-blue-600">
                      {(customerInvoices && Array.isArray(customerInvoices) ? customerInvoices.length : 0)} invoice{(customerInvoices && Array.isArray(customerInvoices) && customerInvoices.length !== 1) ? 's' : ''} available
                    </div>
                  </div>
                </div>
              )}
              {selectedInvoices.size > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-green-700">
                      <span className="font-medium">Selected Invoices:</span>
                      <span className="ml-2 text-lg font-bold">
                        {selectedInvoices.size} invoice{selectedInvoices.size !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedInvoices(new Set())}
                      className="text-sm text-green-600 hover:text-green-800 underline"
                    >
                      Clear Selection
                    </button>
                  </div>
                  
                  {/* Products Summary */}
                  {(() => {
                    const totalAvailableProducts = Array.from(availableProducts.values()).reduce((total, products) => total + products.length, 0);
                    const totalCreditedProducts = items.length;
                    const uncreditedProducts = getUncreditedProductsCount();
                    
                    return (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <div className="grid grid-cols-3 gap-6 text-sm">
                          <div className="text-center">
                            <div className="text-green-600 font-medium">Total Products</div>
                            <div className="text-lg font-bold text-green-700">{totalAvailableProducts}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-orange-600 font-medium">Credited</div>
                            <div className="text-lg font-bold text-orange-700">{totalCreditedProducts}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-600 font-medium">Available</div>
                            <div className="text-lg font-bold text-blue-700">{uncreditedProducts}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            
            {/* Search and Filter */}
            {clientId && customerInvoices && Array.isArray(customerInvoices) && customerInvoices.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search invoices by number or date..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                </div>
              </div>
            )}
            
            <div className="p-4">
              {!clientId ? (
                 <div className="text-center py-12">
                   <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                   <p className="text-gray-500 text-sm">Please select a customer first</p>
                 </div>
               ) : loading ? (
                 <div className="text-center py-8">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                   <p className="text-gray-500 text-sm">Loading customer invoices...</p>
                 </div>
               ) : !customerInvoices || !Array.isArray(customerInvoices) || customerInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No invoices available for this customer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(customerInvoices && Array.isArray(customerInvoices) ? customerInvoices : []).map((invoice) => (
                    <div
                      key={invoice.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedInvoices.has(invoice.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => handleInvoiceSelect(invoice.id)}
                          className="mt-1 flex-shrink-0"
                        >
                          {selectedInvoices.has(invoice.id) ? (
                            <CheckSquare className="h-5 w-5 text-green-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-sm font-medium text-gray-900">
                              {invoice.invoice_number}
                            </h3>
                            <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                              Active
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Invoice Date</p>
                              <p className="text-gray-700 font-medium">
                                {new Date(invoice.invoice_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Due Date</p>
                              <p className="text-gray-700 font-medium">
                                {new Date(invoice.due_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Total Amount</p>
                              <p className="text-gray-900 font-semibold">
                                {(Number(invoice.total_amount) || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Credited</p>
                              <p className="text-orange-600 font-medium">
                                {(Number(invoice.credited_amount) || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Remaining</p>
                              <p className="text-green-600 font-semibold">
                                {(Number(invoice.remaining_amount) || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          {invoice.notes && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-500">Notes:</p>
                              <p className="text-sm text-gray-600 italic">{invoice.notes}</p>
                            </div>
                          )}
                          
                          {/* Show credited products for this invoice */}
                          {(() => {
                            const invoiceProducts = availableProducts.get(invoice.id) || [];
                            const creditedProducts = items.filter(item => item.invoice_id === invoice.id);
                            const uncreditedProducts = invoiceProducts.filter(product => 
                              !isProductInvoiceCredited(product.product_id, invoice.id)
                            );
                            
                            if (creditedProducts.length > 0 || uncreditedProducts.length > 0) {
                              return (
                                <div className="mt-3 p-2 bg-gray-50 rounded border">
                                  <div className="text-xs text-gray-500 mb-1">Products Status:</div>
                                  <div className="space-y-1">
                                    {creditedProducts.length > 0 && (
                                      <div className="text-xs text-orange-600">
                                        <span className="font-medium">Credited:</span> {creditedProducts.length} product{creditedProducts.length !== 1 ? 's' : ''}
                                      </div>
                                    )}
                                    {uncreditedProducts.length > 0 && (
                                      <div className="text-xs text-green-600">
                                        <span className="font-medium">Available:</span> {uncreditedProducts.length} product{uncreditedProducts.length !== 1 ? 's' : ''}
                                      </div>
                                    )}
                                    {uncreditedProducts.length === 0 && creditedProducts.length > 0 && (
                                      <div className="text-xs text-red-600 font-medium">
                                        All products from this invoice have been credited
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">Available for Credit</div>
                            <div className="text-base font-bold text-green-600">
                              {(Number(invoice.remaining_amount) || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Credit Note Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 xl:col-span-2">
            <div className="px-4 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Credit Note Details
              </h2>
              {selectedInvoices.size > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Creating credit note from {selectedInvoices.size} selected invoice{selectedInvoices.size !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter the reason for this credit note..."
                />
              </div>

              {/* Invoice Items Loading Indicator */}
              {loadingInvoiceItems && (
                <div className="flex items-center justify-center p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-700 text-base">Loading invoice items...</span>
                </div>
              )}

              {/* Items Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Credit Note Items</h3>
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const totalAvailableProducts = Array.from(availableProducts.values()).reduce((total, products) => total + products.length, 0);
                      const totalCreditedProducts = items.length;
                      const uncreditedProducts = getUncreditedProductsCount();
                      
                      return (
                        <div className="text-sm text-gray-500">
                          {uncreditedProducts > 0 ? (
                            <span className="text-green-600 font-medium">{uncreditedProducts} product{uncreditedProducts !== 1 ? 's' : ''} available to credit</span>
                          ) : (
                            <span className="text-red-600 font-medium">All products already credited</span>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {totalCreditedProducts} of {totalAvailableProducts} products used
                          </div>
                        </div>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={addItem}
                      disabled={(() => {
                        const uncreditedProducts = getUncreditedProductsCount();
                        return selectedInvoices.size === 0 || uncreditedProducts === 0;
                      })()}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      title={(() => {
                        if (selectedInvoices.size === 0) return 'Please select at least one invoice first';
                        const uncreditedProducts = getUncreditedProductsCount();
                        if (uncreditedProducts === 0) return 'All available products have already been added to the credit note';
                        return `Add a product from selected invoices (${uncreditedProducts} available)`;
                      })()}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Item
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">
                      {selectedInvoices.size > 0 ? 'Select invoices to load items' : 'No invoices selected'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => {
                      const invoiceProducts = availableProducts.get(item.invoice_id);
                      const availableProductsForInvoice = invoiceProducts || [];
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Invoice
                              </label>
                              <select
                                value={item.invoice_id}
                                onChange={(e) => updateItem(index, 'invoice_id', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                required
                              >
                                <option value={0}>Select invoice</option>
                                {Array.from(selectedInvoices).map((invoiceId) => {
                                  const invoice = customerInvoices.find(inv => inv.id === invoiceId);
                                  return (
                                    <option key={invoiceId} value={invoiceId}>
                                      {invoice?.invoice_number || `Invoice ${invoiceId}`}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            <div>
                              <label className="block text-base font-medium text-gray-700 mb-2">
                                Product *
                              </label>
                              <select
                                value={item.product_id}
                                onChange={(e) => updateItem(index, 'product_id', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                required
                              >
                                <option value={0}>Select a product</option>
                                {availableProductsForInvoice.map((product) => {
                                  const isAlreadyCredited = isProductInvoiceCredited(product.product_id, item.invoice_id, index);
                                  const remainingQty = product.remaining_quantity !== undefined 
                                    ? product.remaining_quantity 
                                    : (product.original_quantity !== undefined 
                                      ? (product.original_quantity - (product.credited_quantity || 0))
                                      : Number(product.quantity) || 0);
                                  
                                  return (
                                    <option 
                                      key={product.product_id} 
                                      value={product.product_id}
                                      disabled={isAlreadyCredited || remainingQty <= 0}
                                    >
                                      {product.product_name || `Product ${product.product_id}`}
                                      {remainingQty > 0 
                                        ? ` (Remaining: ${remainingQty.toFixed(2)})` 
                                        : ' (Fully credited)'}
                                      {isAlreadyCredited ? ' (In this credit note)' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            <div>
                              <label className="block text-base font-medium text-gray-700 mb-2">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={(() => {
                                  const selectedProduct = availableProductsForInvoice.find(p => p.product_id === item.product_id);
                                  if (selectedProduct) {
                                    return selectedProduct.remaining_quantity !== undefined 
                                      ? selectedProduct.remaining_quantity 
                                      : Number(selectedProduct.quantity) || 0;
                                  }
                                  return 0;
                                })()}
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                              {(() => {
                                const selectedProduct = availableProductsForInvoice.find(p => p.product_id === item.product_id);
                                if (selectedProduct && (selectedProduct.credited_quantity !== undefined || selectedProduct.original_quantity !== undefined)) {
                                  const originalQty = selectedProduct.original_quantity !== undefined ? selectedProduct.original_quantity : Number(selectedProduct.quantity) || 0;
                                  const creditedQty = selectedProduct.credited_quantity || 0;
                                  const remainingQty = selectedProduct.remaining_quantity !== undefined ? selectedProduct.remaining_quantity : (originalQty - creditedQty);
                                  
                                  return (
                                    <div className="text-xs mt-1 space-y-1">
                                      <p className="text-gray-500">
                                        Max: <span className="font-medium text-green-600">{remainingQty.toFixed(2)}</span>
                                      </p>
                                      <p className="text-gray-400">
                                        Original: {originalQty.toFixed(2)} | 
                                        Credited: <span className="text-orange-600">{creditedQty.toFixed(2)}</span> | 
                                        Remaining: <span className="text-green-600 font-medium">{remainingQty.toFixed(2)}</span>
                                      </p>
                                    </div>
                                  );
                                }
                                return (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Max: {(() => {
                                      const selectedProduct = availableProductsForInvoice.find(p => p.product_id === item.product_id);
                                      return selectedProduct ? Number(selectedProduct.quantity) : 0;
                                    })()}
                                  </p>
                                );
                              })()}
                            </div>

                            <div>
                              <label className="block text-base font-medium text-gray-700 mb-2">
                                Condition *
                              </label>
                              <select
                                value={item.condition || ''}
                                onChange={(e) => updateItem(index, 'condition', e.target.value || undefined)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                required
                              >
                                <option value="">Select condition</option>
                                <option value="good">Good</option>
                                <option value="damaged">Damaged</option>
                              </select>
                              {item.condition && item.return_store_id && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Return to: {(() => {
                                    const store = stores.find(s => s.id === item.return_store_id);
                                    return store ? store.store_name : 'Unknown store';
                                  })()}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-base font-medium text-gray-700 mb-2">
                                Unit Price
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-base font-medium text-gray-700 mb-2">
                                Total Price
                              </label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm">
                                {(Number(item.total_price) || 0).toFixed(2)}
                              </div>
                            </div>

                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Totals */}
              {items.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Credit Note Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Subtotal (Net):</span>
                      <span className="text-sm font-medium">{(Number(calculateSubtotal()) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tax (16%):</span>
                      <span className="text-sm font-medium">{(Number(calculateTaxTotal()) || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2">
                      <div className="flex justify-between">
                        <span className="text-base font-semibold text-gray-900">Total Credit Amount:</span>
                        <span className="text-base font-semibold text-gray-900">{(Number(calculateTotal()) || 0).toFixed(2)}</span>
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
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || items.length === 0 || selectedInvoices.size === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCreditNotePage; 