import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  sosReportService,
  SosReport,
  SosReportFilters,
} from '../services/sosReportService';
import axios from 'axios';
import {
  Target,
  ArrowLeft,
  Filter,
  Download,
  Search,
  Building2,
  User,
  Percent,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FilterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  selectedOutlet: string;
  selectedRep: string;
  selectedBrand: string;
  searchQuery: string;
  outlets: { id: number; name: string }[];
  reps: { id: number; name: string }[];
  outletAccounts: { id: number; name: string }[];
  brands: { id: number; name: string }[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onOutletChange: (outlet: string) => void;
  onRepChange: (rep: string) => void;
  onBrandChange: (brand: string) => void;
  selectedOutletAccount: string;
  selectedTargetStatus: string;
  onOutletAccountChange: (account: string) => void;
  onTargetStatusChange: (status: string) => void;
  onSearchChange: (query: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  selectedOutlet,
  selectedRep,
  selectedBrand,
  searchQuery,
  outlets,
  reps,
  outletAccounts,
  brands,
  onStartDateChange,
  onEndDateChange,
  onOutletChange,
  onRepChange,
  onBrandChange,
  selectedOutletAccount,
  selectedTargetStatus,
  onOutletAccountChange,
  onTargetStatusChange,
  onSearchChange,
  onApplyFilters,
  onResetFilters,
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
                Filter SOS Reports
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="modal-search"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
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
                    placeholder="Search outlet, rep, brand, comment..."
                    className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">
                  Date Range
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="modal-start-date"
                      className="block text-[10px] text-gray-600 mb-1"
                    >
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
                    <label
                      htmlFor="modal-end-date"
                      className="block text-[10px] text-gray-600 mb-1"
                    >
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
                <label
                  htmlFor="modal-outlet-filter"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
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
                <label
                  htmlFor="modal-rep-filter"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Rep
                </label>
                <select
                  id="modal-rep-filter"
                  value={selectedRep}
                  onChange={(e) => onRepChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Reps</option>
                  {reps.map((rep) => (
                    <option key={rep.id} value={rep.name}>
                      {rep.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="modal-brand-filter"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Brand
                </label>
                <select
                  id="modal-brand-filter"
                  value={selectedBrand}
                  onChange={(e) => onBrandChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="modal-outlet-account-filter"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Outlet Account
                </label>
                <select
                  id="modal-outlet-account-filter"
                  value={selectedOutletAccount}
                  onChange={(e) => onOutletAccountChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Outlet Accounts</option>
                  {outletAccounts.map((oa) => (
                    <option key={oa.id} value={oa.name}>
                      {oa.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="modal-target-status-filter"
                  className="block text-xs font-medium text-gray-700 mb-2"
                >
                  Target Status
                </label>
                <select
                  id="modal-target-status-filter"
                  value={selectedTargetStatus}
                  onChange={(e) => onTargetStatusChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="on_or_above">On / Above Target</option>
                  <option value="slightly_below">Slightly Below</option>
                  <option value="significantly_below">Significantly Below</option>
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

const SosReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<SosReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedOutletAccount, setSelectedOutletAccount] = useState<string>('all');
  const [selectedTargetStatus, setSelectedTargetStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [outlets, setOutlets] = useState<{ id: number; name: string }[]>([]);
  const [reps, setReps] = useState<{ id: number; name: string }[]>([]);
  const [outletAccounts, setOutletAccounts] = useState<{ id: number; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchReports = async (filters?: SosReportFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await sosReportService.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      setReports(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch SOS reports');
    }
    setLoading(false);
  };

  const fetchOutlets = async () => {
    try {
      const outletsData = await sosReportService.getOutlets();
      setOutlets(outletsData);
    } catch (err: any) {
      console.error('Failed to fetch SOS outlets:', err);
    }
  };

  const fetchReps = async () => {
    try {
      const repsData = await sosReportService.getReps();
      setReps(repsData);
    } catch (err: any) {
      console.error('Failed to fetch SOS reps:', err);
    }
  };

  const fetchOutletAccounts = async () => {
    try {
      const accountsData = await sosReportService.getOutletAccounts();
      setOutletAccounts(accountsData);
    } catch (err: any) {
      console.error('Failed to fetch SOS outlet accounts:', err);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await axios.get('/api/brands?active_only=true', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      const data = response.data;
      const list = data?.data || data || [];
      setBrands(list.map((b: any) => ({ id: b.id, name: b.name })));
    } catch (err) {
      console.error('Failed to fetch brands for SOS filter:', err);
    }
  };

  useEffect(() => {
    fetchOutlets();
    fetchReps();
    fetchOutletAccounts();
    fetchBrands();
  }, []);

  useEffect(() => {
    const filters: SosReportFilters = { startDate, endDate };
    if (selectedOutlet !== 'all') {
      filters.outlet = selectedOutlet;
    }
    if (selectedRep !== 'all') {
      filters.rep = selectedRep;
    }
    if (selectedBrand !== 'all' && selectedBrand.trim()) {
      filters.brand = selectedBrand.trim();
    }
    if (selectedOutletAccount !== 'all') {
      filters.outletAccount = selectedOutletAccount;
    }
    if (selectedTargetStatus !== 'all') {
      filters.targetStatus = selectedTargetStatus;
    }
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    fetchReports(filters);
  }, [
    startDate,
    endDate,
    selectedOutlet,
    selectedRep,
    selectedBrand,
    searchQuery,
    pagination.page,
    pagination.limit,
  ]);

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleOutletChange = (outlet: string) => {
    setSelectedOutlet(outlet);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRepChange = (rep: string) => {
    setSelectedRep(rep);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleBrandChange = (brand: string) => {
    const value = brand.trim() || 'all';
    setSelectedBrand(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleOutletAccountChange = (account: string) => {
    setSelectedOutletAccount(account);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleTargetStatusChange = (status: string) => {
    setSelectedTargetStatus(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setSelectedOutlet('all');
    setSelectedRep('all');
    setSelectedBrand('all');
    setSelectedOutletAccount('all');
    setSelectedTargetStatus('all');
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleExportCSV = async () => {
    setExporting(true);
    setError(null);
    try {
      const filters: SosReportFilters = { startDate, endDate };
      if (selectedOutlet !== 'all') {
        filters.outlet = selectedOutlet;
      }
      if (selectedRep !== 'all') {
        filters.rep = selectedRep;
      }
      if (selectedBrand !== 'all' && selectedBrand.trim()) {
        filters.brand = selectedBrand.trim();
      }
      if (selectedOutletAccount !== 'all') {
        filters.outletAccount = selectedOutletAccount;
      }
      if (selectedTargetStatus !== 'all') {
        filters.targetStatus = selectedTargetStatus;
      }
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      await sosReportService.exportToCSV(filters);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    }
    setExporting(false);
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const formatPercent = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '0.00';
    const num = typeof value === 'number' ? value : Number(value || 0);
    return num.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusInfo = (sos: number | string | null | undefined, target: number | string | null | undefined) => {
    const sosVal = Number(sos || 0);
    const targetVal = Number(target || 0);
    const diff = sosVal - targetVal; // positive = meeting/exceeding

    // Thresholds (in percentage points, based on target - SOS):
    // sos >= target           => diff >= 0        => Green
    // target - sos <= 10      => diff >= -10      => Amber (slightly below)
    // target - sos > 10       => diff < -10       => Red (significantly below)
    if (diff >= 0) {
      return {
        label: 'On / Above Target',
        colorClass: 'bg-green-100 text-green-800 border-green-200',
      };
    }
    if (diff >= -10) {
      return {
        label: 'Slightly Below',
        colorClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    }
    return {
      label: 'Significantly Below',
      colorClass: 'bg-red-100 text-red-800 border-red-200',
    };
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
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Target className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Share of Shelf (SOS) Report
                </h1>
                <p className="text-xs text-gray-600 mt-1">
                  View brand SOS performance by outlet and rep
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
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                <Download className="w-3 h-3" />
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
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
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search outlet, rep, brand, comment..."
              className="w-full pl-10 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-xs">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-xs text-gray-600">Loading SOS reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-600">No SOS reports found</p>
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
                        Outlet Account
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Rep
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Brand Facings
                      </th>
                      <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Total Facings
                      </th>
                      <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        SOS (%)
                      </th>
                      <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Outlet Target (%)
                      </th>
                      <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Variance (pp)
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                              {report.outletName || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-[10px] text-gray-900">
                            {report.outletAccountName || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-3 w-3 text-gray-400 mr-1.5" />
                            <span className="text-[10px] text-gray-900">
                              {report.repName || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-[10px] text-gray-900">
                            {report.brand_name}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <span className="text-[10px] text-gray-900">
                            {report.brand_facings}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <span className="text-[10px] text-gray-900">
                            {report.total_facings}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <Percent className="h-3 w-3 text-indigo-400" />
                            <span className="text-[10px] font-medium text-gray-900">
                              {formatPercent(report.sos)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <Percent className="h-3 w-3 text-indigo-400" />
                            <span className="text-[10px] font-medium text-gray-900">
                              {formatPercent(report.outlet_target)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          {(() => {
                            const sosVal = Number(report.sos || 0);
                            const targetVal = Number(report.outlet_target || 0);
                            const variance = targetVal - sosVal;
                            const formatted = variance.toFixed(2);
                            const positive = variance > 0;
                            const negative = variance < 0;
                            return (
                              <span
                                className={`text-[10px] font-medium ${
                                  positive
                                    ? 'text-green-600'
                                    : negative
                                    ? 'text-red-600'
                                    : 'text-gray-900'
                                }`}
                              >
                                {formatted}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {(() => {
                            const status = getStatusInfo(report.sos, report.outlet_target);
                            return (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 border rounded-full text-[10px] font-medium ${status.colorClass}`}
                              >
                                {status.label}
                              </span>
                            );
                          })()}
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

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-gray-700">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total,
                      )}{' '}
                      of {pagination.total} results
                    </span>
                    <select
                      value={pagination.limit}
                      onChange={(e) =>
                        handleLimitChange(parseInt(e.target.value, 10))
                      }
                      className="border border-gray-300 rounded-md px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
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
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      },
                    )}

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

        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          startDate={startDate}
          endDate={endDate}
          selectedOutlet={selectedOutlet}
          selectedRep={selectedRep}
          selectedBrand={selectedBrand === 'all' ? '' : selectedBrand}
          searchQuery={searchQuery}
          outlets={outlets}
          reps={reps}
          outletAccounts={outletAccounts}
          brands={brands}
          selectedOutletAccount={selectedOutletAccount}
          selectedTargetStatus={selectedTargetStatus}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onOutletChange={handleOutletChange}
          onRepChange={handleRepChange}
          onBrandChange={handleBrandChange}
          onOutletAccountChange={handleOutletAccountChange}
          onTargetStatusChange={handleTargetStatusChange}
          onSearchChange={handleSearchChange}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
        />
      </div>
    </div>
  );
};

export default SosReportPage;

