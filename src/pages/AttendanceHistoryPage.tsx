import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiDownload, FiRefreshCw, FiUser, FiClock, FiCalendar, FiCheck, FiX, FiChevronLeft, FiChevronRight, FiUsers, FiAlertCircle, FiEdit2, FiSave, FiPlus } from 'react-icons/fi';
import api from '../services/api';

interface AttendanceRecord {
  id: number;
  staff_id: number;
  name: string;
  department: string;
  role?: string;
  photo_url?: string;
  date: string;
  checkin_time: string | null;
  checkout_time: string | null;
  corrected?: boolean;
  created_at: string;
  updated_at: string;
}

interface Staff {
  id: number;
  name: string;
  role: string;
  department: string;
  photo_url?: string;
}

const PAGE_SIZE = 20;

const AttendanceHistoryPage: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10)); // Today's date as default
  const [endDate, setEndDate] = useState('');
  const [staffId, setStaffId] = useState('');
  const [department, setDepartment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'department' | 'checkin'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    checkin_time: '',
    checkout_time: '',
    date: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    staff_id: '',
    date: '',
    checkin_time: '',
    checkout_time: ''
  });
  const [addLoading, setAddLoading] = useState(false);
  const [monthlyRecordCount, setMonthlyRecordCount] = useState(0);
  const [existingRecordForDate, setExistingRecordForDate] = useState<AttendanceRecord | null>(null);
  const navigate = useNavigate();

  // Fetch staff list for filter dropdown
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await api.get('/staff');
        setStaffList(response.data);
      } catch (err) {
        setError('Failed to fetch staff list');
      }
    };
    fetchStaff();
  }, []);

  // Fetch attendance with filters
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (staffId) params.append('staff_id', staffId);
        const response = await api.get(`/attendance?${params.toString()}`);
        setAttendance(response.data);
        setPage(1); // Reset to first page on filter change
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch attendance data');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [startDate, endDate, staffId]);

  // Filter and sort attendance
  useEffect(() => {
    let filtered = [...attendance];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply department filter
    if (department) {
      filtered = filtered.filter(record => record.department === department);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'department':
          aValue = a.department.toLowerCase();
          bValue = b.department.toLowerCase();
          break;
        case 'checkin':
          aValue = a.checkin_time ? new Date(a.checkin_time).getTime() : 0;
          bValue = b.checkin_time ? new Date(b.checkin_time).getTime() : 0;
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

    setFilteredAttendance(filtered);
  }, [attendance, searchTerm, department, sortBy, sortOrder]);

  const paginated = filteredAttendance.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filteredAttendance.length / PAGE_SIZE);

  // Helper functions
  const getDepartments = () => {
    const departments = [...new Set(attendance.map(record => record.department))];
    return departments.filter(dept => dept && dept.trim() !== '');
  };

  const getStats = () => {
    const total = attendance.length;
    const present = attendance.filter(record => record.checkin_time).length;
    const absent = total - present;
    const late = attendance.filter(record => {
      if (!record.checkin_time) return false;
      const checkinTime = new Date(record.checkin_time);
      const expectedTime = new Date(record.date + ' 09:00:00'); // Assuming 9 AM start time
      return checkinTime > expectedTime;
    }).length;
    
    return { total, present, absent, late };
  };

  const calculateTimeSpent = (checkin: string | null, checkout: string | null) => {
    if (!checkin) return null;
    const checkinTime = new Date(checkin);
    const checkoutTime = checkout ? new Date(checkout) : new Date();
    const diffMs = checkoutTime.getTime() - checkinTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    return { hours, minutes };
  };

  const getStatusColor = (record: AttendanceRecord) => {
    if (!record.checkin_time) return 'bg-red-100 text-red-800 border-red-200';
    if (!record.checkout_time) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusText = (record: AttendanceRecord) => {
    if (!record.checkin_time) return 'Absent';
    if (!record.checkout_time) return 'Present (No Checkout)';
    return 'Present';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate(new Date().toISOString().slice(0, 10)); // Reset to today's date
    setEndDate('');
    setStaffId('');
    setDepartment('');
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Department', 'Role', 'Date', 'Check-in', 'Check-out', 'Status', 'Time Spent', 'Corrected'];
    const csvContent = [
      headers.join(','),
      ...filteredAttendance.map(record => {
        const timeSpent = calculateTimeSpent(record.checkin_time, record.checkout_time);
        const timeSpentStr = timeSpent ? `${timeSpent.hours}h ${timeSpent.minutes}m` : '-';
        return [
          record.name,
          record.department,
          record.role || '-',
          record.date,
          record.checkin_time ? new Date(record.checkin_time).toLocaleTimeString() : '-',
          record.checkout_time ? new Date(record.checkout_time).toLocaleTimeString() : '-',
          getStatusText(record),
          timeSpentStr,
          record.corrected ? 'Yes' : 'No'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Edit functions
  const openEditModal = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditFormData({
      checkin_time: record.checkin_time ? new Date(record.checkin_time).toISOString().slice(0, 16) : '',
      checkout_time: record.checkout_time ? new Date(record.checkout_time).toISOString().slice(0, 16) : '',
      date: record.date
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingRecord(null);
    setEditFormData({
      checkin_time: '',
      checkout_time: '',
      date: ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setEditLoading(true);
    try {
      const updateData = {
        checkin_time: editFormData.checkin_time ? new Date(editFormData.checkin_time).toISOString() : null,
        checkout_time: editFormData.checkout_time ? new Date(editFormData.checkout_time).toISOString() : null,
        date: editFormData.date
      };

      await api.put(`/attendance/${editingRecord.id}`, updateData);

      // Refresh the data
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (staffId) params.append('staff_id', staffId);
      const refreshResponse = await api.get(`/attendance?${params.toString()}`);
      setAttendance(refreshResponse.data);

      closeEditModal();
    } catch (err: any) {
      setError(err.message || 'Failed to update attendance record');
    } finally {
      setEditLoading(false);
    }
  };

  // Add record functions
  const openAddModal = () => {
    setAddFormData({
      staff_id: '',
      date: new Date().toISOString().slice(0, 10), // Today's date as default
      checkin_time: '',
      checkout_time: ''
    });
    setMonthlyRecordCount(0);
    setShowAddModal(true);
  };

  // Check monthly record count for selected employee
  const checkMonthlyRecordCount = async (staffId: string, date: string) => {
    if (!staffId || !date) {
      setMonthlyRecordCount(0);
      return;
    }

    try {
      const recordDate = new Date(date);
      const year = recordDate.getFullYear();
      const month = recordDate.getMonth() + 1;
      
      const params = new URLSearchParams();
      params.append('staff_id', staffId);
      params.append('year', year.toString());
      params.append('month', month.toString());
      
      try {
        const response = await api.get(`/attendance/monthly-count?${params.toString()}`);
        setMonthlyRecordCount(response.data.count || 0);
      } catch (err) {
        // Ignore errors for monthly count
      }
    } catch (error) {
      console.error('Error checking monthly record count:', error);
      setMonthlyRecordCount(0);
    }
  };

  const checkExistingRecordForDate = async (staffId: string, date: string) => {
    if (!staffId || !date) {
      setExistingRecordForDate(null);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('staff_id', staffId);
      params.append('date', date);
      
      const response = await api.get(`/attendance?${params.toString()}`);
      if (response.data.length > 0) {
        setExistingRecordForDate(response.data[0]);
      } else {
        setExistingRecordForDate(null);
      }
    } catch (error) {
      console.error('Error checking existing record:', error);
      setExistingRecordForDate(null);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddFormData({
      staff_id: '',
      date: '',
      checkin_time: '',
      checkout_time: ''
    });
    setMonthlyRecordCount(0);
  };

  // Check monthly record count and existing records when staff or date changes
  useEffect(() => {
    if (addFormData.staff_id && addFormData.date) {
      checkMonthlyRecordCount(addFormData.staff_id, addFormData.date);
      checkExistingRecordForDate(addFormData.staff_id, addFormData.date);
    } else {
      setExistingRecordForDate(null);
    }
  }, [addFormData.staff_id, addFormData.date]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.staff_id || !addFormData.date) return;

    setAddLoading(true);
    try {
      const createData = {
        staff_id: parseInt(addFormData.staff_id),
        date: addFormData.date,
        checkin_time: addFormData.checkin_time ? new Date(addFormData.checkin_time).toISOString() : null,
        checkout_time: addFormData.checkout_time ? new Date(addFormData.checkout_time).toISOString() : null
      };

      await api.post('/attendance', createData);

      // Refresh the data
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (staffId) params.append('staff_id', staffId);
      const refreshResponse = await api.get(`/attendance?${params.toString()}`);
      setAttendance(refreshResponse.data);

      closeAddModal();
    } catch (err: any) {
      setError(err.message || 'Failed to create attendance record');
    } finally {
      setAddLoading(false);
    }
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance History</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track and manage employee attendance records (showing today's records by default)
            </p>
          </div>
                    <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiChevronLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Record
            </button>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <FiDownload className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.present}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiX className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.absent}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiAlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Late Arrivals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.late}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, department, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                <FiFilter className="w-4 h-4 mr-2" />
                Filters
                {(startDate || endDate || staffId || department) && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                    Active
                  </span>
                )}
              </button>

              {/* Refresh */}
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                <FiRefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
      </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {startDate === new Date().toISOString().slice(0, 10) && (
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                Today
              </span>
            )}
          </div>
        </div>
                
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
                
        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <select
            value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">All Departments</option>
                    {getDepartments().map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
            ))}
          </select>
        </div>
                
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-600 font-medium">Error:</div>
            <div className="text-red-700 ml-2">{error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setSortBy('name');
                    setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  <div className="flex items-center">
                    <FiUser className="w-4 h-4 mr-2" />
                    Employee
                    {sortBy === 'name' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setSortBy('department');
                    setSortOrder(sortBy === 'department' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  <div className="flex items-center">
                    Department
                    {sortBy === 'department' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setSortBy('date');
                    setSortOrder(sortBy === 'date' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  <div className="flex items-center">
                    <FiCalendar className="w-4 h-4 mr-2" />
                    Date
                    {sortBy === 'date' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setSortBy('checkin');
                    setSortOrder(sortBy === 'checkin' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  <div className="flex items-center">
                    <FiClock className="w-4 h-4 mr-2" />
                    Check-in
                    {sortBy === 'checkin' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
      </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-out
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Spent
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Corrected
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    <FiCalendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <div className="text-lg font-medium">No attendance records found</div>
                    <div className="text-sm">
                      {searchTerm || startDate || endDate || staffId || department
                        ? 'Try adjusting your search or filters'
                        : 'No attendance records available for today'}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((record) => {
                  const checkin = record.checkin_time ? new Date(record.checkin_time) : null;
                  const checkout = record.checkout_time ? new Date(record.checkout_time) : null;
                  const timeSpent = calculateTimeSpent(record.checkin_time, record.checkout_time);
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <FiUser className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{record.name}</div>
                            <div className="text-sm text-gray-500">{record.role || 'Employee'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex-shrink-0 h-12 w-12">
                          {record.photo_url ? (
                            <img
                              src={record.photo_url}
                              alt={record.name}
                              className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                              <FiUser className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.department || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {record.date ? new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {checkin ? checkin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {checkout ? checkout.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {timeSpent ? `${timeSpent.hours}h ${timeSpent.minutes}m` : '-'}
                        </div>
                      </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record)}`}>
                          {getStatusText(record)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.corrected ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                            <FiEdit2 className="w-3 h-3 mr-1" />
                            Corrected
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <FiCheck className="w-3 h-3 mr-1" />
                            Original
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(record)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors duration-150"
                          title="Edit attendance record"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>

          {/* Pagination */}
          {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * PAGE_SIZE, filteredAttendance.length)}</span> of{' '}
                  <span className="font-medium">{filteredAttendance.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
        </div>
              )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Edit Attendance Record</h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="px-6 py-6 space-y-4">
              {/* Employee Info (Read-only) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Employee Information</h4>
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    {editingRecord.photo_url ? (
                      <img
                        src={editingRecord.photo_url}
                        alt={editingRecord.name}
                        className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{editingRecord.name}</div>
                    <div className="text-sm text-gray-500">{editingRecord.role || 'Employee'} • {editingRecord.department}</div>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              {/* Check-in Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
                <input
                  type="datetime-local"
                  value={editFormData.checkin_time}
                  onChange={(e) => setEditFormData({ ...editFormData, checkin_time: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Leave empty if employee was absent</p>
              </div>

              {/* Check-out Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Time</label>
                <input
                  type="datetime-local"
                  value={editFormData.checkout_time}
                  onChange={(e) => setEditFormData({ ...editFormData, checkout_time: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Leave empty if employee didn't check out</p>
              </div>

              {/* Time Spent Preview */}
              {editFormData.checkin_time && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-900">Time Spent Preview:</div>
                  <div className="text-sm text-blue-700">
                    {(() => {
                      const checkin = new Date(editFormData.checkin_time);
                      const checkout = editFormData.checkout_time ? new Date(editFormData.checkout_time) : new Date();
                      const diffMs = checkout.getTime() - checkin.getTime();
                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
                      return `${hours}h ${minutes}m`;
                    })()}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4 mr-2" />
                      Update Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Add Attendance Record</h3>
              <button
                onClick={closeAddModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="px-6 py-6 space-y-4">
              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select
                  value={addFormData.staff_id}
                  onChange={(e) => setAddFormData({ ...addFormData, staff_id: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">Select Employee</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role}) - {staff.department}
                    </option>
                  ))}
                </select>
                {/* Existing Record Warning */}
                {existingRecordForDate && (
                  <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center">
                      <FiAlertCircle className="w-4 h-4 text-red-500 mr-2" />
                      <div className="text-sm text-red-900">
                        <strong>Record Already Exists:</strong> This employee already has an attendance record for {new Date(existingRecordForDate.date).toLocaleDateString()}.
                      </div>
                    </div>
                    <div className="text-xs text-red-700 mt-2">
                      Check-in: {existingRecordForDate.checkin_time ? new Date(existingRecordForDate.checkin_time).toLocaleTimeString() : 'Not recorded'} | 
                      Check-out: {existingRecordForDate.checkout_time ? new Date(existingRecordForDate.checkout_time).toLocaleTimeString() : 'Not recorded'}
                    </div>
                    <div className="text-xs text-red-700 mt-1">
                      Please choose a different date or edit the existing record.
                    </div>
                  </div>
                )}

                {/* Monthly Record Count Info */}
                {addFormData.staff_id && addFormData.date && !existingRecordForDate && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-900">
                      <strong>Total Records:</strong> {monthlyRecordCount}/2 for this month
                    </div>
                    {monthlyRecordCount >= 2 && (
                      <div className="text-sm text-red-600 mt-1">
                        ⚠️ Maximum records reached. Cannot add more records for this employee this month.
                      </div>
                    )}
                    <div className="text-xs text-blue-700 mt-2">
                      <strong>Note:</strong> Manually created records are marked as "Corrected" but still count toward the monthly limit.
                    </div>
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={addFormData.date}
                  onChange={(e) => setAddFormData({ ...addFormData, date: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              {/* Check-in Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
                <input
                  type="datetime-local"
                  value={addFormData.checkin_time}
                  onChange={(e) => setAddFormData({ ...addFormData, checkin_time: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Leave empty if employee was absent</p>
              </div>

              {/* Check-out Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Time</label>
                <input
                  type="datetime-local"
                  value={addFormData.checkout_time}
                  onChange={(e) => setAddFormData({ ...addFormData, checkout_time: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Leave empty if employee didn't check out</p>
              </div>

              {/* Time Spent Preview */}
              {addFormData.checkin_time && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-900">Time Spent Preview:</div>
                  <div className="text-sm text-blue-700">
                    {(() => {
                      const checkin = new Date(addFormData.checkin_time);
                      const checkout = addFormData.checkout_time ? new Date(addFormData.checkout_time) : new Date();
                      const diffMs = checkout.getTime() - checkin.getTime();
                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
                      return `${hours}h ${minutes}m`;
                    })()}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={addLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading || !addFormData.staff_id || !addFormData.date || monthlyRecordCount >= 2 || !!existingRecordForDate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                >
                  {addLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : existingRecordForDate ? (
                    <>
                      <FiX className="w-4 h-4 mr-2" />
                      Record Exists
                    </>
                  ) : monthlyRecordCount >= 2 ? (
                    <>
                      <FiX className="w-4 h-4 mr-2" />
                      Monthly Limit Reached
                    </>
                  ) : (
                    <>
                      <FiPlus className="w-4 h-4 mr-2" />
                      Create Record (Corrected)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistoryPage; 