import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Eye, 
  FileText, 
  Calendar,
  DollarSign,
  User,
  Search,
  ArrowLeft,
  Store
} from 'lucide-react';
import { 
  creditNoteService,
  CreditNote
} from '../services/creditNoteService';
import { Link } from 'react-router-dom';

const CreditNotesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCreditNoteById();
    } else {
      fetchCreditNotes();
    }
  }, [id]);

  const fetchCreditNoteById = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await creditNoteService.getById(parseInt(id));
      if (response.success) {
        setSelectedCreditNote(response.data);
      } else {
        setError(response.error || 'Failed to fetch credit note');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch credit note');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditNotes = async () => {
    setLoading(true);
    try {
      const response = await creditNoteService.getAll();
      if (response.success) {
        setCreditNotes(response.data || []);
      } else {
        setError(response.error || 'Failed to fetch credit notes');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch credit notes');
    } finally {
      setLoading(false);
    }
  };

  const filteredCreditNotes = creditNotes.filter(creditNote => {
    const matchesSearch = 
      creditNote.credit_note_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (creditNote.customer_name && creditNote.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (creditNote.customer_code && creditNote.customer_code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || creditNote.status === filterStatus;
    
    const matchesDate = (!startDate || new Date(creditNote.credit_note_date) >= new Date(startDate)) &&
                        (!endDate || new Date(creditNote.credit_note_date) <= new Date(endDate));
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination
  const displayItemsPerPage = showAll ? filteredCreditNotes.length : itemsPerPage;
  const totalPages = Math.ceil(filteredCreditNotes.length / displayItemsPerPage);
  const startIndex = (currentPage - 1) * displayItemsPerPage;
  const endIndex = showAll ? filteredCreditNotes.length : startIndex + displayItemsPerPage;
  const paginatedCreditNotes = showAll ? filteredCreditNotes : filteredCreditNotes.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    setShowAll(false); // Reset show all when filters change
  }, [searchTerm, filterStatus, startDate, endDate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      applied: { color: 'bg-blue-100 text-blue-800', label: 'Applied' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getConditionBadge = (condition?: string) => {
    if (!condition) return null;
    
    const conditionConfig = {
      good: { color: 'bg-green-100 text-green-800', label: 'Good' },
      damaged: { color: 'bg-red-100 text-red-800', label: 'Damaged' }
    };
    
    const config = conditionConfig[condition as keyof typeof conditionConfig];
    if (!config) return null;
    
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading credit notes...</p>
        </div>
      </div>
    );
  }

  // Individual Credit Note View
  if (id && selectedCreditNote) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => navigate('/credit-notes')}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <div className="p-1 bg-orange-100 rounded-lg">
                  <FileText className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-900">Credit Note Details</h1>
                  <p className="text-[10px] text-gray-500">{selectedCreditNote.credit_note_number}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Note Details */}
          <div className="bg-white shadow rounded-lg p-3 mb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <h3 className="text-xs font-semibold text-gray-900 mb-2">Credit Note Information</h3>
                <dl className="space-y-1.5">
                  <div>
                    <dt className="text-[10px] font-medium text-gray-500">Credit Note Number</dt>
                    <dd className="text-[10px] text-gray-900">{selectedCreditNote.credit_note_number}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium text-gray-500">Date</dt>
                    <dd className="text-[10px] text-gray-900">{formatDate(selectedCreditNote.credit_note_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium text-gray-500">Customer</dt>
                    <dd className="text-[10px] text-gray-900">{selectedCreditNote.customer_name}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium text-gray-500">Status</dt>
                    <dd className="text-[10px] text-gray-900">{getStatusBadge(selectedCreditNote.status)}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900 mb-2">Financial Summary</h3>
                <dl className="space-y-1.5">
                  <div>
                    <dt className="text-[10px] font-medium text-gray-500">Subtotal</dt>
                    <dd className="text-[10px] text-gray-900">
                      {Number(selectedCreditNote.subtotal).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium text-gray-500">Tax Amount</dt>
                    <dd className="text-[10px] text-gray-900">
                      {Number(selectedCreditNote.tax_amount).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-medium text-gray-500">Total Amount</dt>
                    <dd className="text-xs font-semibold text-orange-600">
                      {Number(selectedCreditNote.total_amount).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {selectedCreditNote.reason && (
              <div className="mt-3">
                <h3 className="text-xs font-semibold text-gray-900 mb-1">Reason</h3>
                <p className="text-[10px] text-gray-700 bg-gray-50 p-1.5 rounded-lg">{selectedCreditNote.reason}</p>
              </div>
            )}
          </div>

          {/* Credit Note Items */}
          {selectedCreditNote.items && selectedCreditNote.items.length > 0 && (
            <div className="bg-white shadow rounded-lg p-3">
              <h3 className="text-xs font-semibold text-gray-900 mb-2">Credit Note Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Condition
                      </th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-3 py-1.5 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedCreditNote.items.map((item: any, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-[10px] font-medium text-gray-900">
                            {item.product_name || item.product?.product_name || `Product ${item.product_id}`}
                          </div>
                          {(item.product_code || item.product?.product_code) && (
                            <div className="text-[10px] text-gray-500">{item.product_code || item.product?.product_code}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-[10px] text-gray-900">
                            {item.invoice_number || item.so?.so_number || `Invoice ${item.invoice_id}`}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {getConditionBadge(item.condition)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="text-[10px] text-gray-900">{item.quantity}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="text-[10px] text-gray-900">
                            {Number(item.unit_price).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="text-[10px] font-medium text-gray-900">
                            {Number(item.total_price).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-blue-100 rounded-lg">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Credit Notes</h1>
                <p className="text-[10px] text-gray-500">Manage and view all credit notes</p>
              </div>
            </div>
            <Link
              to="/create-credit-note"
              className="flex items-center px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Credit Note
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by credit note number, customer..."
                  className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="applied">Applied</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
              <button
                onClick={fetchCreditNotes}
              className="px-2.5 py-1 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Refresh
              </button>
            <div className="text-[10px] text-gray-600">
              Showing {showAll ? filteredCreditNotes.length : startIndex + 1}-{Math.min(endIndex, filteredCreditNotes.length)} of {filteredCreditNotes.length} credit notes
            </div>
          </div>
        </div>

        {/* Credit Notes Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Credit Notes ({filteredCreditNotes.length})
            </h3>
            {!showAll && filteredCreditNotes.length > itemsPerPage && (
              <button
                onClick={() => setShowAll(true)}
                className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
              >
                View All
              </button>
            )}
            {showAll && (
              <button
                onClick={() => {
                  setShowAll(false);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
              >
                Show Paginated
              </button>
            )}
          </div>

          {filteredCreditNotes.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No credit notes found</p>
              {searchTerm || filterStatus !== 'all' ? (
                <p className="text-[10px] text-gray-400 mt-1">Try adjusting your search or filters</p>
              ) : (
                <Link
                  to="/create-credit-note"
                  className="inline-flex items-center mt-2 px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Create Your First Credit Note
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Credit Note
                    </th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedCreditNotes.map((creditNote) => (
                    <tr key={creditNote.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-5 w-5 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-3 w-3 text-blue-600" />
                          </div>
                          <div className="ml-2">
                            <div className="text-[10px] font-medium text-gray-900">
                              {creditNote.credit_note_number}
                            </div>
                            {creditNote.original_invoice_number && (
                              <div className="text-[10px] text-gray-500">
                                Invoice: {creditNote.original_invoice_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-5 w-5 bg-gray-100 rounded-lg flex items-center justify-center">
                            <User className="h-3 w-3 text-gray-600" />
                          </div>
                          <div className="ml-2">
                            <div className="text-[10px] font-medium text-gray-900">
                              {creditNote.customer_name || 'N/A'}
                            </div>
                            {creditNote.customer_code && (
                              <div className="text-[10px] text-gray-500">
                                {creditNote.customer_code}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-[10px] text-gray-900">
                            {formatDate(creditNote.credit_note_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 text-gray-400 mr-0.5" />
                          <span className="text-[10px] font-medium text-gray-900">
                            {Number(creditNote.total_amount).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {getStatusBadge(creditNote.status)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] font-medium">
                        <div className="flex items-center space-x-1">
                          <Link
                            to={`/credit-notes/${creditNote.id}`}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="h-3 w-3 mr-0.5" />
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!showAll && totalPages > 1 && (
            <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-between">
              <div className="text-[10px] text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border border-gray-300 rounded text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 border border-gray-300 rounded text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditNotesPage; 