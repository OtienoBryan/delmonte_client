import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

interface PublicHoliday {
  id: number;
  name: string;
  date: string;
  country: string;
  is_recurring: boolean;
}

const PublicHolidaysPage: React.FC = () => {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [filteredHolidays, setFilteredHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState(() => {
    const now = new Date();
    return now.getFullYear().toString();
  });
  const [countryFilter, setCountryFilter] = useState('Kenya');
  
  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<PublicHoliday | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    country: 'Kenya',
    is_recurring: false
  });

  // Fetch holidays
  useEffect(() => {
    fetchHolidays();
  }, [yearFilter, countryFilter]);

  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (yearFilter) params.append('year', yearFilter);
      if (countryFilter) params.append('country', countryFilter);
      
      const response = await api.get(`/public-holidays?${params.toString()}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setHolidays(data);
      setFilteredHolidays(data);
    } catch (err: any) {
      console.error('Error fetching holidays:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch holidays');
      setHolidays([]);
      setFilteredHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter holidays based on search
  useEffect(() => {
    let filtered = holidays;
    
    if (searchTerm) {
      filtered = filtered.filter(holiday =>
        holiday.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredHolidays(filtered);
  }, [searchTerm, holidays]);

  const openAddModal = () => {
    setEditingHoliday(null);
    setFormData({
      name: '',
      date: '',
      country: 'Kenya',
      is_recurring: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (holiday: PublicHoliday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date.slice(0, 10), // Format date for input
      country: holiday.country,
      is_recurring: holiday.is_recurring
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHoliday(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.date) {
      setError('Name and date are required');
      return;
    }

    try {
      if (editingHoliday) {
        // Update existing holiday
        await api.put(`/public-holidays/${editingHoliday.id}`, formData);
      } else {
        // Add new holiday
        await api.post('/public-holidays', formData);
      }
      
      closeModal();
      fetchHolidays();
      setError(null);
    } catch (err: any) {
      console.error('Error saving holiday:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save holiday');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      await api.delete(`/public-holidays/${id}`);
      fetchHolidays();
      setError(null);
    } catch (err: any) {
      console.error('Error deleting holiday:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete holiday');
    }
  };

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 3; i++) {
      years.push(i.toString());
    }
    return years;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-sm font-bold text-gray-900">Public Holidays Management</h1>
            <p className="text-[10px] text-gray-600 mt-0.5">Manage Kenya public holidays</p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-2.5 py-1 text-xs border border-transparent font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Holiday
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-3">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-1.5" />
              <span className="text-xs text-red-600 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Filter className="h-3 w-3 text-gray-500" />
            <h3 className="text-xs font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Year</label>
              <select
                className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={yearFilter}
                onChange={e => setYearFilter(e.target.value)}
              >
                {getYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Country</label>
              <select
                className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={countryFilter}
                onChange={e => setCountryFilter(e.target.value)}
              >
                <option value="Kenya">Kenya</option>
                <option value="">All Countries</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="h-3 w-3 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search holidays..."
                  className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Holidays Table */}
        {loading ? (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-xs text-gray-600">Loading holidays...</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-900">
                  Public Holidays ({filteredHolidays.length})
                </h3>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Holiday Name
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Recurring
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHolidays.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center">
                        <div className="flex flex-col items-center">
                          <Calendar className="h-8 w-8 text-gray-300 mb-2" />
                          <h3 className="text-xs font-medium text-gray-900 mb-1">No holidays found</h3>
                          <p className="text-[10px] text-gray-500">Try adjusting your filters or add a new holiday.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredHolidays.map(holiday => (
                      <tr key={holiday.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {new Date(holiday.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {holiday.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-blue-100 text-blue-800">
                            {holiday.country}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {holiday.is_recurring ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-green-100 text-green-800">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-gray-100 text-gray-800">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(holiday)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(holiday.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">
                      Holiday Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., New Year's Day"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                    >
                      <option value="Kenya">Kenya</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.is_recurring}
                      onChange={e => setFormData({ ...formData, is_recurring: e.target.checked })}
                    />
                    <label htmlFor="is_recurring" className="ml-2 text-[10px] text-gray-700">
                      Recurring holiday (same date every year)
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {editingHoliday ? 'Update' : 'Add'} Holiday
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicHolidaysPage;

