import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  brandSosTargetService, 
  BrandSosTarget, 
  BrandSosTargetFilters 
} from '../services/brandSosTargetService';
import { Target, ArrowLeft, Filter, Search, Building2, Tag, Trash2, Edit, X } from 'lucide-react';
import axios from 'axios';

interface OutletAccount {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

// Filter Modal Component
const FilterModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  selectedOutlet: string;
  selectedBrand: string;
  outlets: OutletAccount[];
  brands: Brand[];
  onOutletChange: (outlet: string) => void;
  onBrandChange: (brand: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}> = ({ 
  isOpen, 
  onClose,
  selectedOutlet,
  selectedBrand,
  outlets,
  brands,
  onOutletChange,
  onBrandChange,
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
                Filter Targets
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="filter-outlet" className="block text-xs font-medium text-gray-700 mb-2">
                  Outlet Account
                </label>
                <select
                  id="filter-outlet"
                  value={selectedOutlet}
                  onChange={(e) => onOutletChange(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Outlets</option>
                  {outlets.map(outlet => (
                    <option key={outlet.id} value={outlet.id.toString()}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-brand" className="block text-xs font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <select
                  id="filter-brand"
                  value={selectedBrand}
                  onChange={(e) => onBrandChange(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </option>
                  ))}
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
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => {
                onResetFilters();
                onClose();
              }}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BrandSosTargetsPage: React.FC = () => {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<BrandSosTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [outlets, setOutlets] = useState<OutletAccount[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTargets = async (filters?: BrandSosTargetFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await brandSosTargetService.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setTargets(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch brand SOS targets');
    }
    setLoading(false);
  };

  const fetchOutlets = async () => {
    try {
      const res = await axios.get('/api/outlet-accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setOutlets(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch outlets:', err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await axios.get('/api/brands', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.success) {
        setBrands(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch brands:', err);
    }
  };

  useEffect(() => {
    fetchOutlets();
    fetchBrands();
  }, []);

  useEffect(() => {
    const filters: BrandSosTargetFilters = {};
    if (selectedOutlet !== 'all') {
      filters.outlet_account_id = parseInt(selectedOutlet);
    }
    if (selectedBrand !== 'all') {
      filters.brand_id = parseInt(selectedBrand);
    }
    fetchTargets(filters);
  }, [selectedOutlet, selectedBrand, pagination.page, pagination.limit]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Filter locally for search
  };

  const handleResetFilters = () => {
    setSelectedOutlet('all');
    setSelectedBrand('all');
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this target?')) {
      return;
    }

    setDeletingId(id);
    try {
      await brandSosTargetService.deleteTarget(id);
      // Refresh the list
      const filters: BrandSosTargetFilters = {};
      if (selectedOutlet !== 'all') {
        filters.outlet_account_id = parseInt(selectedOutlet);
      }
      if (selectedBrand !== 'all') {
        filters.brand_id = parseInt(selectedBrand);
      }
      await fetchTargets(filters);
    } catch (err: any) {
      setError(err.message || 'Failed to delete target');
    }
    setDeletingId(null);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const filteredTargets = targets.filter(target => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      target.outlet_account_name?.toLowerCase().includes(query) ||
      target.brand_name?.toLowerCase().includes(query) ||
      target.target_percentage.toString().includes(query)
    );
  });

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedOutlet !== 'all') count++;
    if (selectedBrand !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  };

  return (
    <div className="w-full py-4 px-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Brand SOS Targets</h1>
            <p className="text-xs text-gray-600 mt-1">
              View and manage all brand Share of Shelf targets across outlet accounts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[10px]">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <div className="text-red-600 mt-0.5">
            <X className="w-4 h-4" />
          </div>
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by outlet, brand, or target percentage..."
            className="w-full pl-10 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filter Summary */}
      {(selectedOutlet !== 'all' || selectedBrand !== 'all' || searchQuery.trim()) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-600">Active filters:</span>
          {selectedOutlet !== 'all' && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              Outlet: {outlets.find(o => o.id.toString() === selectedOutlet)?.name}
            </span>
          )}
          {selectedBrand !== 'all' && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              Brand: {brands.find(b => b.id.toString() === selectedBrand)?.name}
            </span>
          )}
          {searchQuery.trim() && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              Search: {searchQuery}
            </span>
          )}
          <button
            onClick={handleResetFilters}
            className="px-2 py-1 text-blue-600 hover:text-blue-800 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-xs text-gray-600 mt-3">Loading targets...</p>
        </div>
      ) : filteredTargets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            No targets found
          </h3>
          <p className="text-xs text-gray-600">
            {searchQuery.trim() || selectedOutlet !== 'all' || selectedBrand !== 'all'
              ? 'Try adjusting your filters'
              : 'No brand SOS targets have been set yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Outlet Account
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Target %
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTargets.map(target => (
                  <tr key={target.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-900">
                          {target.outlet_account_name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-900">
                          {target.brand_name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                        {target.target_percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        {target.updated_at 
                          ? new Date(target.updated_at).toLocaleDateString()
                          : target.created_at
                          ? new Date(target.created_at).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(target.id)}
                        disabled={deletingId === target.id}
                        className="p-1 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} targets
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedOutlet={selectedOutlet}
        selectedBrand={selectedBrand}
        outlets={outlets}
        brands={brands}
        onOutletChange={setSelectedOutlet}
        onBrandChange={setSelectedBrand}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
};

export default BrandSosTargetsPage;
