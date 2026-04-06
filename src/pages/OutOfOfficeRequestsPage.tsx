import React, { useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiEye, FiCheck, FiX, FiUser, FiCalendar, FiClock, FiDownload, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface OutOfOfficeRequest {
  id: number;
  staff_id: number;
  staff_name: string;
  staff_role?: string;
  photo_url?: string;
  date: string;
  reason: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
}

interface Staff {
  id: number;
  name: string;
  role: string;
  empl_no: string;
}

const OutOfOfficeRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<OutOfOfficeRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<OutOfOfficeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterReason, setFilterReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'staff' | 'status' | 'created'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<OutOfOfficeRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    staff_id: '',
    date: '',
    reason: '',
    comment: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected'
  });

  useEffect(() => {
    fetchStaff();
    fetchRequests();
  }, []);

  useEffect(() => {
    filterAndSortRequests();
  }, [requests, searchTerm, filterStaff, filterStatus, filterReason, startDate, endDate, sortBy, sortOrder]);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/staff');
      setStaffList(response.data);
    } catch (err) {
      setStaffList([]);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStaff) params.append('staff_id', filterStaff);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await api.get(`/out-of-office-requests?${params.toString()}`);
      setRequests(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRequests = () => {
    let filtered = [...requests];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.approved_by?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filterStaff) {
      filtered = filtered.filter(r => r.staff_id.toString() === filterStaff);
    }
    if (filterStatus) {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
    if (filterReason) {
      filtered = filtered.filter(r => r.reason.toLowerCase().includes(filterReason.toLowerCase()));
    }
    if (startDate) {
      filtered = filtered.filter(r => new Date(r.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(r => new Date(r.date) <= new Date(endDate));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'staff':
          aValue = a.staff_name.toLowerCase();
          bValue = b.staff_name.toLowerCase();
          break;
        case 'status':
          const statusOrder = { pending: 1, approved: 2, rejected: 3 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'created':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredRequests(filtered);
  };

  const handleStatusChange = async (requestId: number, newStatus: 'approved' | 'rejected') => {
    setActionLoading(requestId);
    try {
      await api.patch(`/out-of-office-requests/${requestId}`, { 
        status: newStatus,
        approved_by: user?.name || user?.username || user?.email || 'System',
        approved_at: new Date().toISOString()
      });
      
      await fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || `Failed to ${newStatus} request`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    
    try {
      await api.delete(`/out-of-office-requests/${requestId}`);
      await fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete request');
    }
  };

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staff_id || !formData.date || !formData.reason) return;
    
    try {
      await api.post('/out-of-office-requests', formData);
      
      setFormData({ staff_id: '', date: '', reason: '', comment: '', status: 'pending' });
      setShowAddModal(false);
      await fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create request');
    }
  };

  const handleEditRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest || !formData.staff_id || !formData.date || !formData.reason) return;
    
    try {
      await api.put(`/out-of-office-requests/${editingRequest.id}`, formData);
      
      setShowEditModal(false);
      setEditingRequest(null);
      await fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update request');
    }
  };

  const openEditModal = (request: OutOfOfficeRequest) => {
    setEditingRequest(request);
    setFormData({
      staff_id: request.staff_id.toString(),
      date: request.date,
      reason: request.reason,
      comment: request.comment,
      status: request.status
    });
    setShowEditModal(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStaff('');
    setFilterStatus('');
    setFilterReason('');
    setStartDate('');
    setEndDate('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getReasonColor = (reason: string) => {
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('sick') || reasonLower.includes('illness')) {
      return 'bg-red-50 text-red-700';
    } else if (reasonLower.includes('vacation') || reasonLower.includes('holiday')) {
      return 'bg-blue-50 text-blue-700';
    } else if (reasonLower.includes('personal') || reasonLower.includes('family')) {
      return 'bg-purple-50 text-purple-700';
    } else if (reasonLower.includes('emergency')) {
      return 'bg-orange-50 text-orange-700';
    }
    return 'bg-gray-50 text-gray-700';
  };

  const getStats = () => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    
    return { total, pending, approved, rejected };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-[10px] text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <div className="bg-white rounded-lg shadow border border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-gray-900">Out of Office Requests</h1>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Manage and track employee out-of-office requests and approvals
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchRequests}
                  className="inline-flex items-center px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiRefreshCw className="w-3 h-3 mr-1.5" />
                  Refresh
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-2.5 py-1 text-[10px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiPlus className="w-3 h-3 mr-1.5" />
                  New Request
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
            <div className="flex items-center">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <FiCalendar className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-[10px] font-medium text-gray-600">Total Requests</p>
                <p className="text-sm font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
            <div className="flex items-center">
              <div className="p-1.5 bg-yellow-100 rounded-lg">
                <FiClock className="w-3.5 h-3.5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-[10px] font-medium text-gray-600">Pending</p>
                <p className="text-sm font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
            <div className="flex items-center">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <FiCheck className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-[10px] font-medium text-gray-600">Approved</p>
                <p className="text-sm font-semibold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
            <div className="flex items-center">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <FiX className="w-3.5 h-3.5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-[10px] font-medium text-gray-600">Rejected</p>
                <p className="text-sm font-semibold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-4">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <FiSearch className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-8 pr-3 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                {/* Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-2.5 py-1 border border-gray-300 rounded-lg text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <FiFilter className="w-3 h-3 mr-1.5" />
                  Filters
                  {(filterStaff || filterStatus || filterReason || startDate || endDate) && (
                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800">
                      Active
                    </span>
                  )}
                </button>

                {/* Export */}
                <button
                  className="inline-flex items-center px-2.5 py-1 border border-gray-300 rounded-lg text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <FiDownload className="w-3 h-3 mr-1.5" />
                  Export
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Employee</label>
                    <select
                      value={filterStaff}
                      onChange={(e) => setFilterStaff(e.target.value)}
                      className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    >
                      <option value="">All Employees</option>
                      {staffList.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Reason</label>
                    <input
                      type="text"
                      value={filterReason}
                      onChange={(e) => setFilterReason(e.target.value)}
                      placeholder="Search by reason..."
                      className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-4">
            <div className="flex items-center">
              <div className="text-[10px] text-red-600 font-medium">Error:</div>
              <div className="text-[10px] text-red-700 ml-2">{error}</div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700 text-sm"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSortBy('staff');
                      setSortOrder(sortBy === 'staff' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center">
                      <FiUser className="w-3 h-3 mr-1.5" />
                      Employee
                      {sortBy === 'staff' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSortBy('date');
                      setSortOrder(sortBy === 'date' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center">
                      <FiCalendar className="w-3 h-3 mr-1.5" />
                      Date
                      {sortBy === 'date' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Comment
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSortBy('status');
                      setSortOrder(sortBy === 'status' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center">
                      Status
                      {sortBy === 'status' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Approved By
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSortBy('created');
                      setSortOrder(sortBy === 'created' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <div className="flex items-center">
                      <FiClock className="w-3 h-3 mr-1.5" />
                      Created
                      {sortBy === 'created' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="relative px-3 py-2">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center">
                      <FiCalendar className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                      <div className="text-sm font-medium text-gray-500">No requests found</div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {searchTerm || filterStaff || filterStatus || filterReason || startDate || endDate
                          ? 'Try adjusting your search or filters'
                          : 'No out-of-office requests have been submitted yet'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-6 w-6">
                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <FiUser className="h-3 w-3 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-2">
                            <div className="text-[10px] font-medium text-gray-900">{request.staff_name}</div>
                            <div className="text-[10px] text-gray-500">{request.staff_role || 'Employee'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex-shrink-0 h-8 w-8">
                          {request.photo_url ? (
                            <img
                              src={request.photo_url}
                              alt={request.staff_name}
                              className="h-8 w-8 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                              <FiUser className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">
                          {new Date(request.date).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {new Date(request.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getReasonColor(request.reason)}`}>
                          {request.reason}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-[10px] text-gray-900 max-w-xs">
                          <div className="truncate" title={request.comment}>
                            {request.comment || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900">
                        {request.approved_by || '-'}
                        {request.approved_at && (
                          <div className="text-[10px] text-gray-500">
                            {new Date(request.approved_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-900">
                        {new Date(request.created_at).toLocaleDateString()}
                        <div className="text-[10px] text-gray-500">
                          {new Date(request.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-[10px] font-medium">
                        <div className="flex items-center justify-end space-x-1">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(request.id, 'approved')}
                                disabled={actionLoading === request.id}
                                className="text-green-600 hover:text-green-900 p-0.5 rounded hover:bg-green-50 disabled:opacity-50 transition-colors"
                                title="Approve request"
                              >
                                <FiCheck className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(request.id, 'rejected')}
                                disabled={actionLoading === request.id}
                                className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                                title="Reject request"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEditModal(request)}
                            className="text-blue-600 hover:text-blue-900 p-0.5 rounded hover:bg-blue-50 transition-colors"
                            title="Edit request"
                          >
                            <FiEdit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(request.id)}
                            className="text-red-600 hover:text-red-900 p-0.5 rounded hover:bg-red-50 transition-colors"
                            title="Delete request"
                          >
                            <FiTrash2 className="w-3 h-3" />
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

        {/* Add Request Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">New Out-of-Office Request</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAddRequest} className="px-4 py-4 space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Employee *</label>
                  <select
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    required
                  >
                    <option value="">Select Employee</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} ({staff.role})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Reason *</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    placeholder="e.g., Sick leave, Vacation, Personal"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Comment</label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    rows={3}
                    placeholder="Additional details..."
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-[10px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Request Modal */}
        {showEditModal && editingRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Edit Request</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleEditRequest} className="px-4 py-4 space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Employee</label>
                  <div className="block w-full px-2 py-1 bg-gray-50 border border-gray-300 rounded-lg text-[10px] text-gray-700">
                    {editingRequest.staff_name}
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Reason *</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Comment</label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="block w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-[10px]"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-2.5 py-1 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-[10px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Request
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

export default OutOfOfficeRequestsPage;