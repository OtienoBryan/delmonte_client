import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { salesOrdersService } from '../services/financialService';
import { SalesOrder } from '../types/financial';
import axios from 'axios';
import { FileText, X, CreditCard } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface JournalEntry {
  journal_entry_id: number;
  entry_number: string;
  entry_date: string;
  reference: string;
  journal_description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  line_id: number;
  account_id: number;
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  line_description: string;
}

interface PaymentAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: number;
}

const SalesOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalError, setJournalError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [pendingReceiptId, setPendingReceiptId] = useState<number | null>(null);
  const [clientOutstandingBalance, setClientOutstandingBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchSalesOrder();
    }
    // eslint-disable-next-line
  }, [id]);

  const fetchSalesOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await salesOrdersService.getById(Number(id));
      console.log('Sales order fetch response:', res);
      if (res.success && res.data) {
        setSalesOrder(res.data);
        console.log('Sales order status:', res.data.status);
        // Fetch outstanding balance after sales order is loaded
        if (res.data.customer?.id) {
          fetchClientOutstandingBalance(res.data.customer.id);
        }
      } else {
        setError(res.error || 'Failed to fetch sales order');
      }
    } catch (err) {
      setError('Failed to fetch sales order');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const formatCurrency = (amount: number) => amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fetchClientOutstandingBalance = async (customerId?: number) => {
    const clientId = customerId || salesOrder?.customer?.id;
    if (!clientId) return;
    
    setLoadingBalance(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/financial/clients/${clientId}/outstanding-balance`);
      if (response.data.success) {
        setClientOutstandingBalance(response.data.data.outstanding_balance || 0);
      }
    } catch (error) {
      console.error('Error fetching client outstanding balance:', error);
      setClientOutstandingBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchJournalEntries = async () => {
    if (!id) return;

    setJournalLoading(true);
    setJournalError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/journal-entries/invoice/${id}`);
      if (res.data.success) {
        setJournalEntries(res.data.data);
      } else {
        setJournalError(res.data.error || 'Failed to fetch journal entries');
      }
    } catch (err) {
      setJournalError('Failed to fetch journal entries');
    } finally {
      setJournalLoading(false);
    }
  };

  const openJournalModal = () => {
    setShowJournalModal(true);
    fetchJournalEntries();
  };

  const closeJournalModal = () => {
    setShowJournalModal(false);
    setJournalEntries([]);
    setJournalError(null);
  };

  const fetchPaymentAccounts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/financial/accounts/type/9`);
      if (res.data.success) {
        setPaymentAccounts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch payment accounts:', err);
    }
  };

  const openPaymentModal = async () => {
    if (paymentAccounts.length === 0) {
      await fetchPaymentAccounts();
    }
    setPaymentAmount(salesOrder?.total_amount?.toString() || '');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentReference('');
    setPaymentNotes('');
    setSelectedAccount(paymentAccounts.length > 0 ? paymentAccounts[0].id.toString() : '');
    setShowPaymentModal(true);
    setSuccessMsg('');
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedAccount('');
    setPaymentAmount('');
    setPaymentDate('');
    setPaymentReference('');
    setPaymentNotes('');
    setSubmitting(false);
    setSuccessMsg('');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount) {
      setSuccessMsg('Please select a payment account');
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setSuccessMsg('Please enter a valid payment amount');
      return;
    }

    try {
      setSubmitting(true);
      setSuccessMsg('');

      const paymentData = {
        customer_id: salesOrder?.client_id,
        amount: parseFloat(paymentAmount),
        payment_date: paymentDate,
        payment_method: 'bank_transfer',
        notes: paymentNotes,
        account_id: parseInt(selectedAccount),
        reference: paymentReference,
        invoice_id: id
      };

      const res = await axios.post(`${API_BASE_URL}/financial/receivables/payment`, paymentData);

      console.log('Payment response:', res.data);

      if (res.data.success) {
        setSuccessMsg('Payment recorded successfully! Invoice status updated to "in payment".');
        // Store the receipt ID for confirmation
        if (res.data.receipt_id) {
          setPendingReceiptId(res.data.receipt_id);
        }
        // Refresh the sales order data
        await fetchSalesOrder();
        console.log('Sales order after payment:', salesOrder);
        // Close modal after a short delay
        setTimeout(() => {
          closePaymentModal();
        }, 2000);
      } else {
        setSuccessMsg(res.data.error || 'Failed to record payment');
      }
    } catch (err: any) {
      setSuccessMsg(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmPayment = async () => {
    try {
      setSubmitting(true);

      // If we don't have a pending receipt ID, fetch it first
      let receiptId = pendingReceiptId;
      if (!receiptId) {
        // Use the new endpoint to get pending receipts for this specific invoice
        const res = await axios.get(`${API_BASE_URL}/financial/receipts/invoice/${id}/pending`);
        if (res.data.success) {
          if (res.data.data.length > 0) {
            receiptId = res.data.data[0].id; // Take the most recent one
            console.log('Found pending receipt:', res.data.data[0]);
          } else {
            console.log('No pending receipts found for this invoice');
            setSuccessMsg('No pending payment found for this invoice');
            return;
          }
        } else {
          setSuccessMsg('Failed to fetch pending payment');
          return;
        }
      }

      const res = await axios.post(`${API_BASE_URL}/financial/receivables/confirm-payment`, {
        receipt_id: receiptId
      });

      if (res.data.success) {
        setSuccessMsg('Payment confirmed successfully! Invoice status updated to "paid".');
        setPendingReceiptId(null);
        // Refresh the sales order data
        await fetchSalesOrder();
      } else {
        setSuccessMsg(res.data.error || 'Failed to confirm payment');
      }
    } catch (err: any) {
      setSuccessMsg(err.response?.data?.error || 'Failed to confirm payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!invoiceRef.current) return;
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    // Use a narrower width for the PDF (80% of page width)
    const pdfWidth = pageWidth * 0.8;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    // Center the image on the page
    const xOffset = (pageWidth - pdfWidth) / 2;
    pdf.addImage(imgData, 'PNG', xOffset, 0, pdfWidth, pdfHeight);
    pdf.save(`delivery_note_${salesOrder?.so_number || id}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
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

  if (!salesOrder) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMsg && (
          <div className={`mb-4 p-4 rounded-md ${successMsg.includes('successfully')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            {successMsg}
          </div>
        )}
        {/* Export/Back buttons OUTSIDE the ref */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900"> #{salesOrder?.so_number}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {salesOrder.status === 'confirmed' && (
              <button
                onClick={openPaymentModal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Record Payment
              </button>
            )}
            {salesOrder.status === 'in payment' && (
              <button
                onClick={confirmPayment}
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {submitting ? 'Confirming...' : 'Confirm Payment'}
              </button>
            )}
            <button
              onClick={openJournalModal}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Journal Entries
            </button>
            <button onClick={handleExportPDF} className="ml-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-900">Export as PDF</button>
            <Link to="/all-orders" className="text-blue-600 hover:underline">Back to Sales Orders</Link>
          </div>
        </div>
        {/* Everything else INSIDE the ref */}
        <div ref={invoiceRef} className="a4-invoice-print m-2 relative">
          {/* Header Section */}
          <div className="invoice-header mb-6">
            <div className="flex justify-between items-start">
              {/* Company Information */}
              <div className="company-info">
                                 <img
                   src="/woosh.jpg"
                   alt="Company Logo"
                   className="h-48 w-auto object-contain mb-0"
                   style={{ maxWidth: '180px' }}
                 />
                <h1 className="company-name">Moonsun Trade International Limited</h1>
                <p className="company-address">P.O Box 15470, Nairobi Kenya</p>
                <p className="company-tax">Tax PIN: P051904794X</p>
              </div>
              
              {/* Invoice Details */}
              <div className="invoice-details text-right">
                <h2 className="invoice-title">DELIVERY NOTE</h2>
                <div className="invoice-meta">
                  <p><strong>Invoice No:</strong> {salesOrder?.so_number || 'N/A'}</p>
                  <p><strong>Date:</strong> {formatDate(salesOrder?.order_date || '')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="bill-to-section mb-6">
            <div className="flex justify-between">
              <div className="bill-to">
                <h3 className="section-title">Bill To:</h3>
                <p className="customer-name">{salesOrder?.customer?.name || 'N/A'}</p>
                <p className="customer-address">{salesOrder?.customer?.address || 'N/A'}</p>
                <p className="customer-tax">Tax PIN: {salesOrder?.customer?.tax_pin || 'N/A'}</p>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="ship-to">
                  <h3 className="section-title">Ship To:</h3>
                  <p className="customer-name">{salesOrder?.customer?.name || 'N/A'}</p>
                  <p className="customer-address">{salesOrder?.customer?.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="items-section mb-6">
            {salesOrder?.items && salesOrder.items.length > 0 ? (
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th className="item-col">Item</th>
                    <th className="qty-col">Qty</th>
                    <th className="price-col">Unit Price</th>
                    <th className="tax-col">Tax</th>
                    <th className="total-col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td className="item-col">{item.product?.product_name || 'N/A'}</td>
                      <td className="qty-col">{item.quantity}</td>
                      <td className="price-col">
                        {item.net_price ? formatCurrency(item.net_price / item.quantity) : formatCurrency(item.unit_price / 1.16)}
                      </td>
                      <td className="tax-col">{formatCurrency(item.tax_amount || 0)}</td>
                      <td className="total-col">{formatCurrency(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No items found for this sales order.</p>
            )}
          </div>

          {/* Totals Section */}
          <div className="totals-section">
            <div className="flex justify-end">
              <table className="totals-table">
                <tbody>
                  <tr>
                    <td className="label">Subtotal:</td>
                    <td className="amount">{formatCurrency((salesOrder?.total_amount || 0) - (salesOrder?.tax_amount || 0))}</td>
                  </tr>
                  <tr>
                    <td className="label">VAT (16%):</td>
                    <td className="amount">{formatCurrency(salesOrder?.tax_amount || 0)}</td>
                  </tr>
                  <tr className="total-row">
                    <td className="label">Total:</td>
                    <td className="amount">{formatCurrency(salesOrder?.total_amount || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="invoice-footer">
            <div className="footer-content">
              <div className="mb-6">
                <div className="recipient-details max-w-md">
                  <h4 className="section-subtitle">Recipient Details</h4>
                  <div className="recipient-form">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name:</label>
                      <div className="border-b-2 border-gray-300 pb-1 min-h-[20px]"></div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Signature:</label>
                      <div className="border-b-2 border-gray-300 pb-1 min-h-[40px]"></div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
                      <div className="border-b-2 border-gray-300 pb-1 min-h-[20px]"></div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID/Phone:</label>
                      <div className="border-b-2 border-gray-300 pb-1 min-h-[20px]"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="footer-message">
                <p>Thank you for your business!</p>
                <p>For any queries, please contact us at info@moonsun.com</p>
              </div>
            </div>
          </div>
          {/* Journal Entries Modal */}
          {showJournalModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Journal Entries for Invoice #{salesOrder?.so_number}
                  </h3>
                  <button
                    onClick={closeJournalModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {journalLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : journalError ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-sm text-red-700">{journalError}</div>
                  </div>
                ) : journalEntries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No journal entries found for this invoice.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Entry #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Account
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Debit
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {journalEntries.map((entry) => (
                          <tr key={entry.line_id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(entry.entry_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {entry.entry_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {entry.account_code}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {entry.account_name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {entry.line_description || entry.journal_description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Payment Modal */}
          {showPaymentModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Record Payment for Invoice #{salesOrder?.so_number}
                  </h3>
                  <button
                    onClick={closePaymentModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Account
                    </label>
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Payment Account</option>
                      {paymentAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_code} - {account.account_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Payment reference number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Additional notes about the payment"
                    />
                  </div>

                  {successMsg && (
                    <div className={`p-3 rounded-md text-sm ${successMsg.includes('successfully')
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                      {successMsg}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closePaymentModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {submitting ? 'Recording...' : 'Record Payment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesOrderDetailsPage;

<style>{`
  .a4-invoice-print {
    width: 1200px;
    min-height: 1123px;
    background: #fff;
    margin: 0 auto;
    padding: 16px 12px;
    box-sizing: border-box;
    position: relative;
  }
  .invoice-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 0 12px 16px 12px;
  }
  .recipient-details {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px;
    background-color: #f9fafb;
  }
  .recipient-form .border-b-2 {
    border-bottom: 2px solid #d1d5db;
  }
  .section-subtitle {
    font-size: 14px;
    font-weight: 600;
    color: #000;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  @media print {
    body { background: #fff !important; }
    .a4-invoice-print { box-shadow: none !important; }
    .a4-invoice-print table { table-layout: fixed; width: 100%; }
    .a4-invoice-print th, .a4-invoice-print td { word-break: break-word; overflow-wrap: break-word; padding: 4px 6px; font-size: 12px; }
    .a4-invoice-print tr, .a4-invoice-print table { page-break-inside: avoid; }
    .recipient-details { 
      border: 1px solid #000 !important;
      background-color: #fff !important;
    }
    .recipient-form .border-b-2 { 
      border-bottom: 1px solid #000 !important;
    }
  }
`}</style> 