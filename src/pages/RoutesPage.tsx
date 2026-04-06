import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  ChevronDown,
  MapPin,
  Building2,
  User
} from 'lucide-react';
import { fetchWithAuth, getWithAuth, postWithAuth, putWithAuth, deleteWithAuth } from '../utils/fetchWithAuth';

interface Route {
  id: number;
  name: string;
  region: number;
  region_name: string;
  country_id: number;
  country_name: string;
  sales_rep_id: number;
  sales_rep_name: string;
  status: number;
}

interface Country { id: number; name: string; }
interface Region { id: number; name: string; }
interface SalesRep { id: number; name: string; }

const AddRouteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Route, 'id'>) => void;
  loading: boolean;
  countries: Country[];
  regions: Region[];
  salesReps: SalesRep[];
  onCountryChange: (country: string) => void;
}> = ({ isOpen, onClose, onSubmit, loading, countries, regions, salesReps, onCountryChange }) => {
  const [form, setForm] = useState<Omit<Route, 'id'>>({
    name: '',
    region: 0,
    region_name: '',
    country_id: 1, // Default to Kenya (ID = 1)
    country_name: 'Kenya',
    sales_rep_id: 0,
    sales_rep_name: '',
    status: 1,
  });

  useEffect(() => {
    if (isOpen) {
      // Set Kenya as default when modal opens
      const kenya = countries.find(c => c.id === 1 || c.name.toLowerCase() === 'kenya');
      if (kenya) {
        setForm(prev => ({ 
          ...prev,
          country_id: kenya.id, 
          country_name: kenya.name 
        }));
        onCountryChange(kenya.id.toString());
      }
    } else {
      setForm({ 
        name: '', 
        region: 0, 
        region_name: '', 
        country_id: 1, 
        country_name: 'Kenya', 
        sales_rep_id: 0, 
        sales_rep_name: '', 
        status: 1 
      });
    }
  }, [isOpen, countries, onCountryChange]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add New Route</h2>
          <p className="text-xs text-gray-600 mt-0.5">Enter route information below</p>
        </div>
        
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Route Name *</label>
            <input 
              type="text" 
              required 
              value={form.name} 
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
              placeholder="Enter route name"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
            <select 
              value={form.region} 
              onChange={e => {
                const region = regions.find(r => r.id === parseInt(e.target.value));
                setForm(f => ({ 
                  ...f, 
                  region: parseInt(e.target.value), 
                  region_name: region?.name || ''
                })); 
              }} 
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
            >
              <option value="">Select region</option>
              {regions.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sales Representative</label>
            <select 
              value={form.sales_rep_id} 
              onChange={e => {
                const salesRep = salesReps.find(s => s.id === parseInt(e.target.value));
                setForm(f => ({ 
                  ...f, 
                  sales_rep_id: parseInt(e.target.value), 
                  sales_rep_name: salesRep?.name || ''
                })); 
              }} 
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              <option value="">Select sales representative</option>
              {salesReps.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={form.status} 
              onChange={e => setForm(f => ({ ...f, status: parseInt(e.target.value) }))} 
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {loading ? 'Saving...' : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add Route
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRoute, setEditRoute] = useState<Route | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch countries when modal opens
  useEffect(() => {
    if (modalOpen || editModalOpen) {
      getWithAuth('/api/sales/countries')
        .then(res => res.json())
        .then(data => {
          setCountries(data);
          // Set Kenya as default country
          const kenya = data.find((c: Country) => c.id === 1 || c.name.toLowerCase() === 'kenya');
          if (kenya && modalOpen) {
            setSelectedCountry(kenya.id.toString());
          }
        })
        .catch(err => console.error('Failed to fetch countries:', err));
      
      getWithAuth('/api/sales-reps?status=1')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSalesReps(data.data.map((rep: any) => ({ id: rep.id, name: rep.name })));
          }
        })
        .catch(err => console.error('Failed to fetch sales reps:', err));
    }
  }, [modalOpen, editModalOpen]);

  // Ensure edit route has Kenya set when countries are loaded
  useEffect(() => {
    if (editModalOpen && editRoute && countries.length > 0) {
      const kenya = countries.find(c => c.id === 1 || c.name.toLowerCase() === 'kenya');
      if (kenya && editRoute.country_id !== kenya.id) {
        setEditRoute({
          ...editRoute,
          country_id: kenya.id,
          country_name: kenya.name
        });
        setSelectedCountry(kenya.id.toString());
      }
    }
  }, [editModalOpen, editRoute, countries]);

  // Fetch regions for Kenya (ID = 1) when modal opens or when selectedCountry changes
  useEffect(() => {
    if (modalOpen || editModalOpen) {
      const countryId = editModalOpen && editRoute ? editRoute.country_id : (selectedCountry ? parseInt(selectedCountry) : 1);
      if (countryId) {
        getWithAuth(`/api/sales/regions?country_id=${countryId}`)
          .then(res => res.json())
          .then(data => setRegions(data))
          .catch(err => console.error('Failed to fetch regions:', err));
      }
    }
  }, [selectedCountry, countries, modalOpen, editModalOpen, editRoute]);

  const fetchRoutes = async (pageNum = page, pageLimit = limit, searchTerm = search) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(pageLimit),
      });
      if (searchTerm) params.append('search', searchTerm);
      const res = await getWithAuth(`/api/routes?${params.toString()}`);
      const data = await res.json();
      
      setRoutes(data.data || []);
      setPage(data.page || 1);
      setLimit(data.limit || 20);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch routes');
    }
    setLoading(false);
  };

  useEffect(() => { fetchRoutes(page, limit, search); }, [page, limit, search]);

  const handlePrevPage = () => { if (page > 1) setPage(page - 1); };
  const handleNextPage = () => { if (page < totalPages) setPage(page + 1); };
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value);
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };
  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleAdd = async (data: Omit<Route, 'id'>) => {
    setSubmitting(true);
    try {
      await postWithAuth('/api/routes', data);
      setModalOpen(false);
      await fetchRoutes();
    } catch (err: any) {
      setError(err.message || 'Failed to add route');
    }
    setSubmitting(false);
  };

  const handleEditClick = (route: Route) => {
    // Ensure country is set to Kenya
    const kenya = countries.find(c => c.id === 1 || c.name.toLowerCase() === 'kenya');
    setEditRoute({
      ...route,
      country_id: kenya?.id || 1,
      country_name: kenya?.name || 'Kenya'
    });
    setEditModalOpen(true);
    setEditError(null);
    // Set selected country for region fetching
    setSelectedCountry((kenya?.id || 1).toString());
  };

  const handleEditSave = async (updated: Route) => {
    setEditLoading(true);
    setEditError(null);
    try {
      await putWithAuth(`/api/routes/${updated.id}`, updated);
      setEditModalOpen(false);
      setEditRoute(null);
      await fetchRoutes();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update route');
    }
    setEditLoading(false);
  };

  const handleDeleteRoute = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await deleteWithAuth(`/api/routes/${id}`);
      await fetchRoutes();
    } catch (err: any) {
      setError(err.message || 'Failed to delete route');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Routes</h1>
            <p className="text-xs text-gray-600 mt-0.5">Manage delivery routes and their assignments</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setModalOpen(true)} 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Route
            </button>
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="mb-4">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchInputChange}
                placeholder="Search routes by name, region, or sales rep..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>
          
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-green-600" />
              <span>{total} total routes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-green-600" />
              <span>Page {page} of {totalPages}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">{error}</div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Route</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {routes.map(route => (
                    <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2">
                        <div>
                          <div className="text-xs font-medium text-gray-900">{route.name}</div>
                          <div className="text-[10px] text-gray-500">ID: {route.id}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-xs text-gray-900">{route.region_name}</div>
                        <div className="text-[10px] text-gray-500">{route.country_name}</div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          route.status === 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {route.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(route)}
                            className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Edit route"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoute(route.id)}
                            className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete route"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {routes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center">
                        <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-base font-medium text-gray-900 mb-1">No routes found</h3>
                        <p className="text-xs text-gray-600">Get started by adding your first route.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <span>Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results</span>
              </div>
              
              <div className="flex items-center gap-2">
                <select 
                  value={limit} 
                  onChange={handlePageSizeChange} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size} per page</option>
                  ))}
                </select>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handlePrevPage} 
                    disabled={page === 1} 
                    className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                  </button>
                  
                  <span className="px-2.5 py-1.5 text-xs text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  
                  <button 
                    onClick={handleNextPage} 
                    disabled={page === totalPages} 
                    className="p-1.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddRouteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
        loading={submitting}
        countries={countries}
        regions={regions}
        salesReps={salesReps}
        onCountryChange={setSelectedCountry}
      />
      
      {editModalOpen && editRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Edit Route</h2>
              <p className="text-xs text-gray-600 mt-0.5">Update route information</p>
            </div>
            
            <form
              onSubmit={e => {
                e.preventDefault();
                handleEditSave(editRoute);
              }}
              className="p-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Route Name *</label>
                <input
                  type="text"
                  required
                  value={editRoute.name}
                  onChange={e => setEditRoute({ ...editRoute, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
                <select
                  value={editRoute.region}
                  onChange={e => {
                    const region = regions.find(r => r.id === parseInt(e.target.value));
                    setEditRoute({ 
                      ...editRoute, 
                      region: parseInt(e.target.value), 
                      region_name: region?.name || ''
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
                >
                  <option value="">Select region</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sales Representative</label>
                <select
                  value={editRoute.sales_rep_id}
                  onChange={e => {
                    const salesRep = salesReps.find(s => s.id === parseInt(e.target.value));
                    setEditRoute({ 
                      ...editRoute, 
                      sales_rep_id: parseInt(e.target.value), 
                      sales_rep_name: salesRep?.name || ''
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  <option value="">Select sales representative</option>
                  {salesReps.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editRoute.status}
                  onChange={e => setEditRoute({ ...editRoute, status: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
              
              {editError && <div className="text-red-600 text-xs bg-red-50 p-2.5 rounded-lg">{editError}</div>}
              
              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setEditRoute(null); }}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutesPage;