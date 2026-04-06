import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Filter,
  Search,
  Download
} from 'lucide-react';
import api from '../services/api';

interface WorkingDaysRecord {
  id: number;
  name: string;
  department: string;
  effective_working_days: number;
  days_present: number;
  leave_days: number;
  absent_days: number;
  holidays: number;
  attendance_pct: string;
}

interface AttendanceStats {
  totalEmployees: number;
  avgAttendance: number;
  totalPresentDays: number;
  totalAbsentDays: number;
}

const EmployeeWorkingDaysPage: React.FC = () => {
  const [records, setRecords] = useState<WorkingDaysRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<WorkingDaysRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [staffId, setStaffId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [staffList, setStaffList] = useState<{ id: number; name: string }[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    avgAttendance: 0,
    totalPresentDays: 0,
    totalAbsentDays: 0
  });

  // Calculate stats whenever records change
  useEffect(() => {
    if (records.length > 0) {
      const totalEmployees = records.length;
      const totalAttendancePercent = records.reduce((sum, record) => {
        const percent = record.attendance_pct === 'N/A' ? 0 : parseFloat(record.attendance_pct);
        return sum + percent;
      }, 0);
      const avgAttendance = totalAttendancePercent / totalEmployees;
      const totalPresentDays = records.reduce((sum, record) => sum + record.days_present, 0);
      const totalAbsentDays = records.reduce((sum, record) => sum + record.absent_days, 0);

      setStats({
        totalEmployees,
        avgAttendance,
        totalPresentDays,
        totalAbsentDays
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
    if (month) params.append('month', month);
    if (staffId) params.append('staff_id', staffId);
    
    api.get(`/employee-working-days?${params.toString()}`)
      .then(res => {
        // Ensure we always have an array
        const data = Array.isArray(res.data) ? res.data : [];
        setRecords(data);
      })
      .catch(err => {
        console.error('Error fetching working days:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch working days');
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, [month, staffId]);

  const getDepartments = () => {
    const departments = [...new Set(records.map(record => record.department))];
    return departments.sort();
  };

  const getAttendanceBadge = (percentage: string) => {
    if (percentage === 'N/A') return 'bg-gray-100 text-gray-800';
    const percent = parseFloat(percentage);
    if (percent >= 90) return 'bg-green-100 text-green-800';
    if (percent >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Department', 'Working Days', 'Present Days', 'Leave Days', 'Absent Days', 'Holidays', 'Attendance %'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.name,
        record.department,
        record.effective_working_days,
        record.days_present,
        record.leave_days,
        record.absent_days,
        record.holidays || 0,
        record.attendance_pct
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-working-days-${month}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xs font-bold text-gray-900">Employee Working Days</h1>
            <p className="text-[9px] text-gray-600 mt-0.5">Track attendance and working days for all employees</p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center px-2 py-0.5 text-[10px] border border-transparent font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-2.5 w-2.5 mr-1" />
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2 hidden">
          <div className="bg-white rounded-md p-2 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                  <Users className="h-3 w-3 text-blue-600" />
                </div>
              </div>
              <div className="ml-1.5">
                <p className="text-[9px] font-medium text-gray-600">Total Employees</p>
                <p className="text-[10px] font-bold text-gray-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md p-2 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
              </div>
              <div className="ml-1.5">
                <p className="text-[9px] font-medium text-gray-600">Average Attendance</p>
                <p className="text-[10px] font-bold text-gray-900">{stats.avgAttendance.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md p-2 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center">
                  <Calendar className="h-3 w-3 text-emerald-600" />
                </div>
              </div>
              <div className="ml-1.5">
                <p className="text-[9px] font-medium text-gray-600">Total Present Days</p>
                <p className="text-[10px] font-bold text-gray-900">{stats.totalPresentDays}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md p-2 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
                  <AlertCircle className="h-3 w-3 text-red-600" />
                </div>
              </div>
              <div className="ml-1.5">
                <p className="text-[9px] font-medium text-gray-600">Total Absent Days</p>
                <p className="text-[10px] font-bold text-gray-900">{stats.totalAbsentDays}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-2 mb-2">
          <div className="flex items-center gap-1 mb-1.5">
            <Filter className="h-2.5 w-2.5 text-gray-500" />
            <h3 className="text-[10px] font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <div>
              <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Month</label>
              <input
                type="month"
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-[10px] focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={month}
                onChange={e => setMonth(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Staff Member</label>
              <select
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-[10px] focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
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
              <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Department</label>
              <select
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-[10px] focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {getDepartments().map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-medium text-gray-700 mb-0.5">Search</label>
              <div className="relative">
                <Search className="h-2.5 w-2.5 text-gray-400 absolute left-1.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="w-full border border-gray-300 rounded-md pl-7 pr-2 py-1 text-[10px] focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-500 animate-spin mr-1.5" />
              <span className="text-[10px] text-gray-600">Loading employee data...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-md shadow-sm border border-red-200 p-2">
            <div className="flex items-center">
              <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-[10px] text-red-600 font-medium">{error}</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-2 py-1.5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold text-gray-900">
                  Employee Working Days Report
                </h3>
                <span className="text-[9px] text-gray-500">
                  Showing {filteredRecords.length} of {records.length} employees
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-2 py-1.5 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-2 py-1.5 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider">
                      Working Days
                    </th>
                    <th className="px-2 py-1.5 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider">
                      Present Days
                    </th>
                    <th className="px-2 py-1.5 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider">
                      Leave Days
                    </th>
                    <th className="px-2 py-1.5 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider">
                      Absent Days
                    </th>
                    <th className="px-2 py-1.5 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider">
                      Holidays
                    </th>
                    <th className="px-2 py-1.5 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-2 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <Users className="h-6 w-6 text-gray-300 mb-1.5" />
                          <h3 className="text-[10px] font-medium text-gray-900 mb-0.5">No employees found</h3>
                          <p className="text-[9px] text-gray-500">Try adjusting your filters or search term.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-5 w-5">
                              <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-medium text-[8px]">
                                  {record.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-1.5">
                              <div className="text-[10px] font-medium text-gray-900">{record.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-medium bg-gray-100 text-gray-800">
                            {record.department}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-[10px] text-gray-900">
                          {record.effective_working_days}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-[10px] text-green-600 font-medium">
                          {record.days_present}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-[10px] text-blue-600">
                          {record.leave_days}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-[10px] text-red-600">
                          {record.absent_days}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap text-[10px] text-purple-600">
                          {record.holidays || 0}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-medium ${getAttendanceBadge(record.attendance_pct)}`}>
                            {record.attendance_pct === 'N/A' ? 'N/A' : `${record.attendance_pct}%`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeWorkingDaysPage; 