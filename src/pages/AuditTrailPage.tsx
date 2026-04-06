import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Calendar, User, Activity, CheckCircle, XCircle, Eye } from 'lucide-react';
import { auditTrailService, AuditTrailRecord, AuditTrailStats } from '../services/auditTrailService';
import { format } from 'date-fns';

const AuditTrailPage: React.FC = () => {
  const [records, setRecords] = useState<AuditTrailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [userName, setUserName] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [successFilter, setSuccessFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Stats
  const [stats, setStats] = useState<AuditTrailStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  
  // Detail view
  const [selectedRecord, setSelectedRecord] = useState<AuditTrailRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Available actions for filter
  const availableActions = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW'];
  
  // Available entity types (will be populated from records)
  const [availableEntityTypes, setAvailableEntityTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchRecords();
    fetchStats();
  }, [currentPage, itemsPerPage, userName, action, entityType, startDate, endDate, successFilter]);

  useEffect(() => {
    // Extract unique entity types from records
    const entityTypes = [...new Set(records.map(r => r.entity_type).filter(Boolean))] as string[];
    setAvailableEntityTypes(entityTypes);
  }, [records]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {
        page: currentPage,
        limit: itemsPerPage
      };
      
      if (userName) filters.userName = userName;
      if (action) filters.action = action;
      if (entityType) filters.entityType = entityType;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (successFilter !== 'all') {
        filters.success = successFilter === 'success';
      }

      const response = await auditTrailService.getAll(filters);
      
      if (response.success) {
        setRecords(response.data);
        setTotalRecords(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      } else {
        setError('Failed to fetch audit trail records');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching audit trail records');
      console.error('Error fetching audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await auditTrailService.getStats(startDate || undefined, endDate || undefined);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleResetFilters = () => {
    setUserName('');
    setAction('');
    setEntityType('');
    setStartDate('');
    setEndDate('');
    setSuccessFilter('all');
    setCurrentPage(1);
  };

  const handleViewDetail = async (record: AuditTrailRecord) => {
    try {
      const fullRecord = await auditTrailService.getById(record.id);
      setSelectedRecord(fullRecord);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error fetching record details:', err);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-green-100 text-green-800';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800';
      case 'CREATE':
        return 'bg-blue-100 text-blue-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'VIEW':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
              <p className="text-gray-600 mt-1">Track all user activities in the system</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                {showStats ? 'Hide' : 'Show'} Statistics
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStats && stats && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Activities</div>
                <div className="text-2xl font-bold text-blue-600">{stats.total.toLocaleString()}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Successful Logins</div>
                <div className="text-2xl font-bold text-green-600">{stats.loginStats.successful_logins}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Failed Logins</div>
                <div className="text-2xl font-bold text-red-600">{stats.loginStats.failed_logins}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Logins</div>
                <div className="text-2xl font-bold text-purple-600">{stats.loginStats.total_logins}</div>
              </div>
            </div>
            
            {stats.byAction.length > 0 && (
              <div className="mt-6">
                <h3 className="text-md font-semibold mb-3">Activities by Action</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {stats.byAction.map((item) => (
                    <div key={item.action} className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">{item.action}</div>
                      <div className="text-lg font-semibold">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search user..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={action}
                  onChange={(e) => {
                    setAction(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Actions</option>
                  {availableActions.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                <select
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {availableEntityTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={successFilter}
                  onChange={(e) => {
                    setSuccessFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading audit trail records...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchRecords}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">No audit trail records found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(record.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{record.user_name}</div>
                          {record.user_role && (
                            <div className="text-sm text-gray-500">{record.user_role}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(record.action)}`}>
                            {record.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.entity_type ? (
                            <div>
                              <div className="font-medium">{record.entity_type}</div>
                              {record.entity_id && (
                                <div className="text-gray-500">ID: {record.entity_id}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                          {record.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.success ? (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Success
                            </span>
                          ) : (
                            <span className="flex items-center text-red-600">
                              <XCircle className="w-4 h-4 mr-1" />
                              Failed
                            </span>
                          )}
                          {record.response_status && (
                            <div className="text-xs text-gray-500 mt-1">HTTP {record.response_status}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewDetail(record)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} records
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                    <option value={200}>200 per page</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Audit Trail Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <div className="text-sm text-gray-900">{selectedRecord.id}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Timestamp</label>
                  <div className="text-sm text-gray-900">{formatDateTime(selectedRecord.created_at)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">User</label>
                  <div className="text-sm text-gray-900">{selectedRecord.user_name} ({selectedRecord.user_role || 'N/A'})</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Action</label>
                  <div className="text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(selectedRecord.action)}`}>
                      {selectedRecord.action}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Entity Type</label>
                  <div className="text-sm text-gray-900">{selectedRecord.entity_type || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Entity ID</label>
                  <div className="text-sm text-gray-900">{selectedRecord.entity_id || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Request Method</label>
                  <div className="text-sm text-gray-900">{selectedRecord.request_method || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Response Status</label>
                  <div className="text-sm text-gray-900">{selectedRecord.response_status || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Success</label>
                  <div className="text-sm">
                    {selectedRecord.success ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">IP Address</label>
                  <div className="text-sm text-gray-900">{selectedRecord.ip_address || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <div className="text-sm text-gray-900">{selectedRecord.description || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Request URL</label>
                  <div className="text-sm text-gray-900 break-all">{selectedRecord.request_url || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">User Agent</label>
                  <div className="text-sm text-gray-900 break-all">{selectedRecord.user_agent || 'N/A'}</div>
                </div>
                {selectedRecord.error_message && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-red-500">Error Message</label>
                    <div className="text-sm text-red-600">{selectedRecord.error_message}</div>
                  </div>
                )}
                {selectedRecord.request_body && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Request Body</label>
                    <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-48">
                      {JSON.stringify(selectedRecord.request_body, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrailPage;
