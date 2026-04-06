import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  promotionsReportService,
  PromotionsReport,
  PromotionsReportFilters
} from '../services/promotionsReportService';
import { ArrowLeft, Filter, Search, Megaphone, Building2, User, Package, Calendar as CalendarIcon } from 'lucide-react';

const FilterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  selectedOutlet: string;
  selectedSalesRep: string;
  selectedActivationType: string;
  outlets: { id: number; name: string }[];
  salesReps: { id: number; name: string }[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onOutletChange: (outlet: string) => void;
  onSalesRepChange: (salesRep: string) => void;
  onActivationTypeChange: (activationType: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  selectedOutlet,
  selectedSalesRep,
  selectedActivationType,
  outlets,
  salesReps,
  onStartDateChange,
  onEndDateChange,
  onOutletChange,
  onSalesRepChange,
  onActivationTypeChange,
  onApplyFilters,
  onResetFilters
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Date Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs"
                  />
                </div>
              </div>

              <select
                value={selectedOutlet}
                onChange={(e) => onOutletChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs"
              >
                <option value="all">All Outlets</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.name}>
                    {outlet.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSalesRep}
                onChange={(e) => onSalesRepChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs"
              >
                <option value="all">All Sales Reps</option>
                {salesReps.map((salesRep) => (
                  <option key={salesRep.id} value={salesRep.name}>
                    {salesRep.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedActivationType}
                onChange={(e) => onActivationTypeChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs"
              >
                <option value="all">All Activation Types</option>
                <option value="Price off">Price off</option>
                <option value="Sampling">Sampling</option>
                <option value="BOGO">BOGO</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={() => {
                onApplyFilters();
                onClose();
              }}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-3 py-1.5 bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => {
                onResetFilters();
                onClose();
              }}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-1.5 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PromotionsReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<PromotionsReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('all');
  const [selectedActivationType, setSelectedActivationType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [outlets, setOutlets] = useState<{ id: number; name: string }[]>([]);
  const [salesReps, setSalesReps] = useState<{ id: number; name: string }[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [outletData, salesRepData] = await Promise.all([
          promotionsReportService.getOutlets(),
          promotionsReportService.getSalesReps()
        ]);
        setOutlets(outletData);
        setSalesReps(salesRepData);
      } catch (err) {
        console.error('Failed to fetch promotions filter options', err);
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters: PromotionsReportFilters & { page: number; limit: number } = {
          startDate,
          endDate,
          page: pagination.page,
          limit: pagination.limit
        };
        if (selectedOutlet !== 'all') filters.outlet = selectedOutlet;
        if (selectedSalesRep !== 'all') filters.salesRep = selectedSalesRep;
        if (selectedActivationType !== 'all') filters.activationType = selectedActivationType;
        if (searchQuery.trim()) filters.search = searchQuery.trim();

        const response = await promotionsReportService.getAll(filters);
        setReports(response.data);
        setPagination(response.pagination);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch promotions reports');
      }
      setLoading(false);
    };
    fetchReports();
  }, [startDate, endDate, selectedOutlet, selectedSalesRep, selectedActivationType, searchQuery, pagination.page, pagination.limit]);

  const handleResetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setSelectedOutlet('all');
    setSelectedSalesRep('all');
    setSelectedActivationType('all');
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
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
              <div className="p-1.5 bg-pink-100 rounded-lg">
                <Megaphone className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Promotions Report</h1>
                <p className="text-xs text-gray-600 mt-1">View promotion activations and sampling outcomes</p>
              </div>
            </div>

            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors text-xs"
            >
              <Filter className="w-3 h-3" />
              Filter
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Search outlet, sales rep, product, comment..."
              className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-xs">{error}</div>}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-600">Loading promotions reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-600">No promotions reports found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Outlet</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Sales Rep</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Activation</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Samples</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Qty Before</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Qty After</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Comment</th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900">
                          <div className="flex items-center">
                            <Building2 className="h-3 w-3 text-gray-400 mr-1.5" />
                            {report.outletName || report.outlet_id || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900">
                          <div className="flex items-center">
                            <User className="h-3 w-3 text-gray-400 mr-1.5" />
                            {report.salesRepName || report.user_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900">
                          <div className="flex items-center">
                            <Package className="h-3 w-3 text-gray-400 mr-1.5" />
                            {report.product}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900">{report.activation_type}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900">{report.qty_samples_given}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900">{report.qty_before}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900">{report.qty_after}</td>
                        <td className="px-3 py-2 text-[10px] text-gray-900 max-w-xs truncate">{report.comment || 'N/A'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-500">
                          <div className="flex items-center">
                            <CalendarIcon className="h-3 w-3 text-gray-400 mr-1.5" />
                            {formatDate(report.created_at)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-gray-700">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </span>
                    <select
                      value={pagination.limit}
                      onChange={(e) =>
                        setPagination((prev) => ({
                          ...prev,
                          limit: parseInt(e.target.value, 10),
                          page: 1
                        }))
                      }
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
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page <= 1}
                      className="px-2 py-1 text-[10px] border border-gray-300 rounded-md disabled:opacity-50"
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
                          onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
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
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-2 py-1 text-[10px] border border-gray-300 rounded-md disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          startDate={startDate}
          endDate={endDate}
          selectedOutlet={selectedOutlet}
          selectedSalesRep={selectedSalesRep}
          selectedActivationType={selectedActivationType}
          outlets={outlets}
          salesReps={salesReps}
          onStartDateChange={(value) => {
            setStartDate(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          onEndDateChange={(value) => {
            setEndDate(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          onOutletChange={(value) => {
            setSelectedOutlet(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          onSalesRepChange={(value) => {
            setSelectedSalesRep(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          onActivationTypeChange={(value) => {
            setSelectedActivationType(value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          onApplyFilters={() => setPagination((prev) => ({ ...prev, page: 1 }))}
          onResetFilters={handleResetFilters}
        />
      </div>
    </div>
  );
};

export default PromotionsReportPage;
