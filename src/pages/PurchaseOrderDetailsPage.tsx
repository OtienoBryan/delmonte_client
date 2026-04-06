import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { purchaseOrdersService, suppliersService, productsService } from '../services/financialService';
import { storeService } from '../services/storeService';
import { PurchaseOrder, InventoryReceipt, Store, ReceiveItemsForm, CreatePurchaseOrderForm, Supplier, Product } from '../types/financial';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, MoreVertical, FileText } from 'lucide-react';

type PurchaseOrderWithReceipts = PurchaseOrder & { receipts?: InventoryReceipt[] };

type ReceivingItem = {
  product_id: number;
  received_quantity: number;
  unit_cost: number;
  product_name?: string;
  product_code?: string;
  max_quantity: number;
};

const PurchaseOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const pdfRef = useRef<HTMLDivElement>(null);
  
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderWithReceipts | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | ''>('');
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [notes, setNotes] = useState('');
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<CreatePurchaseOrderForm | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Helper function to calculate tax-exclusive unit price
  const getTaxExclusivePrice = (taxInclusivePrice: number, taxType: string = '16%'): number => {
    const taxRate = taxType === '16%' ? 0.16 : 0;
    return taxInclusivePrice / (1 + taxRate);
  };

  // Helper function to calculate tax amount for a line item
  const getTaxAmount = (taxInclusivePrice: number, quantity: number, taxType: string = '16%'): number => {
    const taxExclusivePrice = getTaxExclusivePrice(taxInclusivePrice, taxType);
    return (taxInclusivePrice - taxExclusivePrice) * quantity;
  };

  useEffect(() => {
    const fetchData = async () => {
      const suppliersRes = await suppliersService.getAll();
      if (suppliersRes.success && suppliersRes.data) setSuppliers(suppliersRes.data);

      const productsRes = await productsService.getAll();
      if (productsRes.success && productsRes.data) setProducts(productsRes.data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (id) {
      fetchPurchaseOrder();
      fetchStores();
    }
  }, [id]);

  useEffect(() => {
    if (editMode && purchaseOrder) {
      setEditForm({
        supplier_id: purchaseOrder.supplier_id,
        order_date: purchaseOrder.order_date.split('T')[0],
        expected_delivery_date: purchaseOrder.expected_delivery_date?.split('T')[0] || '',
        notes: purchaseOrder.notes || '',
        items: purchaseOrder.items?.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          // Convert tax-inclusive price to tax-exclusive for editing
          unit_price: getTaxExclusivePrice(item.unit_price)
        })) || []
      });
    }
  }, [editMode, purchaseOrder]);

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

  const initializeReceivingItems = (po: any) => {
    const items = po.items?.map((item: any) => {
      // Get product name from API response (directly on item) or lookup
      const productName = item.product_name || 
                         item.product?.product_name || 
                         products.find((p: any) => Number(p.id) === Number(item.product_id))?.product_name ||
                         `Product ${item.product_id}`;
      const productCode = item.product_code || 
                         item.product?.product_code || 
                         products.find((p: any) => Number(p.id) === Number(item.product_id))?.product_code ||
                         '';
      return {
        product_id: item.product_id,
        received_quantity: 0,
        unit_cost: getTaxExclusivePrice(item.unit_price), // Use tax-exclusive price for inventory
        product_name: productName,
        product_code: productCode,
        max_quantity: item.quantity - (item.received_quantity || 0)
      };
    }) || [];
    setReceivingItems(items);
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

  const handleReceiveSubmit = async (e: React.FormEvent) => {
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
        parseInt(id!),
        receiveData
      );

      if (response.success) {
        alert('Items received successfully!');
        setShowReceiveForm(false);
        setSelectedStore('');
        setNotes('');
        // Refresh the purchase order data
        fetchPurchaseOrder();
      } else {
        setError(response.error || 'Failed to receive items');
      }
    } catch (err) {
      setError('Failed to receive items');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrdersService.getWithReceipts(parseInt(id!));
      if (response.success) {
        setPurchaseOrder(response.data);
        // Initialize receiving items after products are loaded
        if (products.length > 0 || response.data?.items) {
          initializeReceivingItems(response.data);
        }
      } else {
        setError(response.error || 'Failed to fetch purchase order');
      }
    } catch (err) {
      setError('Failed to fetch purchase order');
    } finally {
      setLoading(false);
    }
  };

  // Re-initialize receiving items when products are loaded or purchase order changes
  useEffect(() => {
    if (purchaseOrder && products.length > 0 && !showReceiveForm) {
      initializeReceivingItems(purchaseOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, purchaseOrder?.id]);

  const handleSendPO = async () => {
    if (!id) return;
    try {
      setSubmitting(true);
      await purchaseOrdersService.updateStatus(parseInt(id), 'sent');
      await fetchPurchaseOrder();
    } catch (err) {
      alert('Failed to send purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFormChange = (field: string, value: any) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  const handleEditItemChange = (index: number, field: string, value: any) => {
    if (!editForm) return;
    const items = [...editForm.items];
    
    if (field === 'unit_price') {
      // Convert tax-exclusive price to tax-inclusive for storage
      const taxInclusivePrice = value * 1.16; // Assuming 16% tax rate
      items[index] = { ...items[index], [field]: taxInclusivePrice };
    } else {
    items[index] = { ...items[index], [field]: value };
    }
    
    setEditForm({ ...editForm, items });
  };

  const handleAddEditItem = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      items: [...editForm.items, { product_id: 0, quantity: 1, unit_price: 0 }]
    });
  };

  const handleRemoveEditItem = (index: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      items: editForm.items.filter((_, i) => i !== index)
    });
  };

  const handleSaveEdit = async () => {
    if (!id || !editForm) return;
    try {
      setSubmitting(true);
      await purchaseOrdersService.update(parseInt(id), editForm);
      await fetchPurchaseOrder();
      setEditMode(false);
    } catch (err) {
      alert('Failed to save changes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditForm(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent' },
      received: { color: 'bg-green-100 text-green-800', label: 'Received' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  // Add this handler for canceling the PO
  const handleCancelPO = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to cancel this purchase order? This action cannot be undone.')) return;
    try {
      setSubmitting(true);
      await purchaseOrdersService.updateStatus(parseInt(id), 'cancelled');
      await fetchPurchaseOrder();
    } catch (err) {
      alert('Failed to cancel purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!pdfRef.current || !purchaseOrder) return;
    
    try {
      setGeneratingPdf(true);
      const element = pdfRef.current;
      
      // PDF will only capture the content inside pdfRef
      
      // Create canvas from the element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgWidth = pageWidth - 20; // Leave margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Top margin
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20); // Subtract page height minus margins
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
      }
      
      const filename = `purchase_order_${purchaseOrder.po_number || id}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2">
                <h3 className="text-xs font-medium text-red-800">Error</h3>
                <div className="mt-1 text-xs text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h3 className="text-xs font-medium text-gray-900">Purchase Order not found</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-md">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            <div>
                <h1 className="text-sm font-bold text-gray-900">Purchase Order</h1>
                <p className="mt-0.5 text-xs text-gray-600">
                  #{purchaseOrder.po_number} • {getStatusBadge(purchaseOrder.status)}
                </p>
              </div>
            </div>
              <div className="flex space-x-2 relative">
              <Link to="/purchase-orders" className="inline-flex items-center px-2.5 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Back
              </Link>
              <button
                onClick={handleExportPDF}
                disabled={generatingPdf || !purchaseOrder}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Export to PDF"
              >
                <Download className="w-3 h-3 mr-1.5" />
                {generatingPdf ? 'Generating...' : 'Export PDF'}
              </button>
              
              {/* Actions Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="inline-flex items-center px-2.5 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="More actions"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                
                {showActionsMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowActionsMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleExportPDF();
                            setShowActionsMenu(false);
                          }}
                          disabled={generatingPdf || !purchaseOrder}
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          <FileText className="w-3.5 h-3.5 mr-2 text-gray-400" />
                          {generatingPdf ? 'Generating PDF...' : 'Export to PDF'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* Cancel button only if not already cancelled */}
              {purchaseOrder && purchaseOrder.status !== 'cancelled' && (
                <button
                  onClick={handleCancelPO}
                  disabled={submitting}
                  className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Cancelling...' : 'Cancel PO'}
              </button>
              )}
              {purchaseOrder.status === 'received' && (purchaseOrder as any).invoice_number && (
                <Link
                to={`/supplier-invoice/${purchaseOrder.id}`}
                className="text-purple-600 hover:text-purple-900 text-xs font-medium"
                title={`Supplier Invoice ${(purchaseOrder as any).invoice_number}`}
              >
                View Invoice
              </Link>
              )}
              {purchaseOrder.status === 'sent' && (
                <button
                  onClick={() => setShowReceiveForm(!showReceiveForm)}
                  className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {showReceiveForm ? 'Cancel' : 'Receive'}
                </button>
              )}
              {purchaseOrder.status === 'draft' && !editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center px-2.5 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit
                </button>
              )}
              {purchaseOrder.status === 'draft' && editMode && (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex items-center px-2.5 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </>
              )}
              {purchaseOrder.status === 'draft' && (
                <button
                  onClick={handleSendPO}
                  className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={submitting || editMode}
                >
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PDF Content - This is what will be exported */}
        <div ref={pdfRef} className="bg-white p-8 shadow-lg rounded-lg">
          {/* Professional Header */}
          <div className="border-b-2 border-blue-600 pb-6 mb-6">
            <div className="flex justify-between items-start">
              {/* Company Information */}
              <div className="company-info">
                <img
                  src="/woosh.jpg"
                  alt="Company Logo"
                  className="h-16 w-auto object-contain mb-3"
                  style={{ maxWidth: '140px' }}
                />
                <h1 className="text-lg font-bold text-gray-900 mb-1">Moonsun Trade International Limited</h1>
                <p className="text-xs text-gray-600">P.O Box 15470, Nairobi Kenya</p>
                <p className="text-xs text-gray-600">Tax PIN: P051904794X</p>
                <p className="text-xs text-gray-600">Email: info@moonsuntrade.com</p>
              </div>
              
              {/* Purchase Order Details */}
              <div className="text-right">
                <h2 className="text-2xl font-bold text-blue-600 mb-2">PURCHASE ORDER</h2>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <div className="space-y-1">
                    <div className="flex justify-between gap-4">
                      <span className="text-xs font-semibold text-gray-600">PO Number:</span>
                      <span className="text-xs font-bold text-gray-900">{purchaseOrder.po_number}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-xs font-semibold text-gray-600">Date:</span>
                      <span className="text-xs text-gray-900">{formatDate(purchaseOrder.order_date)}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-xs font-semibold text-gray-600">Status:</span>
                      <div>{getStatusBadge(purchaseOrder.status)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase border-b border-gray-300 pb-1">Supplier Information</h3>
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-gray-600 mb-1">Supplier Name:</p>
                  {editMode ? (
                    <select
                      value={editForm?.supplier_id || ''}
                      onChange={e => handleEditFormChange('supplier_id', Number(e.target.value))}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs px-2 py-1"
                    >
                      <option value="">Select supplier...</option>
                      {suppliers.map((s: Supplier) => (
                        <option key={s.id} value={s.id}>{s.company_name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs font-bold text-gray-900">
                      {purchaseOrder.supplier_name ||
                        suppliers.find(s => s.id === purchaseOrder.supplier_id)?.company_name ||
                        'N/A'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-600 mb-1">Expected Delivery:</p>
                  <p className="text-xs text-gray-900">
                    {purchaseOrder.expected_delivery_date ? formatDate(purchaseOrder.expected_delivery_date) : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[10px] font-semibold text-gray-600 mb-1">Supplier Code:</p>
                <p className="text-xs text-gray-900">{purchaseOrder.supplier_code || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Additional Order Information */}
          <div className="mb-6 grid grid-cols-3 gap-4 hidden">
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <p className="text-[10px] font-semibold text-gray-600 mb-1">Created By:</p>
              <p className="text-xs font-medium text-gray-900">{purchaseOrder.created_by_user?.full_name || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <p className="text-[10px] font-semibold text-gray-600 mb-1">Created Date:</p>
              <p className="text-xs font-medium text-gray-900">{formatDate(purchaseOrder.created_at)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <p className="text-[10px] font-semibold text-gray-600 mb-1">Last Updated:</p>
              <p className="text-xs font-medium text-gray-900">{formatDate(purchaseOrder.updated_at)}</p>
            </div>
          </div>

          {purchaseOrder.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase border-b border-gray-300 pb-1">Order Notes</h3>
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                {editMode ? (
                  <textarea
                    value={editForm?.notes || ''}
                    onChange={e => handleEditFormChange('notes', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs px-2 py-1"
                    rows={2}
                  />
                ) : (
                  <p className="text-xs text-gray-700">{purchaseOrder.notes}</p>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase border-b border-gray-300 pb-1">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-r border-blue-500">
                      Item #
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-r border-blue-500">
                      Product
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wide border-r border-blue-500">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide border-r border-blue-500">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide border-r border-blue-500">
                      Tax (16%)
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide">
                      Total
                    </th>
                    {editMode && (
                      <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wide border-l border-blue-500">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {editMode && editForm ? (
                    editForm.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-center text-xs font-medium text-gray-700 border-r border-gray-200">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 border-r border-gray-200">
                          <select
                            value={item.product_id}
                            onChange={e => handleEditItemChange(index, 'product_id', Number(e.target.value))}
                            className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                          >
                            <option value={0}>Select product</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.product_name} ({product.product_code})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center border-r border-gray-200">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => handleEditItemChange(index, 'quantity', Number(e.target.value))}
                            className="border border-gray-300 rounded px-2 py-1 w-20 text-xs text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-right border-r border-gray-200">
                          <input
                            type="number"
                            min={0}
                            value={getTaxExclusivePrice(item.unit_price).toFixed(2)}
                            onChange={e => handleEditItemChange(index, 'unit_price', Number(e.target.value))}
                            className="border border-gray-300 rounded px-2 py-1 w-24 text-xs text-right"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-700 border-r border-gray-200">
                          {formatCurrency(getTaxAmount(item.unit_price, item.quantity))}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </td>
                        <td className="px-4 py-3 text-center border-l border-gray-200">
                          <button 
                            type="button" 
                            onClick={() => handleRemoveEditItem(index)} 
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    purchaseOrder.items?.map((item, index) => {
                      const productName = (item as any).product_name || 
                                         item.product?.product_name || 
                                         products.find(p => Number(p.id) === Number(item.product_id))?.product_name ||
                                         `Product ${item.product_id}`;
                      const productCode = (item as any).product_code ||
                                         item.product?.product_code ||
                                         products.find(p => Number(p.id) === Number(item.product_id))?.product_code ||
                                         '';
                      return (
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-center text-xs font-medium text-gray-700 border-r border-gray-200">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200">
                            <div className="text-xs font-semibold text-gray-900">{productName}</div>
                            {productCode && (
                              <div className="text-[10px] text-gray-600 mt-0.5">Code: {productCode}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-xs font-medium text-gray-900 border-r border-gray-200">
                            {item.quantity.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-gray-900 border-r border-gray-200">
                            {formatCurrency(getTaxExclusivePrice(item.unit_price))}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-gray-700 border-r border-gray-200">
                            {formatCurrency(getTaxAmount(item.unit_price, item.quantity))}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-bold text-gray-900">
                            {formatCurrency(item.total_price)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {editMode && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={7} className="px-4 py-3">
                        <button 
                          type="button" 
                          onClick={handleAddEditItem} 
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          + Add Item
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Order Totals - Professional Summary */}
          <div className="flex justify-end mt-6 mb-6">
            <div className="w-80 border-2 border-blue-600 rounded-md overflow-hidden">
              <div className="bg-blue-600 px-4 py-2">
                <h3 className="text-sm font-bold text-white text-center">ORDER SUMMARY</h3>
              </div>
              <div className="bg-white p-4 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-700">Subtotal:</span>
                  <span className="text-xs font-bold text-gray-900">{formatCurrency(purchaseOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-700">Tax (16%):</span>
                  <span className="text-xs font-bold text-gray-900">{formatCurrency(purchaseOrder.tax_amount)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 bg-blue-50 -mx-4 px-4 py-3 rounded">
                  <span className="text-sm font-bold text-blue-900">TOTAL AMOUNT:</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(purchaseOrder.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-gray-300">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-gray-600 mb-4">Terms & Conditions:</p>
                <p className="text-[9px] text-gray-500">• Payment due within 30 days of delivery</p>
                <p className="text-[9px] text-gray-500">• All items subject to inspection upon delivery</p>
                <p className="text-[9px] text-gray-500">• Please reference PO number on all correspondence</p>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <p className="text-[10px] text-gray-600 mb-1">Authorized Signature:</p>
                  <div className="border-b border-gray-400 w-40 h-8"></div>
                </div>
                <p className="text-[9px] text-gray-500">{purchaseOrder.created_by_user?.full_name || 'N/A'}</p>
                <p className="text-[9px] text-gray-500">{formatDate(purchaseOrder.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
        {/* End of PDF Content */}

        {/* Receive Items Form - Outside PDF content since it's interactive */}
        {showReceiveForm && (purchaseOrder.status === 'sent') && (
          <div className="bg-white shadow-sm rounded-md p-3 mb-3 border border-gray-200">
            <div className="flex items-center mb-2">
              <div className="p-1.5 bg-green-100 rounded-md mr-2">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-xs font-bold text-gray-900">Receive Items</h2>
            </div>
            
            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded-md p-2">
                <div className="flex items-center">
                  <svg className="w-3.5 h-3.5 text-red-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs font-medium text-red-700">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleReceiveSubmit}>
              {/* Store Selection */}
              <div className="mb-3">
                <label htmlFor="store" className="block text-[10px] font-medium text-gray-700 mb-1.5">
                  Select Store *
                </label>
                <select
                  id="store"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value ? parseInt(e.target.value) : '')}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs px-2.5 py-1.5 border transition-all duration-200"
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
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <div className="p-1.5 bg-blue-100 rounded-md mr-2">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-bold text-gray-900">Items to Receive</h3>
                </div>
                
                <div className="grid gap-2">
                      {receivingItems.map((item, index) => (
                    <div key={item.product_id} className="bg-blue-50 rounded-md p-2.5 border border-blue-100 hover:shadow-sm transition-all duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 items-center">
                        {/* Product Info */}
                        <div className="md:col-span-2">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-white rounded-md shadow-sm">
                              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-900">
                                {item.product_name ||
                                  products.find((p: any) => Number(p.id) === Number(item.product_id))?.product_name ||
                                  `Product ${item.product_id}`}
                              </div>
                              <div className="text-[10px] text-gray-600 font-medium">
                                Code: {item.product_code ||
                                  products.find((p: any) => Number(p.id) === Number(item.product_id))?.product_code ||
                                  'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Remaining Quantity */}
                        <div className="text-center">
                          <div className="text-[9px] text-gray-500 font-medium mb-0.5">Remaining</div>
                          <div className="text-xs font-bold text-blue-600">{item.max_quantity}</div>
                        </div>

                        {/* Receive Quantity Input */}
                        <div className="text-center">
                          <div className="text-[9px] text-gray-500 font-medium mb-1">Receive Qty</div>
                            <input
                              type="number"
                              min="0"
                              max={item.max_quantity}
                              value={item.received_quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                            className="block w-20 mx-auto text-center border border-blue-200 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold transition-all duration-200 px-1.5 py-1"
                              disabled={item.max_quantity === 0}
                            />
                        </div>

                        {/* Unit Cost */}
                        <div className="text-center">
                          <div className="text-[9px] text-gray-500 font-medium mb-0.5">Unit Cost</div>
                          <div className="text-xs font-semibold text-gray-900">{formatCurrency(item.unit_cost)}</div>
                        </div>

                        {/* Total */}
                        <div className="text-center">
                          <div className="text-[9px] text-gray-500 font-medium mb-0.5">Total</div>
                          <div className="text-xs font-bold text-green-600">
                            {formatCurrency(item.received_quantity * item.unit_cost)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {item.max_quantity > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[9px] text-gray-600 mb-0.5">
                            <span>Progress</span>
                            <span>{Math.round((item.received_quantity / item.max_quantity) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 rounded-full transition-all duration-300"
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
              <div className="mb-3">
                <div className="flex items-center mb-1.5">
                  <div className="p-1.5 bg-yellow-100 rounded-md mr-2">
                    <svg className="w-3.5 h-3.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <label htmlFor="notes" className="text-xs font-medium text-gray-900">
                  Notes (Optional)
                </label>
                </div>
                <textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="block w-full border border-blue-200 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs px-2.5 py-1.5 transition-all duration-200"
                  placeholder="Add any notes about this receipt..."
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-md p-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-900">Total Receiving:</span>
                  <span className="text-xs font-bold text-gray-900">
                    {formatCurrency(receivingItems.reduce((total, item) => total + (item.received_quantity * item.unit_cost), 0))}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReceiveForm(false)}
                  className="px-2.5 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <svg className="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || receivingItems.reduce((total, item) => total + item.received_quantity, 0) === 0}
                  className="px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg className="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {submitting ? 'Receiving...' : 'Receive Items'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Receipt History */}
        {purchaseOrder.receipts && purchaseOrder.receipts.length > 0 && (
          <div className="bg-white shadow-sm rounded-md p-3 border border-gray-200">
            <div className="flex items-center mb-2">
              <div className="p-1.5 bg-purple-100 rounded-md mr-2">
                <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xs font-bold text-gray-900">Receipt History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Store
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Received By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrder.receipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {formatDate(receipt.received_at)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div>
                          <div className="text-xs font-medium text-gray-900">
                            {receipt.product_name ||
                              products.find((p: any) => Number(p.id) === Number(receipt.product_id))?.product_name ||
                              `Product ${receipt.product_id}`}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {receipt.product_code ||
                              products.find((p: any) => Number(p.id) === Number(receipt.product_id))?.product_code ||
                              'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {receipt.store_name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {receipt.received_quantity}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {formatCurrency(receipt.unit_cost)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {formatCurrency(receipt.total_cost)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {receipt.received_by_name || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Receive Items Form - Outside PDF content since it's interactive */}
        {showReceiveForm && (purchaseOrder.status === 'sent') && (
          <div className="bg-white shadow-sm rounded-md p-3 mb-3 border border-gray-200">
            <div className="flex items-center mb-2">
              <div className="p-1.5 bg-green-100 rounded-md mr-2">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-xs font-bold text-gray-900">Receive Items</h2>
            </div>
            
            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded-md p-2">
                <div className="flex items-center">
                  <svg className="w-3.5 h-3.5 text-red-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs font-medium text-red-700">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleReceiveSubmit}>
              {/* Store Selection */}
              <div className="mb-3">
                <label htmlFor="store" className="block text-[10px] font-medium text-gray-700 mb-1.5">
                  Select Store *
                </label>
                <select
                  id="store"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value ? parseInt(e.target.value) : '')}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs px-2.5 py-1.5 border transition-all duration-200"
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
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <div className="p-1.5 bg-blue-100 rounded-md mr-2">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-bold text-gray-900">Items to Receive</h3>
                </div>
                
                <div className="grid gap-2">
                  {receivingItems.map((item, index) => (
                    <div key={item.product_id} className="bg-blue-50 rounded-md p-2.5 border border-blue-100 hover:shadow-sm transition-all duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 items-center">
                        {/* Product Info */}
                        <div className="md:col-span-2">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-white rounded-md shadow-sm">
                              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-900">
                                {item.product_name ||
                                  products.find((p: any) => Number(p.id) === Number(item.product_id))?.product_name ||
                                  `Product ${item.product_id}`}
                              </div>
                              <div className="text-[10px] text-gray-600 font-medium">
                                Code: {item.product_code ||
                                  products.find((p: any) => Number(p.id) === Number(item.product_id))?.product_code ||
                                  'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Remaining Quantity */}
                        <div className="text-center">
                          <div className="text-[9px] text-gray-500 font-medium mb-0.5">Remaining</div>
                          <div className="text-xs font-bold text-blue-600">{item.max_quantity}</div>
                        </div>

                        {/* Receive Quantity Input */}
                        <div className="text-center">
                          <div className="text-[9px] text-gray-500 font-medium mb-1">Receive Qty</div>
                          <input
                            type="number"
                            min="0"
                            max={item.max_quantity}
                            value={item.received_quantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                            className="block w-20 mx-auto text-center border border-blue-200 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold transition-all duration-200 px-1.5 py-1"
                            disabled={item.max_quantity === 0}
                          />
                        </div>

                        {/* Unit Cost */}
                        <div className="text-center">
                          <div className="text-[9px] text-gray-500 font-medium mb-0.5">Unit Cost</div>
                          <div className="text-xs font-semibold text-gray-900">{formatCurrency(item.unit_cost)}</div>
                        </div>

                        {/* Total */}
                        <div className="text-center">
                          <div className="text-[9px] text-gray-500 font-medium mb-0.5">Total</div>
                          <div className="text-xs font-bold text-green-600">
                            {formatCurrency(item.received_quantity * item.unit_cost)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {item.max_quantity > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[9px] text-gray-600 mb-0.5">
                            <span>Progress</span>
                            <span>{Math.round((item.received_quantity / item.max_quantity) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 rounded-full transition-all duration-300"
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
              <div className="mb-3">
                <div className="flex items-center mb-1.5">
                  <div className="p-1.5 bg-yellow-100 rounded-md mr-2">
                    <svg className="w-3.5 h-3.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <label htmlFor="notes" className="text-xs font-medium text-gray-900">
                    Notes (Optional)
                  </label>
                </div>
                <textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="block w-full border border-blue-200 rounded-md shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs px-2.5 py-1.5 transition-all duration-200"
                  placeholder="Add any notes about this receipt..."
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-md p-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-900">Total Receiving:</span>
                  <span className="text-xs font-bold text-gray-900">
                    {formatCurrency(receivingItems.reduce((total, item) => total + (item.received_quantity * item.unit_cost), 0))}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReceiveForm(false)}
                  className="px-2.5 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <svg className="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || receivingItems.reduce((total, item) => total + item.received_quantity, 0) === 0}
                  className="px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg className="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {submitting ? 'Receiving...' : 'Receive Items'}
                </button>
              </div>
              </form>
            </div>
          )}
      </div>
    </div>
  );
};

export default PurchaseOrderDetailsPage; 