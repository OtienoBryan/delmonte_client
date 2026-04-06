import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, DollarSign, Calendar, User, AlertCircle, CheckCircle, Clock, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(amount);

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const paymentMethods = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard },
  { value: 'cash', label: 'Cash', icon: DollarSign },
  { value: 'mpesa', label: 'M-Pesa', icon: CreditCard },
  { value: 'cheque', label: 'Cheque', icon: FileText },
  { value: 'other', label: 'Other', icon: CreditCard },
];

const ReceivablesCustomerPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue'>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (customerId) {
      console.log('useEffect triggered with customerId:', customerId);
      console.log('API_BASE_URL:', API_BASE_URL);
      fetchPendingInvoices(customerId);
    }
  }, [customerId]);

  // Debug logging for customer state
  useEffect(() => {
    console.log('Customer state changed:', customer);
  }, [customer]);

  const fetchPendingInvoices = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching data for customer ID: ${id}`);
      
      // Always fetch customer information first
      try {
        console.log('Fetching customer details...');
        const customerUrl = `${API_BASE_URL}/clients/${id}`;
        console.log('Customer API URL:', customerUrl);
        const customerRes = await axios.get(customerUrl);
        console.log('Customer API response:', customerRes.data);
        
        // The client API returns the client data directly, not wrapped in success/data
        if (customerRes.data && customerRes.data.id) {
          setCustomer(customerRes.data);
          console.log('Customer data set:', customerRes.data);
        } else {
          console.warn('Customer API returned invalid data structure');
          console.warn('Customer API data:', customerRes.data);
        }
      } catch (customerErr: any) {
        console.error('Error fetching customer details:', customerErr);
        console.error('Customer API error response:', customerErr.response?.data);
        console.error('Customer API status:', customerErr.response?.status);
      }
      
      // Then fetch invoices for this customer
      console.log('Fetching invoices...');
      const invoicesUrl = `${API_BASE_URL}/clients/${id}/invoices`;
      console.log('Invoices API URL:', invoicesUrl);
      const res = await axios.get(invoicesUrl);
      console.log('Invoices API response:', res.data);
      
      if (res.data.success) {
        // Only show invoices not fully paid
        const pending = (res.data.data || []).filter((inv: any) => {
          const amountPaid = inv.amount_paid || 0;
          return inv.total_amount > amountPaid;
        });
        console.log('Filtered pending invoices:', pending);
        setInvoices(pending);
      } else {
        setError(res.data.error || 'Failed to fetch invoices');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoices(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map(inv => inv.id));
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.so_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (inv.customer?.name || inv.customer?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const balance = inv.total_amount - (inv.amount_paid || 0);
    const daysOverdue = Math.floor((Date.now() - new Date(inv.order_date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (filterStatus === 'overdue') return matchesSearch && daysOverdue > 30 && balance > 0;
    if (filterStatus === 'pending') return matchesSearch && balance > 0;
    
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const totalOutstanding = filteredInvoices.reduce((sum, inv) => {
    const balance = inv.total_amount - (inv.amount_paid || 0);
    return sum + balance;
  }, 0);

  const totalSelected = selectedInvoices.reduce((sum, id) => {
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      const balance = inv.total_amount - (inv.amount_paid || 0);
      return sum + balance;
    }
    return sum;
  }, 0);

  const getInvoiceStatus = (invoice: any) => {
    const balance = invoice.total_amount - (invoice.amount_paid || 0);
    const daysOverdue = Math.floor((Date.now() - new Date(invoice.order_date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (balance === 0) return { status: 'paid', label: 'Paid', color: 'text-green-600 bg-green-100', icon: CheckCircle };
    if (daysOverdue > 30) return { status: 'overdue', label: 'Overdue', color: 'text-red-600 bg-red-100', icon: AlertCircle };
    return { status: 'pending', label: 'Pending', color: 'text-yellow-600 bg-yellow-100', icon: Clock };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-xs">Loading customer invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <Link 
              to="/receivables" 
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="font-medium text-xs">
                {customer ? `Back to Receivables (${customer.name})` : 'Back to Receivables'}
              </span>
            </Link>
          </div>
          
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-blue-50 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-900 mb-1">
                    {customer ? `${customer.name || customer.company_name || 'Unknown Customer'}` : 'Customer Receivables'}
                  </h1>
                   
                  {customer && (
                    <div className="flex flex-col gap-1 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[10px]">Customer ID: {customer.id || customerId}</span>
                        <span className="text-[10px]">•</span>
                        <span className="text-[10px]">{customer.email || 'No email'}</span>
                        {customer.contact && (
                          <>
                            <span className="text-[10px]">•</span>
                            <span className="text-[10px]">{customer.contact}</span>
                          </>
                        )}
                      </div>
                      {customer.address && (
                        <div className="text-[9px] text-gray-500">
                          📍 {customer.address}
                        </div>
                      )}
                    </div>
                  )}
                  {!customer && (
                    <div className="text-[10px] text-gray-500">
                      Loading customer information... (ID: {customerId})
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 mb-0.5">Total Outstanding</div>
                  <div className="text-xs font-bold text-red-600">{formatCurrency(totalOutstanding)}</div>
                </div>
                {user?.role === 'admin' ? (
                  <button
                    className={`px-3 py-1.5 rounded-md font-medium text-xs shadow-sm transition-all ${
                      selectedInvoices.length === 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    disabled={selectedInvoices.length === 0}
                    onClick={() => setShowBulkModal(true)}
                  >
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3" />
                      Bulk Payment
                      {selectedInvoices.length > 0 && (
                        <span className="bg-white text-blue-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                          {selectedInvoices.length}
                        </span>
                      )}
                    </div>
                  </button>
                ) : (
                  <div className="px-3 py-1.5 rounded-md font-medium text-xs bg-gray-100 text-gray-500 border border-gray-200">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3" />
                      Admin Access Required
                      <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                        Admin Only
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3 mb-3">
          <div className="flex flex-col lg:flex-row gap-2.5">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search invoices by number or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <FileText className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              </div>
            </div>
            
            <div className="flex gap-1.5">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1.5 rounded-md font-medium text-xs transition-all ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({invoices.length})
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-2.5 py-1.5 rounded-md font-medium text-xs transition-all ${
                  filterStatus === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({invoices.filter(inv => (inv.total_amount - (inv.amount_paid || 0)) > 0).length})
              </button>
              <button
                onClick={() => setFilterStatus('overdue')}
                className={`px-2.5 py-1.5 rounded-md font-medium text-xs transition-all ${
                  filterStatus === 'overdue'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Overdue ({invoices.filter(inv => {
                  const daysOverdue = Math.floor((Date.now() - new Date(inv.order_date).getTime()) / (1000 * 60 * 60 * 24));
                  return daysOverdue > 30 && (inv.total_amount - (inv.amount_paid || 0)) > 0;
                }).length})
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2.5 mb-3">
            <div className="flex items-center gap-1.5 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium text-xs">{error}</span>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 text-center">
            <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-xs font-medium text-gray-900 mb-1">No invoices found</h3>
            <p className="text-xs text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No pending invoices found for this customer'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.length === currentInvoices.length && currentInvoices.length > 0}
                        onChange={handleSelectAll}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        aria-label="Select all invoices"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-right text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-3 py-2 text-right text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                    <th className="px-3 py-2 text-right text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentInvoices.map(inv => {
                    const status = getInvoiceStatus(inv);
                    const balance = inv.total_amount - (inv.amount_paid || 0);
                    
                    return (
                      <tr 
                        key={inv.id} 
                        className="hover:bg-blue-50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/sales-orders/${inv.id}`)}
                      >
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(inv.id)}
                            onChange={() => handleSelectInvoice(inv.id)}
                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            aria-label={`Select invoice ${inv.so_number}`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                              <FileText className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-xs text-gray-900 group-hover:text-blue-600 transition-colors">
                                {inv.so_number}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {inv.customer?.name || inv.customer?.company_name || 'Unknown Customer'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-700">{formatDate(inv.order_date)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium ${status.color}`}>
                            <status.icon className="h-2.5 w-2.5" />
                            {status.label}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="text-xs text-gray-900 font-semibold">{formatCurrency(inv.total_amount)}</span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="text-xs text-green-600 font-medium">{formatCurrency(inv.amount_paid || 0)}</span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`text-xs font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(balance)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] text-gray-600">Show:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-md px-2 py-0.5 text-[10px] focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <span className="text-[10px] text-gray-600">per page</span>
                    </div>
                    
                    <div className="text-[10px] text-gray-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredInvoices.length)} of {filteredInvoices.length} invoices
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`p-1 rounded-md transition-colors ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                                page === currentPage
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return <span key={page} className="px-1.5 text-gray-400 text-[10px]">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`p-1 rounded-md transition-colors ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Summary Footer */}
            <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-gray-600">
                  {selectedInvoices.length > 0 && (
                    <span className="font-medium">
                      {selectedInvoices.length} invoice(s) selected • 
                      Total: <span className="text-blue-600 font-bold">{formatCurrency(totalSelected)}</span>
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-600">
                  Page {currentPage} of {totalPages} • {filteredInvoices.length} invoices
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Payment Modal - Only show for admin users */}
      {user?.role === 'admin' && (
        <BulkPaymentModal
          open={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          invoices={invoices.filter(inv => selectedInvoices.includes(inv.id))}
          customerId={customerId}
          userRole={user?.role}
          onSuccess={() => {
            fetchPendingInvoices(customerId || '');
            setSelectedInvoices([]);
          }}
        />
      )}
    </div>
  );
};

// Enhanced BulkPaymentModal component
const BulkPaymentModal: React.FC<{
  open: boolean;
  onClose: () => void;
  invoices: any[];
  customerId?: string;
  userRole?: string;
  onSuccess: () => void;
}> = ({ open, onClose, invoices, customerId, userRole, onSuccess }) => {
  const [amounts, setAmounts] = useState<{ [id: string]: number }>({});
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [accountId, setAccountId] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      // Reset amounts and fields when modal opens
      const initial: { [id: string]: number } = {};
      invoices.forEach(inv => {
        const balance = inv.total_amount - (inv.amount_paid || 0);
        initial[inv.id] = balance; // Pre-fill with full balance
      });
      setAmounts(initial);
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('bank_transfer');
      setAccountId('');
      setReference('');
      setNotes('');
      setError(null);
      // Fetch accounts
      axios.get('/api/payroll/payment-accounts').then(res => {
        if (res.data.success) setAccounts(res.data.data);
      });
    }
  }, [open, invoices]);

  const handleChange = (id: string, value: string) => {
    const num = Math.max(0, Math.min(Number(value), invoices.find(inv => inv.id === id)?.total_amount - (invoices.find(inv => inv.id === id)?.amount_paid || 0)));
    setAmounts(a => ({ ...a, [id]: isNaN(num) ? 0 : num }));
  };

  const total = Object.values(amounts).reduce((sum, v) => sum + (Number(v) || 0), 0);

  const handleSubmit = async () => {
    // Check if user has admin role
    if (userRole !== 'admin') {
      setError('Access denied. Admin role required to post payments.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payments = Object.entries(amounts)
        .filter(([_, amount]) => Number(amount) > 0)
        .map(([invoiceId, amount]) => ({ invoiceId, amount: Number(amount) }));
      
      for (const p of payments) {
        await axios.post('/api/financial/receivables/payment', {
          customer_id: customerId,
          invoice_id: p.invoiceId,
          amount: p.amount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          account_id: accountId,
          reference,
          notes,
        });
      }
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.error || err.message || 'Failed to record payment');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold">Bulk Payment Assignment</h2>
              <span className="bg-yellow-400 text-blue-900 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                Admin Only
              </span>
            </div>
            <button 
              className="text-white hover:text-gray-200 transition-colors p-0.5 rounded-full hover:bg-white hover:bg-opacity-20"
              onClick={onClose}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-blue-100 text-[10px] mt-1">
            {invoices.length} invoice(s) selected • Total: {formatCurrency(total)}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-3 overflow-y-auto max-h-[60vh]">
          {/* Invoice List */}
          <div className="space-y-2.5 mb-3">
            <h3 className="font-semibold text-xs text-gray-900 mb-2">Invoice Details</h3>
            {invoices.map(inv => {
              const balance = inv.total_amount - (inv.amount_paid || 0);
              return (
                <div key={inv.id} className="bg-gray-50 rounded-md p-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-xs text-gray-900">{inv.so_number}</div>
                      <div className="text-[10px] text-gray-500">
                        Balance: <span className="font-medium">{formatCurrency(balance)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <input
                        type="number"
                        min={0}
                        max={balance}
                        step="0.01"
                        value={amounts[inv.id] || ''}
                        onChange={e => handleChange(inv.id, e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 w-24 text-right text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${((amounts[inv.id] || 0) / balance) * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Payment Date</label>
              <input 
                type="date" 
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent" 
                value={paymentDate} 
                onChange={e => setPaymentDate(e.target.value)} 
                disabled={loading} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Payment Method</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent" 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)} 
                disabled={loading}
              >
                {paymentMethods.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Receiving Account</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent" 
                value={accountId} 
                onChange={e => setAccountId(e.target.value)} 
                disabled={loading}
              >
                <option value="">Select account</option>
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.account_code} - {a.account_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Reference</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent" 
                value={reference} 
                onChange={e => setReference(e.target.value)} 
                placeholder="Payment reference"
                disabled={loading} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Notes</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent" 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Payment notes"
                disabled={loading} 
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-2">
              <div className="flex items-center gap-1.5 text-red-700">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="font-medium text-xs">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-900">Total Payment:</span>
            <span className="text-xs font-bold text-blue-600">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-end gap-2">
            <button 
              className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-700 font-medium text-xs hover:bg-gray-300 transition-colors" 
              onClick={onClose} 
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className={`px-3 py-1.5 rounded-md font-medium text-xs shadow-sm transition-all ${
                total <= 0 || !accountId || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={handleSubmit}
              disabled={total <= 0 || !accountId || loading}
            >
              {loading ? (
                <div className="flex items-center gap-1.5">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" />
                  Submit Payment
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceivablesCustomerPage; 