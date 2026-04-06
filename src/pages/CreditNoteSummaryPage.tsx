import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Download, Eye, Calendar, Building, X, Package, Receipt, ArrowLeft, CheckSquare, Info } from 'lucide-react';
import { creditNoteService } from '../services/creditNoteService';
import { storeService } from '../services/storeService';
import { Store } from '../types/financial';
import { API_CONFIG } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

interface CreditNoteItem {
  product_id: number;
  product_name?: string;
  product_code?: string;
  product?: any;
  invoice_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CreditNote {
  id: number;
  credit_note_number: string;
  customer_id: number;
  customer_name?: string;
  credit_note_date: string;
  reason?: string;
  total_amount: number;
  status: string;
  my_status?: number;
  received_by?: number;
  received_at?: string;
  staff_name?: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  email?: string;
  contact?: string;
  address?: string;
  items?: CreditNoteItem[];
}

interface CreditNoteDetails {
  id: number;
  credit_note_number: string;
  customer_id: number;
  customer_name?: string;
  credit_note_date: string;
  reason?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  my_status?: number;
  received_by?: number;
  received_at?: string;
  staff_name?: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  email?: string;
  contact?: string;
  address?: string;
  items?: CreditNoteItem[];
}

const CreditNoteSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('0');
  const [dateFilter, setDateFilter] = useState<string>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [jumpToPage, setJumpToPage] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNoteDetails | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Receive back functionality state
  const [showReceiveBackModal, setShowReceiveBackModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [submittingReceiveBack, setSubmittingReceiveBack] = useState(false);
  const [receiveBackSuccess, setReceiveBackSuccess] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  // Monitor user role changes and close modal if user doesn't have stock role
  useEffect(() => {
    if (showReceiveBackModal && user && user.role !== 'stock' && user.role !== 'admin') {
      setShowReceiveBackModal(false);
      setSelectedItems(new Set());
      setSelectedStore('');
      setReceiveBackSuccess(null);
    }
  }, [user, showReceiveBackModal]);

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      const response = await creditNoteService.getAll();
      setCreditNotes(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch credit notes');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('0');
    setDateFilter('month');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setJumpToPage('');
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= totalPages)) {
      setJumpToPage(value);
    }
  };

  const exportToCSV = () => {
    // Prepare CSV headers
    const headers = [
      'Credit Note Number',
      'Customer Name',
      'Customer ID',
      'Date',
      'Created By',
      'Amount',
      'Status',
      'Receive Status',
      'Received By',
      'Reason'
    ];

    // Prepare CSV data
    const csvData = filteredCreditNotes.map(note => [
      note.credit_note_number || '',
      note.customer_name || 'Unknown Customer',
      note.customer_id || '',
      note.credit_note_date ? formatDate(note.credit_note_date) : '',
      note.creator_name || 'Unknown',
      formatCurrency(note.total_amount || 0),
      note.status || '',
      getMyStatusText(note.my_status),
      note.my_status === 1 && note.staff_name ? note.staff_name : (note.my_status === 1 ? `User ID: ${note.received_by}` : 'Not received'),
      note.reason || 'No reason provided'
    ]);

    // Create CSV content
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with current date and filter info
    const currentDate = new Date().toISOString().split('T')[0];
    const filterSuffix = dateFilter === 'month' ? 'current-month' : 
                        dateFilter === 'week' ? 'this-week' :
                        dateFilter === 'today' ? 'today' :
                        dateFilter === 'quarter' ? 'this-quarter' : 'all-dates';
    
    link.download = `credit-notes-${filterSuffix}-${currentDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    // Show success message
    setExportSuccess(`CSV exported successfully! ${filteredCreditNotes.length} credit notes exported.`);
    setTimeout(() => setExportSuccess(null), 3000);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, startDate, endDate]);

  const filteredCreditNotes = creditNotes.filter(note => {
    const matchesSearch = (note.credit_note_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (note.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (note.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || note.my_status === parseInt(statusFilter);
    
    let matchesDate = true;
    
    // Priority: Date range filter overrides dateFilter
    if (startDate || endDate) {
      if (note.credit_note_date) {
        const noteDate = new Date(note.credit_note_date);
        
        if (startDate && endDate) {
          // Both start and end date specified
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the entire end date
          matchesDate = noteDate >= start && noteDate <= end;
        } else if (startDate) {
          // Only start date specified
          const start = new Date(startDate);
          matchesDate = noteDate >= start;
        } else if (endDate) {
          // Only end date specified
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the entire end date
          matchesDate = noteDate <= end;
        }
      }
    } else if (dateFilter !== 'all' && note.credit_note_date) {
      // Use dateFilter only when no date range is specified
      const noteDate = new Date(note.credit_note_date);
      const today = new Date();
      const ninetyDaysAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = noteDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
          matchesDate = noteDate >= weekAgo;
          break;
        case 'month':
          // Check if the note date is in the current month and year
          matchesDate = noteDate.getMonth() === today.getMonth() && 
                       noteDate.getFullYear() === today.getFullYear();
          break;
        case 'quarter':
          matchesDate = noteDate >= ninetyDaysAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const paginatedCreditNotes = filteredCreditNotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCreditNotes.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'applied':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMyStatusColor = (myStatus: number | undefined) => {
    if (myStatus === undefined || myStatus === null) return 'bg-gray-100 text-gray-800';
    
    switch (myStatus) {
      case 0:
        return 'bg-yellow-100 text-yellow-800';
      case 1:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMyStatusText = (myStatus: number | undefined) => {
    if (myStatus === undefined || myStatus === null) return 'Unknown';
    
    switch (myStatus) {
      case 0:
        return 'Not Received';
      case 1:
        return 'Received';
      default:
        return 'Unknown';
    }
  };

  const formatCurrency = (amount: number) => {
    // Handle NaN, null, undefined, or invalid numbers
    if (isNaN(amount) || !isFinite(amount) || amount === null || amount === undefined) {
      return 'KSh 0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateTotals = () => {
    return filteredCreditNotes.reduce((acc, note) => {
      // Handle various data types and edge cases
      let amount = 0;
      
      if (note.total_amount !== null && note.total_amount !== undefined) {
        if (typeof note.total_amount === 'number') {
          amount = note.total_amount;
        } else if (typeof note.total_amount === 'string') {
          const parsed = parseFloat(note.total_amount);
          amount = isNaN(parsed) ? 0 : parsed;
        }
      }
      
      // Ensure amount is a valid number
      if (isNaN(amount) || !isFinite(amount)) {
        console.warn('Invalid total_amount found:', note.total_amount, 'for credit note:', note.id);
        amount = 0;
      }
      
      acc.totalAmount += amount;
      acc.count += 1;
      return acc;
    }, { totalAmount: 0, count: 0 });
  };

  const totals = calculateTotals();

  const handleViewDetails = async (creditNote: CreditNote) => {
    setModalLoading(true);
    setShowModal(true);
    
    try {
      const response = await creditNoteService.getById(creditNote.id);
      if (response.success) {
        setSelectedCreditNote(response.data);
      } else {
        setError('Failed to fetch credit note details');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch credit note details');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCreditNote(null);
    setError(null);
  };

  const fetchStores = async () => {
    setLoadingStores(true);
    try {
      const response = await storeService.getAllStores();
      if (response.success) {
        setStores(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoadingStores(false);
    }
  };

  const handleReceiveBack = () => {
    // Check if user has stock role
    if (user?.role !== 'stock' && user?.role !== 'admin') {
      setError('Access denied. Only users with stock role can receive items back to stock.');
      return;
    }

    // Check if credit note has already been received
    if (selectedCreditNote?.my_status === 1) {
      setError('This credit note has already been received back to stock.');
      return;
    }

    setShowReceiveBackModal(true);
    // Automatically select all items by default
    if (selectedCreditNote?.items) {
      const allItemIndices = selectedCreditNote.items.map((_, index) => index);
      setSelectedItems(new Set(allItemIndices));
    } else {
      setSelectedItems(new Set());
    }
    setSelectedStore('');
    setReceiveBackSuccess(null);
    fetchStores();
  };

  const closeReceiveBackModal = () => {
    setShowReceiveBackModal(false);
    setSelectedItems(new Set());
    setSelectedStore('');
    setReceiveBackSuccess(null);
  };



  const handleReceiveBackSubmit = async () => {
    // Check if user has stock role
    if (user?.role !== 'stock' && user?.role !== 'admin') {
      setError('Access denied. Only users with stock role can receive items back to stock.');
      return;
    }

    if (!selectedCreditNote || selectedItems.size === 0 || !selectedStore) {
      setError('Please select items and a store to receive back inventory');
      return;
    }

    setSubmittingReceiveBack(true);
    try {
      const itemsToReceive = Array.from(selectedItems).map(index => {
        const item = selectedCreditNote.items![index];
        return {
          productId: item.product_id,
          quantity: item.quantity,
          storeId: parseInt(selectedStore)
        };
      });

      // Use fetch API to submit receive back request [[memory:5416987]]
      const url = API_CONFIG.getUrl('/financial/credit-notes/receive-back');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          creditNoteId: selectedCreditNote.id,
          items: itemsToReceive
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setReceiveBackSuccess('Items successfully received back to inventory');
        setTimeout(() => {
          closeReceiveBackModal();
          // Refresh the page to show updated credit note status
          window.location.reload();
        }, 2000);
      } else {
        setError(data.error || 'Failed to receive back items');
      }
    } catch (error) {
      setError('Failed to receive back items');
    } finally {
      setSubmittingReceiveBack(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 hidden">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Credit Note Summary</h1>
              <p className="text-sm text-gray-500">View and manage all credit notes in the system</p>
            </div>
          </div>
        </div>

        {/* Role-based Information */}
        {user?.role === 'stock' || user?.role === 'admin' ? (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 hidden">
            <div className="flex items-center">
              <Info className="h-4 w-4 text-blue-600 mr-2" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Stock Management Access</p>
                <p>You have permission to receive credit note items back to stock. Look for the "Can Receive" indicator in the table below.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center">
              <Info className="h-4 w-4 text-gray-600 mr-2" />
              <div className="text-xs text-gray-700">
                <p className="font-medium">View Only Access</p>
                <p>You can view credit note details but cannot receive items back to stock. Contact a stock manager for inventory operations.</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Credit Notes</p>
                <p className="text-lg font-bold text-gray-900">{totals.count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-1.5 bg-green-100 rounded-lg">
               
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Amount</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(totals.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 ring-2 ring-green-200 bg-green-50">
            <div className="flex items-center">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">
                  {dateFilter === 'month' && !startDate && !endDate 
                    ? 'This Month (Default View)' 
                    : 'Filtered Results'}
                </p>
                <p className="text-lg font-bold text-green-700">
                  {filteredCreditNotes.length}
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  {dateFilter === 'month' && !startDate && !endDate 
                    ? 'Currently showing this month\'s data' 
                    : 'Currently filtered results'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Building className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Active Clients</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Set(creditNotes.map(note => note.customer_id)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock User Summary Card */}
        {(user?.role === 'stock' || user?.role === 'admin') && (
          <div className="mb-8 hidden">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ArrowLeft className="h-5 w-5 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-medium text-gray-600">Credit Notes Available for Receiving</p>
                  <p className="text-xl font-bold text-orange-600">
                    {creditNotes.filter(note => note.my_status !== 1).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {creditNotes.filter(note => note.my_status === 1).length} already received
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search credit notes, clients, or reasons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-72"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Receive Statuses</option>
                <option value="0">Not Received</option>
                <option value="1">Received</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>

              {/* Date Range Filter */}
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && new Date(e.target.value) > new Date(endDate)) {
                      setError('Start date cannot be after end date');
                    } else {
                      setError(null);
                    }
                  }}
                  className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Start Date"
                />
                <span className="text-gray-500 text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (startDate && new Date(startDate) > new Date(e.target.value)) {
                      setError('Start date cannot be after end date');
                    } else {
                      setError(null);
                    }
                  }}
                  className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="End Date"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={fetchCreditNotes}
                className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Refresh
              </button>
              <button
                onClick={clearFilters}
                className="px-2.5 py-1.5 text-xs bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={exportToCSV}
                disabled={filteredCreditNotes.length === 0}
                className="px-2.5 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                title={filteredCreditNotes.length === 0 ? 'No data to export' : 'Export filtered credit notes to CSV'}
              >
                <Download className="h-3 w-3 mr-1.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Success Messages */}
          {exportSuccess && (
            <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-green-800">{exportSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Indicator */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-xs font-medium text-gray-700">Active Filters:</span>
              
              {/* Default Month Filter */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Date: This Month (Default)
              </span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1.5 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {statusFilter !== '0' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Status: {statusFilter === '1' ? 'Received' : 'Not Received'}
                    <button
                      onClick={() => setStatusFilter('0')}
                      className="ml-1.5 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {dateFilter !== 'month' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Date: {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : dateFilter === 'all' ? 'All Dates' : 'This Quarter'}
                    <button
                      onClick={() => setDateFilter('month')}
                      className="ml-1.5 text-yellow-600 hover:text-yellow-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {startDate && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    From: {new Date(startDate).toLocaleDateString()}
                    <button
                      onClick={() => setStartDate('')}
                      className="ml-1.5 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {endDate && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    To: {new Date(endDate).toLocaleDateString()}
                    <button
                      onClick={() => setEndDate('')}
                      className="ml-1.5 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>

        {/* Credit Notes Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900">Credit Notes</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing {filteredCreditNotes.length} of {creditNotes.length} credit notes
              {dateFilter === 'month' && !startDate && !endDate && (
                <span className="ml-2 text-green-600">
                  (This Month - Default View)
                </span>
              )}
              {(startDate || endDate) && (
                <span className="ml-2 text-blue-600">
                  {startDate && endDate 
                    ? ` (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`
                    : startDate 
                    ? ` (from ${new Date(startDate).toLocaleDateString()})`
                    : ` (until ${new Date(endDate).toLocaleDateString()})`
                  }
                </span>
              )}
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-xs text-gray-500">Loading credit notes...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-xs text-red-500">{error}</p>
              <button
                onClick={fetchCreditNotes}
                className="mt-2 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredCreditNotes.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3"></FileText>
              <p className="text-xs text-gray-500">No credit notes found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credit Note
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                                                                   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receive Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Received By
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedCreditNotes.map((note) => (
                      <tr key={note.id || `note-${Math.random()}`} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">
                            <button
                              onClick={() => navigate(`/credit-note-details/${note.id}`)}
                              className="text-blue-600 hover:text-blue-900 hover:underline"
                            >
                              {note.credit_note_number || 'N/A'}
                            </button>
                          </div>
                          <div className="text-xs text-gray-500">ID: {note.id || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">
                            {note.customer_name || 'Unknown Customer'}
                          </div>
                          <div className="text-xs text-gray-500">ID: {note.customer_id || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {note.credit_note_date ? formatDate(note.credit_note_date) : 'N/A'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {note.creator_name ? (
                            <span className="font-medium text-blue-700">{note.creator_name}</span>
                          ) : (
                            <span className="text-gray-500">Unknown</span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {formatCurrency(note.total_amount || 0)}
                        </td>
                                                                         <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getMyStatusColor(note.my_status)}`}>
                              {getMyStatusText(note.my_status)}
                            </span>
                            {note.my_status !== 1 && user?.role === 'stock' && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                                <ArrowLeft className="h-2.5 w-2.5 mr-0.5" />
                                Can Receive
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                          {note.my_status === 1 && note.staff_name ? (
                            <span className="font-medium text-green-700">{note.staff_name}</span>
                          ) : note.my_status === 1 ? (
                            <span className="text-gray-500">User ID: {note.received_by}</span>
                          ) : (
                            <span className="text-gray-400">Not received</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-xs text-gray-900 max-w-xs truncate" title={note.reason || 'No reason provided'}>
                            {note.reason || 'No reason provided'}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex space-x-1.5">
                            <button
                              onClick={() => handleViewDetails(note)}
                              className="px-1.5 py-0.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded flex items-center text-xs"
                              title="View Details"
                            >
                              <Eye className="h-3 w-3 mr-0.5" />
                              View
                            </button>
                            <button
                              onClick={() => navigate(`/credit-note-details/${note.id}`)}
                              className="px-1.5 py-0.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded flex items-center text-xs"
                              title="View Full Details"
                            >
                              <FileText className="h-3 w-3 mr-0.5" />
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                    {/* Results Info and Page Size */}
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <div className="text-xs text-gray-700">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCreditNotes.length)} of {filteredCreditNotes.length} results
                      </div>
                      <button
                        onClick={exportToCSV}
                        disabled={filteredCreditNotes.length === 0}
                        className="px-2.5 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        title="Export all filtered results to CSV"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export All
                      </button>
                      <div className="flex items-center space-x-1.5">
                        <label className="text-xs text-gray-600">Show:</label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                          className="px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <span className="text-xs text-gray-600">per page</span>
                      </div>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      {/* Jump to Page */}
                      <div className="flex items-center space-x-1.5">
                        <label className="text-xs text-gray-600">Go to page:</label>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={jumpToPage}
                          onChange={handlePageInputChange}
                          onKeyPress={(e) => e.key === 'Enter' && handleJumpToPage()}
                          className="w-14 px-1.5 py-1 text-xs border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Page"
                        />
                        <button
                          onClick={handleJumpToPage}
                          disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages}
                          className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Go
                        </button>
                      </div>

                      {/* Page Navigation */}
                      <div className="flex items-center space-x-0.5">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-1.5 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="First page"
                        >
                          ««
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Previous page"
                        >
                          «
                        </button>
                        
                        {/* Page Numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-2 py-1 border rounded text-xs font-medium ${
                                pageNum === currentPage
                                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Next page"
                        >
                          »
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-1.5 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Last page"
                        >
                          »»
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Credit Note Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-4 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Credit Note Details</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : selectedCreditNote ? (
              <div className="space-y-4">
                {/* Header Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Credit Note Information</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Number:</span>
                        <span className="font-medium">{selectedCreditNote.credit_note_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {selectedCreditNote.credit_note_date ? formatDate(selectedCreditNote.credit_note_date) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCreditNote.status)}`}>
                          {selectedCreditNote.status || 'Unknown'}
                        </span>
                      </div>
                                                                   <div className="flex justify-between">
                        <span className="text-gray-600">Reason:</span>
                        <span className="font-medium">{selectedCreditNote.reason || 'No reason provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created By:</span>
                        <span className="font-medium">
                          {selectedCreditNote.creator_name || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created At:</span>
                        <span className="font-medium">
                          {selectedCreditNote.created_at ? formatDate(selectedCreditNote.created_at) : 'Unknown'}
                        </span>
                      </div>
                      {selectedCreditNote.my_status === 1 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Received By:</span>
                            <span className="font-medium">
                              {selectedCreditNote.staff_name || `User ID: ${selectedCreditNote.received_by || 'Unknown'}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Received At:</span>
                            <span className="font-medium">
                              {selectedCreditNote.received_at ? formatDate(selectedCreditNote.received_at) : 'Unknown'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Customer Information</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedCreditNote.customer_name || 'Unknown Customer'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-medium">{selectedCreditNote.customer_id || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedCreditNote.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact:</span>
                        <span className="font-medium">{selectedCreditNote.contact || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-xs font-semibold text-blue-700 mb-2">Financial Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xs text-blue-600">Subtotal</p>
                      <p className="text-base font-bold text-blue-900">{formatCurrency(selectedCreditNote.subtotal || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-blue-600">Tax Amount</p>
                      <p className="text-base font-bold text-blue-900">{formatCurrency(selectedCreditNote.tax_amount || 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-blue-600">Total Amount</p>
                      <p className="text-lg font-bold text-blue-900">{formatCurrency(selectedCreditNote.total_amount || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Credit Note Items */}
                {selectedCreditNote.items && selectedCreditNote.items.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Credit Note Items</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                            <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                            <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedCreditNote.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-xs text-gray-900">
                                <div className="flex items-center">
                                  <Package className="h-3 w-3 text-gray-400 mr-1.5" />
                                  <span>{item.product_name || item.product?.product_name || `Product ${item.product_id}`}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-900">
                                <div className="flex items-center">
                                  <Receipt className="h-3 w-3 text-gray-400 mr-1.5" />
                                  <span>Invoice {item.invoice_id}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-900">
                                {item.condition ? (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    item.condition === 'good' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {item.condition === 'good' ? 'Good' : 'Damaged'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-900">{item.quantity}</td>
                              <td className="px-3 py-2 text-xs text-gray-900">{formatCurrency(item.unit_price)}</td>
                              <td className="px-3 py-2 text-xs font-medium text-gray-900">{formatCurrency(item.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Package className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-xs">No items found for this credit note</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  {user?.role === 'stock' && selectedCreditNote?.my_status !== 1 && (
                    <button
                      onClick={handleReceiveBack}
                      className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1.5" />
                      Receive Back to Stock
                    </button>
                  )}
                  <button
                    onClick={closeModal}
                    className="px-2.5 py-1.5 text-xs bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p className="text-xs">Failed to load credit note details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receive Back Modal */}
      {showReceiveBackModal && selectedCreditNote && (user?.role === 'stock' || user?.role === 'admin') && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-4 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Receive Back to Stock</h3>
              <button
                onClick={closeReceiveBackModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {receiveBackSuccess ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckSquare className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-green-600 font-semibold text-xs">{receiveBackSuccess}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Info Message */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <Info className="h-4 w-4 text-blue-600 mr-2" />
                    <div className="text-xs text-blue-700">
                      <p className="font-medium">All items are automatically selected</p>
                      <p>All items must be received back to stock and cannot be unselected.</p>
                    </div>
                  </div>
                </div>
                {/* Store Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Select Store to Receive Inventory
                  </label>
                  {loadingStores ? (
                    <div className="text-xs text-gray-500">Loading stores...</div>
                  ) : (
                    <select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      className="w-full p-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a store...</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id.toString()}>
                          {store.store_name} ({store.store_code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Items Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-gray-700">
                      Select Items to Receive Back
                    </label>
                    <span className="text-xs text-gray-500">
                      {selectedItems.size} of {selectedCreditNote.items?.length || 0} items selected
                    </span>
                  </div>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-300">
                                      <div className="flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    All items are automatically selected and cannot be unselected
                  </span>
                </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {selectedCreditNote.items && selectedCreditNote.items.length > 0 ? (
                        selectedCreditNote.items.map((item, index) => (
                          <div
                            key={index}
                            className="p-3 border-b border-gray-100 last:border-b-0 bg-blue-50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="h-4 w-4 text-blue-600 bg-blue-600 rounded flex items-center justify-center mr-2">
                                  <CheckSquare className="h-2.5 w-2.5 text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center">
                                    <Package className="h-3 w-3 text-gray-400 mr-1.5" />
                                    <span className="font-medium text-xs text-gray-900">
                                      {item.product_name || item.product?.product_name || `Product ${item.product_id}`}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    Quantity: {item.quantity} | Unit Price: {formatCurrency(item.unit_price)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-xs text-gray-900">
                                  {formatCurrency(item.total_price)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-gray-500">
                          <Package className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                          <p className="text-xs">No items available for this credit note</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {selectedItems.size > 0 && selectedStore && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1.5">Receive Back Summary</h4>
                    <div className="text-xs text-blue-600">
                      <p>Store: {stores.find(s => s.id.toString() === selectedStore)?.store_name}</p>
                      <p>Items to receive: {selectedItems.size}</p>
                      <p>Total quantity: {
                        Array.from(selectedItems).reduce((sum, index) => {
                          return sum + (selectedCreditNote.items?.[index]?.quantity || 0);
                        }, 0)
                      }</p>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-xs">{error}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={closeReceiveBackModal}
                    className="px-2.5 py-1.5 text-xs bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReceiveBackSubmit}
                    disabled={selectedItems.size === 0 || !selectedStore || submittingReceiveBack}
                    className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submittingReceiveBack && (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1.5"></div>
                    )}
                    {submittingReceiveBack ? 'Processing...' : 'Receive Back to Stock'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditNoteSummaryPage;
