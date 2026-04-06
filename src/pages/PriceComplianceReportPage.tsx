import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  priceComplianceReportService, 
  PriceComplianceReport, 
  PriceComplianceReportFilters 
} from '../services/priceComplianceReportService';
import { DollarSign, ArrowLeft, Filter, Download, Search, Building2, User, Package, CheckCircle, XCircle, Calendar as CalendarIcon, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Filter Modal Component
const FilterModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  startDate: string;
  endDate: string;
  selectedOutlet: string;
  selectedSalesRep: string;
  selectedPriceCorrect: string;
  selectedPromotion: string;
  searchQuery: string;
  outlets: { id: number; name: string }[];
  salesReps: { id: number; name: string }[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onOutletChange: (outlet: string) => void;
  onSalesRepChange: (salesRep: string) => void;
  onPriceCorrectChange: (priceCorrect: string) => void;
  onPromotionChange: (promotion: string) => void;
  onSearchChange: (query: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}> = ({ 
  isOpen, 
  onClose, 
  startDate, 
  endDate, 
  selectedOutlet, 
  selectedSalesRep,
  selectedPriceCorrect,
  selectedPromotion,
  searchQuery,
  outlets, 
  salesReps,
  onStartDateChange,
  onEndDateChange,
  onOutletChange,
  onSalesRepChange,
  onPriceCorrectChange,
  onPromotionChange,
  onSearchChange,
  onApplyFilters,
  onResetFilters
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm leading-6 font-medium text-gray-900">
                Filter Reports
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="modal-search" className="block text-xs font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="modal-search"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search outlet, product, comment..."
                    className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Date Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-start-date" className="block text-[10px] text-gray-600 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      id="modal-start-date"
                      value={startDate}
                      onChange={(e) => onStartDateChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-end-date" className="block text-[10px] text-gray-600 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      id="modal-end-date"
                      value={endDate}
                      onChange={(e) => onEndDateChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="modal-outlet-filter" className="block text-xs font-medium text-gray-700 mb-2">
                  Outlet
                </label>
                <select
                  id="modal-outlet-filter"
                  value={selectedOutlet}
                  onChange={(e) => onOutletChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Outlets</option>
                  {outlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.name}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modal-sales-rep-filter" className="block text-xs font-medium text-gray-700 mb-2">
                  Sales Rep
                </label>
                <select
                  id="modal-sales-rep-filter"
                  value={selectedSalesRep}
                  onChange={(e) => onSalesRepChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sales Reps</option>
                  {salesReps.map((salesRep) => (
                    <option key={salesRep.id} value={salesRep.name}>
                      {salesRep.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modal-price-correct-filter" className="block text-xs font-medium text-gray-700 mb-2">
                  Price Correct
                </label>
                <select
                  id="modal-price-correct-filter"
                  value={selectedPriceCorrect}
                  onChange={(e) => onPriceCorrectChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label htmlFor="modal-promotion-filter" className="block text-xs font-medium text-gray-700 mb-2">
                  Promotion
                </label>
                <select
                  id="modal-promotion-filter"
                  value={selectedPromotion}
                  onChange={(e) => onPromotionChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={() => {
                onApplyFilters();
                onClose();
              }}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-3 py-1.5 bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => {
                onResetFilters();
                onClose();
              }}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-1.5 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-1.5 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PriceComplianceReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<PriceComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('all');
  const [selectedPriceCorrect, setSelectedPriceCorrect] = useState<string>('all');
  const [selectedPromotion, setSelectedPromotion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [outlets, setOutlets] = useState<{ id: number; name: string }[]>([]);
  const [salesReps, setSalesReps] = useState<{ id: number; name: string }[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchReports = async (filters?: PriceComplianceReportFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await priceComplianceReportService.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setReports(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch price compliance reports');
    }
    setLoading(false);
  };

  const fetchOutlets = async () => {
    try {
      const outletsData = await priceComplianceReportService.getOutlets();
      setOutlets(outletsData);
    } catch (err: any) {
      console.error('Failed to fetch outlets:', err);
    }
  };

  const fetchSalesReps = async () => {
    try {
      const salesRepsData = await priceComplianceReportService.getSalesReps();
      setSalesReps(salesRepsData);
    } catch (err: any) {
      console.error('Failed to fetch sales reps:', err);
    }
  };

  useEffect(() => {
    fetchOutlets();
    fetchSalesReps();
  }, []);

  useEffect(() => {
    const filters: PriceComplianceReportFilters = { startDate, endDate };
    if (selectedOutlet !== 'all') {
      filters.outlet = selectedOutlet;
    }
    if (selectedSalesRep !== 'all') {
      filters.salesRep = selectedSalesRep;
    }
    if (selectedPriceCorrect !== 'all') {
      filters.priceCorrect = selectedPriceCorrect;
    }
    if (selectedPromotion !== 'all') {
      filters.promotion = selectedPromotion;
    }
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    fetchReports(filters);
  }, [startDate, endDate, selectedOutlet, selectedSalesRep, selectedPriceCorrect, selectedPromotion, searchQuery, pagination.page, pagination.limit]);

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleOutletChange = (outlet: string) => {
    setSelectedOutlet(outlet);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSalesRepChange = (salesRep: string) => {
    setSelectedSalesRep(salesRep);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePriceCorrectChange = (priceCorrect: string) => {
    setSelectedPriceCorrect(priceCorrect);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePromotionChange = (promotion: string) => {
    setSelectedPromotion(promotion);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setSelectedOutlet('all');
    setSelectedSalesRep('all');
    setSelectedPriceCorrect('all');
    setSelectedPromotion('all');
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExportCSV = async () => {
    setExporting(true);
    setError(null);
    try {
      const filters: PriceComplianceReportFilters = { startDate, endDate };
      if (selectedOutlet !== 'all') {
        filters.outlet = selectedOutlet;
      }
      if (selectedSalesRep !== 'all') {
        filters.salesRep = selectedSalesRep;
      }
      if (selectedPriceCorrect !== 'all') {
        filters.priceCorrect = selectedPriceCorrect;
      }
      if (selectedPromotion !== 'all') {
        filters.promotion = selectedPromotion;
      }
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      await priceComplianceReportService.exportToCSV(filters);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    }
    setExporting(false);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    // Format as currency style (thousand separators, 2 decimals) but without the currency symbol
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors text-xs"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Reports</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Price Compliance Report</h1>
                <p className="text-xs text-gray-600 mt-1">
                  Monitor pricing compliance and shelf prices
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors text-xs"
              >
                <Filter className="w-3 h-3" />
                Filter
              </button>
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                <Download className="w-3 h-3" />
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search outlet, product, comment..."
              className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-xs">
            {error}
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-xs text-gray-600">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-600">No price compliance reports found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Outlet
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Sales Rep
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        RRP
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Shelf Price
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Price Correct
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Promotion
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Comment
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="h-3 w-3 text-gray-400 mr-1.5" />
                            <span className="text-[10px] font-medium text-gray-900">
                              {report.outletName || report.outlet_name || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-3 w-3 text-gray-400 mr-1.5" />
                            <span className="text-[10px] text-gray-900">
                              {report.salesRepName || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="h-3 w-3 text-gray-400 mr-1.5" />
                            <span className="text-[10px] text-gray-900">{report.product_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <Tag className="h-3 w-3 text-blue-400 mr-1.5" />
                            <span className="text-[10px] font-medium text-gray-900">
                              {formatCurrency(report.rrp)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 text-green-400 mr-1.5" />
                            <span className="text-[10px] font-medium text-gray-900">
                              {formatCurrency(report.shelf_price)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            {report.price_correct === 'Yes' ? (
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1.5" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500 mr-1.5" />
                            )}
                            <span className={`text-[10px] font-medium ${
                              report.price_correct === 'Yes' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {report.price_correct}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            {report.promotion === 'Yes' ? (
                              <Tag className="h-3 w-3 text-purple-400 mr-1.5" />
                            ) : null}
                            <span className="text-[10px] text-gray-900">{report.promotion}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[10px] text-gray-900 max-w-xs truncate block">
                            {report.comment || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <CalendarIcon className="h-3 w-3 text-gray-400 mr-1.5" />
                            <span className="text-[10px] text-gray-500">
                              {formatDate(report.date)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-gray-700">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </span>
                    <select
                      value={pagination.limit}
                      onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                      className="border border-gray-300 rounded-md px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-2 py-1 text-[10px] border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-2 py-1 text-[10px] border rounded-md ${
                            pagination.page === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-2 py-1 text-[10px] border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Filter Modal */}
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          startDate={startDate}
          endDate={endDate}
          selectedOutlet={selectedOutlet}
          selectedSalesRep={selectedSalesRep}
          selectedPriceCorrect={selectedPriceCorrect}
          selectedPromotion={selectedPromotion}
          searchQuery={searchQuery}
          outlets={outlets}
          salesReps={salesReps}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onOutletChange={handleOutletChange}
          onSalesRepChange={handleSalesRepChange}
          onPriceCorrectChange={handlePriceCorrectChange}
          onPromotionChange={handlePromotionChange}
          onSearchChange={handleSearchChange}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
        />
      </div>
    </div>
  );
};

export default PriceComplianceReportPage;
