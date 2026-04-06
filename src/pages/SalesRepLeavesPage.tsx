import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { salesService, SalesRep } from '../services/salesService';
import { saveAs } from 'file-saver';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG } from '../config/api';
import { 
  Calendar, 
  User, 
  Clock, 
  Paperclip,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock as ClockSolid
} from 'lucide-react';

// Configure axios to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface Leave {
  id: number;
  userId: number;
  userName?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachment?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const SalesRepLeavesPage: React.FC = () => {
  const { user } = useAuth();
  const isTeamLeaderUser = user?.role === 'leader' || user?.role === 'team_leader';
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('0');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [pendingStatusFilter, setPendingStatusFilter] = useState(statusFilter);
  const [pendingStartDate, setPendingStartDate] = useState(startDateFilter);
  const [pendingEndDate, setPendingEndDate] = useState(endDateFilter);
  const [pendingSelectedRep, setPendingSelectedRep] = useState(selectedRep);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    const fetchSalesReps = async () => {
      try {
        // If user is a leader, filter by leader_id
        if (isTeamLeaderUser && user?.id) {
          const response = await axios.get(`${API_CONFIG.getUrl('/sales-reps')}?status=1&leader_id=${user.id}`);
          const data = response.data;
          setSalesReps(data.success ? data.data : (Array.isArray(data) ? data : []));
        } else {
          const reps = await salesService.getAllSalesReps();
          setSalesReps(reps);
        }
      } catch (error) {
        console.error('Failed to fetch sales reps:', error);
        setSalesReps([]);
      }
    };
    fetchSalesReps();
  }, [isTeamLeaderUser, user?.id]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Build URL with team_leader_id filter if user is a leader
    const url = isTeamLeaderUser && user?.id
      ? `${API_CONFIG.getUrl('/sales-rep-leaves/sales-rep-leaves')}?team_leader_id=${user.id}`
      : API_CONFIG.getUrl('/sales-rep-leaves/sales-rep-leaves');
    axios
      .get(url)
      .then(res => setLeaves(res.data))
      .catch(err => setError(err.message || 'Failed to fetch leaves'))
      .finally(() => setLoading(false));
  }, [isTeamLeaderUser, user?.id]);

  const filteredLeaves = leaves.filter(leave => {
    // If user is a leader, only show leaves for assigned sales reps
    if (isTeamLeaderUser && user?.id) {
      const rep = salesReps.find(r => r.id === leave.userId);
      if (!rep) return false; // Hide if sales rep is not in the assigned list
    }
    
    // Handle both string and number status values
    const leaveStatusNum = typeof leave.status === 'string' ? parseInt(leave.status, 10) : leave.status;
    const statusFilterNum = statusFilter ? (typeof statusFilter === 'string' ? parseInt(statusFilter, 10) : statusFilter) : null;
    const statusMatch = !statusFilter || leaveStatusNum === statusFilterNum;
    let dateMatch = true;
    if (startDateFilter) {
      dateMatch = dateMatch && new Date(leave.startDate) >= new Date(startDateFilter);
    }
    if (endDateFilter) {
      dateMatch = dateMatch && new Date(leave.endDate) <= new Date(endDateFilter);
    }
    const repMatch = !selectedRep || String(leave.userId) === selectedRep;
    return statusMatch && dateMatch && repMatch;
  });

  const handleUpdateStatus = async (leaveId: number, newStatus: number) => {
    try {
      const statusToSend = isTeamLeaderUser && newStatus === 1 ? 7 : newStatus;
      console.log('Updating leave status:', { leaveId, newStatus: statusToSend });
      const response = await axios.patch(API_CONFIG.getUrl(`/sales-rep-leaves/${leaveId}/status`), { status: statusToSend });
      console.log('Update response:', response.data);
      if (response.data.success) {
        // Refresh leaves data to get updated status
        const url = isTeamLeaderUser && user?.id
          ? `${API_CONFIG.getUrl('/sales-rep-leaves/sales-rep-leaves')}?team_leader_id=${user.id}`
          : API_CONFIG.getUrl('/sales-rep-leaves/sales-rep-leaves');
        const leavesResponse = await axios.get(url);
        console.log('Refreshed leaves data:', leavesResponse.data);
        setLeaves(leavesResponse.data);
      } else {
        alert('Failed to update status');
      }
    } catch (err: any) {
      console.error('Error updating leave status:', err);
      alert(err.response?.data?.error || err.message || 'Failed to update status');
    }
  };

  const openFilterModal = () => {
    setPendingStatusFilter(statusFilter);
    setPendingStartDate(startDateFilter);
    setPendingEndDate(endDateFilter);
    setPendingSelectedRep(selectedRep);
    setFilterModalOpen(true);
  };

  const applyFilters = () => {
    setStatusFilter(pendingStatusFilter);
    setStartDateFilter(pendingStartDate);
    setEndDateFilter(pendingEndDate);
    setSelectedRep(pendingSelectedRep);
    setFilterModalOpen(false);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setPendingStatusFilter('0');
    setPendingStartDate('');
    setPendingEndDate('');
    setPendingSelectedRep('');
  };

  const exportToCSV = () => {
    const headers = [
      'FMR',
      'Leave Type',
      'Start Date',
      'End Date',
      'Reason',
      'Attachment',
      'Status'
    ];
    const rows = filteredLeaves.map(leave => [
      (salesReps.find(rep => String(rep.id) === String(leave.userId))?.name) || '',
      leave.leaveType,
      leave.startDate,
      leave.endDate,
      leave.reason,
      leave.attachment || '',
      (Number(leave.status) === 1) ? 'Approved' : (Number(leave.status) === 7) ? 'Approved by Team Leader' : (Number(leave.status) === 2) ? 'Declined' : 'Pending'
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'sales_rep_leaves.csv');
  };

  const getStatusBadge = (status: string | number) => {
    // Convert to number for comparison
    const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
    
    switch (statusNum) {
      case 1:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-0.5" />
            Approved
          </span>
        );
      case 7:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-0.5" />
            Approved (TL)
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-0.5" />
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800">
            <ClockSolid className="h-3 w-3 mr-0.5" />
            Pending
          </span>
        );
    }
  };

  const getLeaveTypeColor = (leaveType: string) => {
    const colors = {
      'Annual Leave': 'bg-blue-100 text-blue-800',
      'Sick Leave': 'bg-red-100 text-red-800',
      'Personal Leave': 'bg-purple-100 text-purple-800',
      'Maternity Leave': 'bg-pink-100 text-pink-800',
      'Paternity Leave': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[leaveType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const calculateLeaveDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeaves = filteredLeaves.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">FMR Leaves</h1>
          <p className="text-sm text-gray-600">Manage and review leave requests from FMRs</p>
        </div>

         {/* Stats Cards */}
         <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
           <div 
             className={`w-[152px] lg:flex-1 lg:min-w-0 bg-white rounded-md shadow-sm p-2 border-l-4 border-green-500 cursor-pointer transition-all duration-200 hover:shadow-md ${!statusFilter ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
             onClick={() => {
               setStatusFilter('');
               setCurrentPage(1);
             }}
           >
             <div className="flex items-center">
               <div className="flex-shrink-0">
                 <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                   <Clock className="h-3.5 w-3.5 text-green-600" />
                 </div>
               </div>
               <div className="ml-1.5">
                 <p className="text-[10px] font-medium text-gray-500">Total Leaves</p>
                 <p className="text-sm font-semibold text-gray-900">{leaves.length}</p>
               </div>
             </div>
           </div>

           <div 
             className={`w-[152px] lg:flex-1 lg:min-w-0 bg-white rounded-md shadow-sm p-2 border-l-4 border-yellow-500 cursor-pointer transition-all duration-200 hover:shadow-md ${statusFilter === '0' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''}`}
             onClick={() => {
               setStatusFilter('0');
               setCurrentPage(1);
             }}
           >
             <div className="flex items-center">
               <div className="flex-shrink-0">
                 <div className="w-6 h-6 bg-yellow-100 rounded-md flex items-center justify-center">
                   <ClockSolid className="h-3.5 w-3.5 text-yellow-600" />
                 </div>
               </div>
               <div className="ml-1.5">
                 <p className="text-[10px] font-medium text-gray-500">Pending</p>
                 <p className="text-sm font-semibold text-gray-900">
                   {leaves.filter(l => String(l.status) === '0').length}
                 </p>
               </div>
             </div>
           </div>

           <div 
             className={`w-[152px] lg:flex-1 lg:min-w-0 bg-white rounded-md shadow-sm p-2 border-l-4 border-blue-500 cursor-pointer transition-all duration-200 hover:shadow-md ${Number(statusFilter) === 7 ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
             onClick={() => {
               setStatusFilter('7');
               setCurrentPage(1);
             }}
           >
             <div className="flex items-center">
               <div className="flex-shrink-0">
                 <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                   <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                 </div>
               </div>
               <div className="ml-1.5">
                 <p className="text-[10px] font-medium text-gray-500">Approved by TL</p>
                 <p className="text-sm font-semibold text-gray-900">
                   {leaves.filter(l => Number(l.status) === 7).length}
                 </p>
               </div>
             </div>
           </div>

           <div 
             className={`w-[152px] lg:flex-1 lg:min-w-0 bg-white rounded-md shadow-sm p-2 border-l-4 border-green-500 cursor-pointer transition-all duration-200 hover:shadow-md ${Number(statusFilter) === 1 ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
             onClick={() => {
               setStatusFilter('1');
               setCurrentPage(1);
             }}
           >
             <div className="flex items-center">
               <div className="flex-shrink-0">
                 <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                   <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                 </div>
               </div>
               <div className="ml-1.5">
                 <p className="text-[10px] font-medium text-gray-500">Approved</p>
                 <p className="text-sm font-semibold text-gray-900">
                   {leaves.filter(l => Number(l.status) === 1).length}
                 </p>
               </div>
             </div>
           </div>

           <div 
             className={`w-[152px] lg:flex-1 lg:min-w-0 bg-white rounded-md shadow-sm p-2 border-l-4 border-red-500 cursor-pointer transition-all duration-200 hover:shadow-md ${Number(statusFilter) === 2 ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
             onClick={() => {
               setStatusFilter('2');
               setCurrentPage(1);
             }}
           >
             <div className="flex items-center">
               <div className="flex-shrink-0">
                 <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
                   <XCircle className="h-3.5 w-3.5 text-red-600" />
                 </div>
               </div>
               <div className="ml-1.5">
                 <p className="text-[10px] font-medium text-gray-500">Declined</p>
                 <p className="text-sm font-semibold text-gray-900">
                   {leaves.filter(l => Number(l.status) === 2).length}
                 </p>
               </div>
             </div>
           </div>

         </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={openFilterModal}
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filter
          </button>
          <button
            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={exportToCSV}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export to CSV
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mb-4 flex items-center text-sm">
            <XCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            <p className="mt-3 text-sm text-gray-600">Loading leaves...</p>
          </div>
        ) : (
          /* Leaves Table */
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      FMR
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider max-w-xs">
                      Reason
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Attachment
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLeaves.map(leave => {
                    const rep = salesReps.find(r => r.id === leave.userId);
                    const duration = calculateLeaveDuration(leave.startDate, leave.endDate);
                    const leaveStatusNum = Number(leave.status);
                    const canActOnPending =
                      leaveStatusNum === 0 && user?.role !== 'sales';
                    const canSalesReviewTeamLeaderApproval =
                      user?.role === 'sales' && leaveStatusNum === 7;
                    const canActOnLeave =
                      canActOnPending || canSalesReviewTeamLeaderApproval;
                    
                    return (
                      <tr key={leave.id} className="hover:bg-gray-50 transition-colors duration-150">
                        {/* FMR */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-3.5 w-3.5 text-green-600" />
                            </div>
                            <div className="ml-2">
                              <div className="text-xs font-medium text-gray-900">
                                {rep ? rep.name : (leave.userName || `User ${leave.userId}`)}
                              </div>
                              <div className="text-[10px] text-gray-500">FMR</div>
                            </div>
                          </div>
                        </td>

                        {/* Leave Type */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getLeaveTypeColor(leave.leaveType)}`}>
                            {leave.leaveType}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900 font-medium">
                            {duration} day{duration !== 1 ? 's' : ''}
                          </div>
                        </td>

                        {/* Dates */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1.5 text-gray-400" />
                              <span>{new Date(leave.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center mt-0.5">
                              <Calendar className="h-3 w-3 mr-1.5 text-gray-400" />
                              <span>{new Date(leave.endDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="px-4 py-3 max-w-xs">
                          <div className="text-xs text-gray-900">
                            <div className="line-clamp-2 mb-1">{leave.reason}</div>
                            <button
                              className="text-green-600 hover:text-green-700 text-[10px] font-medium inline-flex items-center"
                              onClick={() => {
                                setSelectedReason(leave.reason);
                                setReasonModalOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-0.5" />
                              View full reason
                            </button>
                          </div>
                        </td>

                        {/* Attachment */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {leave.attachment ? (
                            <a 
                              href={leave.attachment} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center text-green-600 hover:text-green-700 text-xs font-medium"
                            >
                              <Paperclip className="h-3 w-3 mr-1" />
                              Download
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">None</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(leave.status)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {canActOnLeave && (
                            <div className="flex gap-1.5">
                              <button
                                className="inline-flex items-center px-2 py-1 border border-transparent text-[10px] font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                onClick={() => handleUpdateStatus(leave.id, 1)}
                              >
                                <CheckCircle className="h-3 w-3 mr-0.5" />
                                Approve
                              </button>
                              <button
                                className="inline-flex items-center px-2 py-1 border border-transparent text-[10px] font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                onClick={() => handleUpdateStatus(leave.id, 2)}
                              >
                                <XCircle className="h-3 w-3 mr-0.5" />
                                Decline
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredLeaves.length === 0 && (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">No leaves found</h3>
                <p className="text-sm text-gray-500">Try adjusting your filters or check back later.</p>
              </div>
            )}

            {/* Pagination */}
            {filteredLeaves.length > 0 && (
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Results info */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-700">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredLeaves.length)} of {filteredLeaves.length} results
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  </div>

                  {/* Pagination buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      First
                    </button>
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => goToPage(pageNumber)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                              currentPage === pageNumber
                                ? 'bg-green-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Modal */}
        {filterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-4 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Filter Leaves</h2>
                <button
                  onClick={() => setFilterModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="statusFilter" className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="statusFilter"
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={pendingStatusFilter}
                    onChange={e => setPendingStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="0">Pending</option>
                    <option value="1">Approved</option>
                    <option value="7">Approved by Team Leader</option>
                     <option value="2">Declined</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={pendingStartDate}
                    onChange={e => setPendingStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-xs font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={pendingEndDate}
                    onChange={e => setPendingEndDate(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="repFilter" className="block text-xs font-medium text-gray-700 mb-1">
                    FMR
                  </label>
                  <select
                    id="repFilter"
                    className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={pendingSelectedRep}
                    onChange={e => setPendingSelectedRep(e.target.value)}
                  >
                    <option value="">All Representatives</option>
                    {salesReps.map(rep => (
                      <option key={rep.id} value={String(rep.id)}>
                        {rep.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={clearFilters}
                >
                  Clear
                </button>
                <button
                  className="px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={applyFilters}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reason Modal */}
        {reasonModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-4 max-w-lg w-full mx-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Leave Reason</h2>
                <button
                  onClick={() => setReasonModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-md p-3 mb-4">
                <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed">{selectedReason}</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  className="px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={() => setReasonModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesRepLeavesPage; 