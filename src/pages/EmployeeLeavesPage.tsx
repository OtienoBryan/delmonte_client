import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface LeaveRequest {
  id: number;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason: string;
  attachment_url?: string;
}

// Icons
const Icons = {
  Search: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Download: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Filter: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  User: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Document: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

const EmployeeLeavesPage: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('0'); // Default to pending
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/leave-requests/employee-leaves');
        setLeaveRequests(response.data);
        setFilteredRequests(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch leave requests');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    let filtered = leaveRequests;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.leave_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === '0') {
        // Pending: status is '0', 0, null, undefined, or empty string
        filtered = filtered.filter((req) => 
          !req.status || 
          req.status === '0' || 
          req.status === 0 || 
          req.status === '' ||
          String(req.status).trim() === ''
        );
      } else {
        // For approved/declined, check both string and number
        filtered = filtered.filter((req) => 
          String(req.status) === statusFilter || 
          req.status === Number(statusFilter)
        );
      }
    }

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, leaveRequests]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  const handleUpdateStatus = async (id: number, newStatus: number) => {
    setUpdatingId(id);
    try {
      await api.patch(`/leave-requests/${id}/status`, { status: newStatus });
      setLeaveRequests((prev) => prev.map(lr => lr.id === id ? { ...lr, status: String(newStatus) } : lr));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === '1') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 border border-green-200">
          <Icons.Check className="w-2.5 h-2.5 mr-1" />
          Approved
        </span>
      );
    } else if (status === '2') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800 border border-red-200">
          <Icons.X className="w-2.5 h-2.5 mr-1" />
          Declined
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          Pending
        </span>
      );
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-xs font-medium text-gray-900">Loading leave requests...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center py-8">
              <p className="text-sm font-medium text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-gray-900">Employee Leaves</h1>
                <p className="mt-1 text-xs text-gray-500">
                  Manage and review employee leave requests
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Icons.Refresh className="mr-1.5" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Icons.Search />
                </div>
                <input
                  type="text"
                  placeholder="Search by employee, leave type, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Stats Cards - Clickable Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`bg-white rounded-lg shadow p-3 text-left transition-all hover:shadow-md ${
              statusFilter === 'all' ? 'ring-2 ring-blue-500 border-2 border-blue-500' : ''
            }`}
          >
            <div className="flex items-center">
              <div className={`p-1.5 rounded-lg ${statusFilter === 'all' ? 'bg-blue-200' : 'bg-blue-100'}`}>
                <Icons.Document className="text-blue-600" />
              </div>
              <div className="ml-2">
                <p className="text-[10px] font-medium text-gray-600">Total Requests</p>
                <p className="text-sm font-semibold text-gray-900">{leaveRequests.length}</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('0')}
            className={`bg-white rounded-lg shadow p-3 text-left transition-all hover:shadow-md ${
              statusFilter === '0' ? 'ring-2 ring-yellow-500 border-2 border-yellow-500' : ''
            }`}
          >
            <div className="flex items-center">
              <div className={`p-1.5 rounded-lg ${statusFilter === '0' ? 'bg-yellow-200' : 'bg-yellow-100'}`}>
                <Icons.Document className="text-yellow-600" />
              </div>
              <div className="ml-2">
                <p className="text-[10px] font-medium text-gray-600">Pending</p>
                <p className="text-sm font-semibold text-gray-900">
                  {leaveRequests.filter((r) => r.status === '0' || !r.status || r.status === 0 || r.status === '').length}
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('1')}
            className={`bg-white rounded-lg shadow p-3 text-left transition-all hover:shadow-md ${
              statusFilter === '1' ? 'ring-2 ring-green-500 border-2 border-green-500' : ''
            }`}
          >
            <div className="flex items-center">
              <div className={`p-1.5 rounded-lg ${statusFilter === '1' ? 'bg-green-200' : 'bg-green-100'}`}>
                <Icons.Document className="text-green-600" />
              </div>
              <div className="ml-2">
                <p className="text-[10px] font-medium text-gray-600">Approved</p>
                <p className="text-sm font-semibold text-gray-900">
                  {leaveRequests.filter((r) => String(r.status) === '1' || r.status === 1).length}
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('2')}
            className={`bg-white rounded-lg shadow p-3 text-left transition-all hover:shadow-md ${
              statusFilter === '2' ? 'ring-2 ring-red-500 border-2 border-red-500' : ''
            }`}
          >
            <div className="flex items-center">
              <div className={`p-1.5 rounded-lg ${statusFilter === '2' ? 'bg-red-200' : 'bg-red-100'}`}>
                <Icons.Document className="text-red-600" />
              </div>
              <div className="ml-2">
                <p className="text-[10px] font-medium text-gray-600">Declined</p>
                <p className="text-sm font-semibold text-gray-900">
                  {leaveRequests.filter((r) => String(r.status) === '2' || r.status === 2).length}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Table */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow text-center py-8">
            <Icons.Document className="mx-auto text-gray-400" />
            <h3 className="mt-3 text-sm font-medium text-gray-900">No leave requests found</h3>
            <p className="mt-2 text-xs text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No leave requests have been submitted yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Icons.Calendar className="mr-1" />
                        Dates
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Attachment
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-1 bg-gray-100 rounded-full mr-2">
                            <Icons.User className="text-gray-600" />
                          </div>
                          <span className="text-[10px] font-medium text-gray-900">{req.employee_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-[10px] text-gray-900">{req.leave_type}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">
                          <div>{req.start_date ? new Date(req.start_date).toLocaleDateString('en-CA') : '-'}</div>
                          <div className="text-gray-500">to</div>
                          <div>{req.end_date ? new Date(req.end_date).toLocaleDateString('en-CA') : '-'}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-[10px] font-medium text-gray-900">
                          {calculateDays(req.start_date, req.end_date)} days
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-[10px] text-gray-900 max-w-xs truncate" title={req.reason}>
                          {req.reason || '-'}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                      {req.attachment_url ? (
                          <a
                            href={req.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <Icons.Download className="mr-1" />
                            Download
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-400">None</span>
                      )}
                    </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex space-x-1">
                      <button
                            className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={req.status === '1' || updatingId === req.id}
                        onClick={() => handleUpdateStatus(req.id, 1)}
                      >
                            {updatingId === req.id ? (
                              <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-white mr-1"></div>
                            ) : (
                              <Icons.Check className="mr-1" />
                            )}
                        Approve
                      </button>
                      <button
                            className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={req.status === '2' || updatingId === req.id}
                        onClick={() => handleUpdateStatus(req.id, 2)}
                      >
                            {updatingId === req.id ? (
                              <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-white mr-1"></div>
                            ) : (
                              <Icons.X className="mr-1" />
                            )}
                        Decline
                      </button>
                        </div>
                    </td>
                  </tr>
                  ))}
            </tbody>
          </table>
            </div>

            {/* Pagination */}
            {filteredRequests.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Results info */}
                  <div className="text-xs text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} results
                    {totalPages > 1 && (
                      <span className="ml-2 text-gray-500">
                        (Page {currentPage} of {totalPages})
                      </span>
                    )}
                  </div>

                  {/* Items per page selector */}
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-600">Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  {/* Pagination controls - only show if more than 1 page */}
                  {totalPages > 1 && (
                    <div className="flex items-center space-x-1.5">
                      {/* Previous button */}
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>

                      {/* Page numbers */}
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next button */}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      )}
      </div>
    </div>
  );
};

export default EmployeeLeavesPage; 