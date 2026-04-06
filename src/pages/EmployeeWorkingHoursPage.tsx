import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Filter,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { API_CONFIG } from '../config/api';
import api from '../services/api';

interface WorkingHourRecord {
  id: number;
  name: string;
  department: string;
  date: string;
  checkin_time: string | null;
  checkout_time: string | null;
  time_spent: string;
  status: string; // Present, Leave, Absent
}

interface WorkingHoursStats {
  totalRecords: number;
  totalHours: number;
  averageHours: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  onTimeCount: number;
  lateCount: number;
}

const EmployeeWorkingHoursPage: React.FC = () => {
  const [records, setRecords] = useState<WorkingHourRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<WorkingHourRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [staffId, setStaffId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [staffList, setStaffList] = useState<{ id: number; name: string }[]>([]);
  const [stats, setStats] = useState<WorkingHoursStats>({
    totalRecords: 0,
    totalHours: 0,
    averageHours: 0,
    presentCount: 0,
    absentCount: 0,
    leaveCount: 0,
    onTimeCount: 0,
    lateCount: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(20);

  // Calculate stats whenever records change
  useEffect(() => {
    if (records.length > 0) {
      const totalRecords = records.length;
      const presentRecords = records.filter(r => r.status === 'Present');
      const absentRecords = records.filter(r => r.status === 'Absent');
      const leaveRecords = records.filter(r => r.status === 'Leave');
      
      // Calculate total hours (assuming time_spent is in format "Xh Ym" or "X hours Y minutes")
      const totalHours = records.reduce((sum, record) => {
        if (record.time_spent && record.time_spent !== '-') {
          const timeStr = record.time_spent.toLowerCase();
          const hoursMatch = timeStr.match(/(\d+)h/);
          const minutesMatch = timeStr.match(/(\d+)m/);
          const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
          const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
          return sum + hours + (minutes / 60);
        }
        return sum;
      }, 0);

      const averageHours = totalRecords > 0 ? totalHours / totalRecords : 0;

      // Count on-time vs late (assuming check-in before 9:00 AM is on-time)
      const onTimeCount = presentRecords.filter(r => {
        if (!r.checkin_time) return false;
        const checkinTime = new Date(r.checkin_time);
        const hours = checkinTime.getHours();
        return hours < 9;
      }).length;

      setStats({
        totalRecords,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHours: Math.round(averageHours * 100) / 100,
        presentCount: presentRecords.length,
        absentCount: absentRecords.length,
        leaveCount: leaveRecords.length,
        onTimeCount,
        lateCount: presentRecords.length - onTimeCount
      });
    }
  }, [records]);

  // Filter records based on search and department filter
  useEffect(() => {
    let filtered = records;

    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(record => record.department === departmentFilter);
    }

    setFilteredRecords(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [records, searchTerm, departmentFilter]);

  useEffect(() => {
    // Fetch staff list for filter dropdown
    api.get('/staff')
      .then(res => {
        // Ensure we always have an array
        const data = Array.isArray(res.data) ? res.data : [];
        setStaffList(data.map((s: any) => ({ id: s.id, name: s.name })));
      })
      .catch(() => setStaffList([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (staffId) params.append('staff_id', staffId);
    api.get(`/employee-working-hours?${params.toString()}`)
      .then(res => {
        // Ensure we always have an array
        const data = Array.isArray(res.data) ? res.data : [];
        console.log('Employee working hours data:', data);
        console.log('Data length:', data.length);
        setRecords(data);
      })
      .catch(err => {
        console.error('Error fetching working hours:', err);
        setError(err.message || 'Failed to fetch working hours');
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate, staffId]);

  const clearFilters = () => {
    const now = new Date();
    setStartDate(now.toISOString().slice(0, 10));
    setEndDate(now.toISOString().slice(0, 10));
    setStaffId('');
    setSearchTerm('');
    setDepartmentFilter('');
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'leave':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return <CheckCircle className="w-3 h-3" />;
      case 'absent':
        return <UserX className="w-3 h-3" />;
      case 'leave':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getCheckinStatus = (checkinTime: string | null) => {
    if (!checkinTime) return { status: 'No Check-in', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <Clock className="w-3 h-3" /> };
    
    const checkin = new Date(checkinTime);
    const checkinHour = checkin.getHours();
    const checkinMinute = checkin.getMinutes();
    const checkinTimeInMinutes = checkinHour * 60 + checkinMinute;
    const nineAMInMinutes = 9 * 60; // 9:00 AM in minutes
    
    if (checkinTimeInMinutes <= nineAMInMinutes) {
      return { status: 'On Time', color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="w-3 h-3" /> };
    } else {
      return { status: 'Late', color: 'bg-red-100 text-red-800 border-red-200', icon: <AlertCircle className="w-3 h-3" /> };
    }
  };

  const getCheckoutStatus = (checkoutTime: string | null) => {
    if (!checkoutTime) return { status: 'No Check-out', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <Clock className="w-3 h-3" /> };
    
    const checkout = new Date(checkoutTime);
    const checkoutHour = checkout.getHours();
    const checkoutMinute = checkout.getMinutes();
    const checkoutTimeInMinutes = checkoutHour * 60 + checkoutMinute;
    const fivePMInMinutes = 17 * 60; // 5:00 PM in minutes (17:00)
    
    if (checkoutTimeInMinutes < fivePMInMinutes) {
      return { status: 'Early Checkout', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: <AlertCircle className="w-3 h-3" /> };
    } else {
      return { status: 'On Time', color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="w-3 h-3" /> };
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Department', 'Date', 'Check-in', 'Check-in Status', 'Check-out', 'Check-out Status', 'Time Spent', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => {
        const checkinStatus = getCheckinStatus(record.checkin_time);
        const checkoutStatus = getCheckoutStatus(record.checkout_time);
        return [
          `"${record.name}"`,
          `"${record.department}"`,
          `"${record.date ? new Date(record.date).toLocaleDateString() : '-'}"`,
          `"${record.checkin_time ? new Date(record.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}"`,
          `"${checkinStatus.status}"`,
          `"${record.checkout_time ? new Date(record.checkout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}"`,
          `"${checkoutStatus.status}"`,
          `"${record.time_spent}"`,
          `"${record.status}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `working-hours-${startDate}-to-${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Get unique departments for filter
  const departments = [...new Set(records.map(r => r.department))].sort();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Employee Working Hours
              </h1>
              <p className="text-[10px] text-gray-600 mt-1">Track and analyze employee attendance and working hours</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            </div>
          </div>

           
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Filter className="w-3 h-3 text-gray-600" />
            <h3 className="text-xs font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Staff Member</label>
              <select
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={staffId}
                onChange={e => setStaffId(e.target.value)}
              >
                <option value="">All Staff</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-1">Department</label>
              <select
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          <div className="mt-2.5">
            <label className="block text-[10px] font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or department..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-xs text-gray-600">Loading working hours data...</span>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <h3 className="text-xs font-semibold text-gray-900 mb-1">Error Loading Data</h3>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-900">
                  Working Hours Records ({filteredRecords.length})
                </h3>
                <div className="text-[10px] text-gray-500">
                  Showing {indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length}
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Check-in Status</th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Check-out Status</th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Time Spent</th>
                    <th className="px-3 py-2 text-left text-[9px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-6 text-center">
                        <div className="flex flex-col items-center">
                          <Clock className="w-8 h-8 text-gray-400 mb-2" />
                          <h3 className="text-xs font-medium text-gray-900 mb-1">No records found</h3>
                          <p className="text-[10px] text-gray-500">Try adjusting your filters or date range</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map(record => {
                      const checkinStatus = getCheckinStatus(record.checkin_time);
                      const checkoutStatus = getCheckoutStatus(record.checkout_time);
                      return (
                        <tr key={`${record.id}-${record.date}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs font-medium text-gray-900">{record.name}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.department}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-900">
                              {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-900">
                              {record.checkin_time ? new Date(record.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-medium border ${checkinStatus.color}`}>
                              {React.cloneElement(checkinStatus.icon, { className: 'w-2.5 h-2.5' })}
                              {checkinStatus.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-900">
                              {record.checkout_time ? new Date(record.checkout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-medium border ${checkoutStatus.color}`}>
                              {React.cloneElement(checkoutStatus.icon, { className: 'w-2.5 h-2.5' })}
                              {checkoutStatus.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{record.time_spent}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-medium border ${getStatusColor(record.status)}`}>
                              {React.cloneElement(getStatusIcon(record.status), { className: 'w-2.5 h-2.5' })}
                              {record.status}
                            </span>
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
              <div className="px-3 py-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 py-0.5 text-[10px] border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`px-2 py-0.5 text-[10px] border rounded-md ${
                              currentPage === pageNumber
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return <span key={pageNumber} className="px-1 text-[10px]">...</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-0.5 text-[10px] border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeWorkingHoursPage; 