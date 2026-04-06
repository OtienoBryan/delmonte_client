import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

interface ExpenseSummary {
  id: number;
  journal_entry_id: number;
  supplier_id: number;
  amount: number | string;
  created_at: string;
  supplier_name: string;
  entry_date: string;
  reference: string;
  description: string;
  total_items?: number;
  amount_paid: number | string;
}

interface Supplier {
  id: number;
  company_name: string;
}

interface JournalEntry {
  id: number;
  entry_date: string;
  reference: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  created_at: string;
  journal_entry_lines: JournalEntryLine[];
}

interface JournalEntryLine {
  id: number;
  account_id: number;
  account_name: string;
  account_code: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'mobile_money';
interface CashAccount { id: number; account_name: string; account_code: string; }

const ExpenseSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<ExpenseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<number | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<'all' | 'fully_paid' | 'not_fully_paid'>('all');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseSummary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | null>(null);
  const [loadingJournal, setLoadingJournal] = useState(false);
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentExpense, setPaymentExpense] = useState<ExpenseSummary | null>(null);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentAccountId, setPaymentAccountId] = useState<number | ''>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchSuppliers();
    fetchCashAccounts();
  }, []);

  useEffect(() => {
    filterExpenses();
    setCurrentPage(1); // Reset to first page when filters change
  }, [expenses, startDate, endDate, selectedSupplier, paymentStatus]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/financial/expense-summary');
      console.log('API Response:', response.data);
      console.log('First expense amount:', response.data.data[0]?.amount);
      setExpenses(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/financial/suppliers');
      setSuppliers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const fetchCashAccounts = async () => {
    try {
      const response = await axios.get('/api/financial/cash-equivalents/accounts');
      setCashAccounts(response.data.data || []);
    } catch (err) {
      console.error('Error fetching cash accounts:', err);
    }
  };

  const fetchJournalEntry = async (journalEntryId: number) => {
    try {
      setLoadingJournal(true);
      const response = await axios.get(`/api/financial/journal-entries/${journalEntryId}`);
      setSelectedJournalEntry(response.data.data);
      setShowJournalModal(true);
    } catch (err) {
      console.error('Error fetching journal entry:', err);
      alert('Failed to fetch journal entry details');
    } finally {
      setLoadingJournal(false);
    }
  };

  const closeJournalModal = () => {
    setShowJournalModal(false);
    setSelectedJournalEntry(null);
  };

  const handleExpenseClick = (journalEntryId: number) => {
    navigate(`/expense-invoice/${journalEntryId}`);
  };

  const openPaymentModal = (expense: ExpenseSummary) => {
    setPaymentExpense(expense);
    setPaymentDate(new Date(expense.entry_date).toISOString().slice(0,10));
    setPaymentMethod('cash');
    setPaymentAccountId('');
    
    // Calculate the balance (outstanding amount) instead of full amount
    const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0;
    const amountPaid = typeof expense.amount_paid === 'string' ? parseFloat(expense.amount_paid) || 0 : expense.amount_paid || 0;
    const balance = Math.max(0, amount - amountPaid);
    
    setPaymentAmount(String(balance));
    setPaymentReference(expense.reference || '');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentExpense(null);
  };

  const submitPayment = async () => {
    if (!paymentExpense) return;
    if (!paymentDate || !paymentMethod || !paymentAccountId || !paymentAmount) {
      alert('Please fill all required fields');
      return;
    }
    try {
      setSubmittingPayment(true);
      await axios.post(`/api/financial/expenses/${paymentExpense.journal_entry_id}/payments`, {
        expense_detail_id: paymentExpense.id,
        journal_entry_id: paymentExpense.journal_entry_id,
        supplier_id: paymentExpense.supplier_id,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        account_id: paymentAccountId,
        amount: parseFloat(paymentAmount),
        reference: paymentReference,
        notes: paymentNotes,
        currency: 'KES'
      });
      closePaymentModal();
      fetchExpenses();
      alert('Payment recorded');
    } catch (err) {
      console.error('Error recording payment:', err);
      alert('Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    if (startDate) {
      filtered = filtered.filter(expense => 
        new Date(expense.entry_date) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(expense => 
        new Date(expense.entry_date) <= new Date(endDate)
      );
    }

    if (selectedSupplier) {
      filtered = filtered.filter(expense => 
        expense.supplier_id === selectedSupplier
      );
    }

    // Filter by payment status
    if (paymentStatus !== 'all') {
      filtered = filtered.filter(expense => {
        const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0;
        const amountPaid = typeof expense.amount_paid === 'string' ? parseFloat(expense.amount_paid) || 0 : expense.amount_paid || 0;
        
        if (paymentStatus === 'fully_paid') {
          return amountPaid >= amount; // Fully paid when amount paid >= expense amount
        } else if (paymentStatus === 'not_fully_paid') {
          return amountPaid < amount; // Not fully paid when amount paid < expense amount
        }
        return true;
      });
    }

    console.log('Filtered expenses:', filtered);
    
    const totalAmount = filtered.reduce((sum, expense) => {
      const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0;
      console.log(`Adding amount: ${amount} (original: ${expense.amount}, type: ${typeof expense.amount})`);
      return sum + amount;
    }, 0);
    
    console.log('Total amount calculation:', totalAmount);
    
    setFilteredExpenses(filtered);
    setTotalAmount(totalAmount);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedSupplier('');
    setPaymentStatus('all');
    setCurrentPage(1); // Reset to first page when filters change
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '0.00';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
        return; // Don't handle keyboard shortcuts when typing in form fields
      }
      
      if (event.key === 'ArrowLeft' && currentPage > 1) {
        goToPreviousPage();
      } else if (event.key === 'ArrowRight' && currentPage < totalPages) {
        goToNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="w-full">
        {/* Header */}
        <div className="mb-4">
          <div className="flex justify-between items-start">
            <button
              onClick={() => navigate('/add-expense')}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Expense
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value ? parseInt(e.target.value) : '')}
                className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[180px]"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as 'all' | 'fully_paid' | 'not_fully_paid')}
                className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[180px]"
              >
                <option value="all">All Expenses</option>
                <option value="fully_paid">Fully Paid</option>
                <option value="not_fully_paid">Not Fully Paid</option>
              </select>
            </div>
            <button
              onClick={clearFilters}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-2">
                <p className="text-[10px] font-medium text-gray-500">Total Expenses</p>
                <p className="text-base font-semibold text-gray-900">{filteredExpenses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-2">
                <p className="text-[10px] font-medium text-gray-500">Total Amount</p>
                <p className="text-base font-semibold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white rounded-lg shadow-sm p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
              paymentStatus === 'fully_paid' ? 'ring-2 ring-orange-500 bg-orange-50' : 
              paymentStatus === 'not_fully_paid' ? 'ring-2 ring-yellow-500 bg-yellow-50' : ''
            }`}
            onClick={() => {
              if (paymentStatus === 'all') {
                setPaymentStatus('fully_paid');
              } else if (paymentStatus === 'fully_paid') {
                setPaymentStatus('not_fully_paid');
              } else {
                setPaymentStatus('all');
              }
            }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  paymentStatus === 'fully_paid' ? 'bg-orange-200' : 
                  paymentStatus === 'not_fully_paid' ? 'bg-yellow-200' : 'bg-orange-100'
                }`}>
                  <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-2">
                <p className="text-[10px] font-medium text-gray-500">Total Paid</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatCurrency(filteredExpenses.reduce((sum, expense) => {
                    const amountPaid = typeof expense.amount_paid === 'string' ? parseFloat(expense.amount_paid) || 0 : expense.amount_paid || 0;
                    return sum + amountPaid;
                  }, 0))}
                </p>
                {paymentStatus === 'fully_paid' && (
                  <p className="text-[9px] text-orange-600 font-medium mt-0.5">Filtered: Fully Paid Only</p>
                )}
                {paymentStatus === 'not_fully_paid' && (
                  <p className="text-[9px] text-yellow-600 font-medium mt-0.5">Filtered: Partially Paid Only</p>
                )}
              </div>
            </div>
          </div>

          {/* <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unique Suppliers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(filteredExpenses.map(e => e.supplier_id)).size}
                </p>
              </div>
            </div>
          </div> */}

          <div className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-2">
                <p className="text-[10px] font-medium text-gray-500">Outstanding</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatCurrency(
                    filteredExpenses.reduce((sum, expense) => {
                      const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0;
                      const amountPaid = typeof expense.amount_paid === 'string' ? parseFloat(expense.amount_paid) || 0 : expense.amount_paid || 0;
                      return sum + (amount - amountPaid);
                    }, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 hidden">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Fully Paid</p>
                <p className="text-xl font-semibold text-green-600">
                  {expenses.filter(expense => {
                    const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0;
                    const amountPaid = typeof expense.amount_paid === 'string' ? parseFloat(expense.amount_paid) || 0 : expense.amount_paid || 0;
                    return amountPaid >= amount;
                  }).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Partially Paid</p>
                <p className="text-xl font-semibold text-yellow-600">
                  {expenses.filter(expense => {
                    const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0;
                    const amountPaid = typeof expense.amount_paid === 'string' ? parseFloat(expense.amount_paid) || 0 : expense.amount_paid || 0;
                    return amountPaid > 0 && amountPaid < amount;
                  }).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Unpaid</p>
                <p className="text-xl font-semibold text-red-600">
                  {expenses.filter(expense => {
                    const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0;
                    const amountPaid = typeof expense.amount_paid === 'string' ? parseFloat(expense.amount_paid) || 0 : expense.amount_paid || 0;
                    return amountPaid === 0;
                  }).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Rate</p>
                <p className="text-xl font-semibold text-blue-600">
                  {(() => {
                    const totalExpenses = expenses.length;
                    const fullyPaid = expenses.filter(expense => {
                      const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0;
                      const amountPaid = typeof expense.amount_paid === 'string' ? parseFloat(expense.amount_paid) || 0 : expense.amount_paid || 0;
                      return amountPaid >= amount;
                    }).length;
                    return totalExpenses > 0 ? Math.round((fullyPaid / totalExpenses) * 100) : 0;
                  })()}%
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2.5 mb-3">
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
        )}

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200">
            <h2 className="text-xs font-medium text-gray-900">Expense Details</h2>
          </div>
          
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-xs font-medium text-gray-900">No expenses found</h3>
              <p className="mt-1 text-xs text-gray-500">
                {startDate || endDate ? 'Try adjusting your filters.' : 'No expenses have been recorded yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider w-24">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider w-32">
                      Reference
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider w-48">
                      Supplier
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider min-w-64">
                      Description
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider w-32">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider w-32">
                      Amount Paid
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider w-32">
                      Balance
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider w-32">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider w-32">
                      Journal Entry
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentExpenses.map((expense) => (
                    <tr 
                      key={expense.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleExpenseClick(expense.journal_entry_id)}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {formatDate(expense.entry_date)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {expense.reference || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {expense.supplier_name || 'Unknown Supplier'}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate">
                        {expense.description || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {formatCurrency(typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {formatCurrency(typeof expense.amount_paid === 'string' ? parseFloat(expense.amount_paid) || 0 : expense.amount_paid || 0)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {formatCurrency(
                          (typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0) - 
                          (typeof expense.amount_paid === 'string' ? parseFloat(expense.amount_paid) || 0 : expense.amount_paid || 0)
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {(() => {
                          const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) || 0 : expense.amount || 0;
                          const amountPaid = typeof expense.amount_paid === 'string' ? parseFloat(expense.amount_paid) || 0 : expense.amount_paid || 0;
                          const balance = amount - amountPaid;
                          
                          if (amountPaid >= amount) {
                            return (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-green-100 text-green-800">
                                Fully Paid
                              </span>
                            );
                          } else if (amountPaid > 0) {
                            return (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-yellow-100 text-yellow-800">
                                Partially Paid
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-red-100 text-red-800">
                                Unpaid
                              </span>
                            );
                          }
                        })()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchJournalEntry(expense.journal_entry_id);
                          }}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200 cursor-pointer"
                          disabled={loadingJournal}
                        >
                          #{expense.journal_entry_id}
                        </button>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        <button
                          onClick={(e) => { e.stopPropagation(); openPaymentModal(expense); }}
                          className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200"
                        >
                          Make Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {/* Pagination Controls */}
        {filteredExpenses.length > 0 && (
          <div className="bg-white px-3 py-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {/* Page size selector */}
              <div className="flex items-center space-x-1.5">
                <label className="text-[10px] text-gray-700">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-0.5 border border-gray-300 rounded-md text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-[10px] text-gray-700">entries</span>
              </div>

              {/* Page info */}
              <div className="text-[10px] text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredExpenses.length)} of {filteredExpenses.length} entries
              </div>

              {/* Pagination navigation */}
              <div className="flex items-center space-x-1.5">
                {/* Quick jump to page */}
                <div className="flex items-center space-x-1.5">
                  <label className="text-[10px] text-gray-700">Go to:</label>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        goToPage(page);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const page = parseInt(e.currentTarget.value);
                        if (page >= 1 && page <= totalPages) {
                          goToPage(page);
                        }
                      }
                    }}
                    className="w-14 px-1.5 py-0.5 text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-gray-700">of {totalPages}</span>
                </div>

                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center space-x-0.5">
                  {(() => {
                    const pages = [];
                    const maxVisiblePages = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }

                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => goToPage(1)}
                          className="px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="ellipsis1" className="px-1.5 text-gray-500 text-[10px]">
                            ...
                          </span>
                        );
                      }
                    }

                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => goToPage(i)}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${
                            i === currentPage
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="ellipsis2" className="px-1.5 text-gray-500 text-[10px]">
                            ...
                          </span>
                        );
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => goToPage(totalPages)}
                          className="px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
         </div>
       </div>

      {/* Journal Entry Modal */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-3 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-1">
              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-medium text-gray-900">
                  Journal Entry Details
                </h3>
                <button
                  onClick={closeJournalModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingJournal ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-xs text-gray-600">Loading journal entry details...</p>
                </div>
              ) : selectedJournalEntry ? (
                <div className="space-y-3">
                  {/* Journal Entry Header */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-[10px] font-medium text-gray-500">Entry ID</p>
                        <p className="text-xs text-gray-900">#{selectedJournalEntry.id}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500">Date</p>
                        <p className="text-xs text-gray-900">{formatDate(selectedJournalEntry.entry_date)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500">Reference</p>
                        <p className="text-xs text-gray-900">{selectedJournalEntry.reference}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-gray-500">Status</p>
                        <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${
                          selectedJournalEntry.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedJournalEntry.status}
                        </span>
                      </div>
                    </div>
                    {selectedJournalEntry.description && (
                      <div className="mt-2">
                        <p className="text-[10px] font-medium text-gray-500">Description</p>
                        <p className="text-xs text-gray-900">{selectedJournalEntry.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Journal Entry Lines */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 mb-2">Journal Entry Lines</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                              Account
                            </th>
                            <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                              Account Code
                            </th>
                            <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-3 py-2 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                              Debit
                            </th>
                            <th className="px-3 py-2 text-right text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                              Credit
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedJournalEntry.journal_entry_lines.map((line) => (
                            <tr key={line.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                {line.account_name}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                {line.account_code}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate">
                                {line.description || '-'}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-right text-gray-900">
                                {line.debit_amount > 0 ? formatCurrency(line.debit_amount) : '-'}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-right text-gray-900">
                                {line.credit_amount > 0 ? formatCurrency(line.credit_amount) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={3} className="px-3 py-2 text-xs font-medium text-gray-900 text-right">
                              Total:
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                              {formatCurrency(selectedJournalEntry.total_debit)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 text-right">
                              {formatCurrency(selectedJournalEntry.total_credit)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-600">No journal entry details found.</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end mt-3">
                <button
                  onClick={closeJournalModal}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPaymentModal && paymentExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-3 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-1">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-medium text-gray-900">Make Payment</h3>
                <button onClick={closePaymentModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] text-gray-500">Supplier</p>
                    <p className="text-xs text-gray-900">{paymentExpense.supplier_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Reference</p>
                    <p className="text-xs text-gray-900">{paymentExpense.reference || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Journal Entry</p>
                    <p className="text-xs text-gray-900">#{paymentExpense.journal_entry_id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Full Amount</p>
                    <p className="text-xs text-gray-900">{formatCurrency(typeof paymentExpense.amount === 'string' ? parseFloat(paymentExpense.amount) || 0 : paymentExpense.amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Amount Paid</p>
                    <p className="text-xs text-gray-900">{formatCurrency(typeof paymentExpense.amount_paid === 'string' ? parseFloat(paymentExpense.amount_paid) || 0 : paymentExpense.amount_paid || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Outstanding Balance</p>
                    <p className="text-xs font-semibold text-blue-600">
                      {formatCurrency(
                        (typeof paymentExpense.amount === 'string' ? parseFloat(paymentExpense.amount) || 0 : paymentExpense.amount || 0) - 
                        (typeof paymentExpense.amount_paid === 'string' ? parseFloat(paymentExpense.amount_paid) || 0 : paymentExpense.amount_paid || 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Payment Date</label>
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Payment Method</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="mobile_money">Mobile Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Payment Account</label>
                    <select value={paymentAccountId} onChange={(e) => setPaymentAccountId(e.target.value ? parseInt(e.target.value) : '')} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="">Select account</option>
                      {cashAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.account_name} ({acc.account_code})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Payment Amount (Outstanding Balance)</label>
                    <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} step="0.01" className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <p className="text-[9px] text-gray-500 mt-1">This amount represents the outstanding balance. You can modify it if you want to pay a different amount.</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Reference</label>
                    <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={2} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button onClick={closePaymentModal} className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancel</button>
                <button onClick={submitPayment} disabled={submittingPayment} className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-60">
                  {submittingPayment ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
     </div>
   );
 };

export default ExpenseSummaryPage;
