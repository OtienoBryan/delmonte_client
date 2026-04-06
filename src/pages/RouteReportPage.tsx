import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Calendar, MapPin, User, TrendingUp, CheckCircle, Clock, Eye, FileText } from 'lucide-react';

interface SalesRep {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: number;
  route_id_update?: number;
  route_name?: string;
}

interface VisibilityReport {
  id: number;
  userId: number;
  clientId: number;
  createdAt: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  comment?: string;
  notes?: string;
  status: number;
  user_name?: string;
  client_name?: string;
  client_company_name?: string;
}

const RouteReportPage: React.FC = () => {
  const { salesRepId } = useParams<{ salesRepId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [visibilityReports, setVisibilityReports] = useState<VisibilityReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filteredReports, setFilteredReports] = useState<VisibilityReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [clientIdFilter, setClientIdFilter] = useState<number | null>(null);

  // Function to get current month date range
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    if (location.state) {
      setSalesRep(location.state.salesRep);
      if (location.state.clientId) {
        setClientIdFilter(location.state.clientId);
      }
      if (location.state.selectedDate) {
        setStartDate(location.state.selectedDate);
        setEndDate(location.state.selectedDate);
      }
      fetchVisibilityReports();
    } else {
      fetchSalesRepData();
    }
    setIsLoading(false);
  }, [location.state, salesRepId]);

  // Initialize filtered data when visibilityReports changes
  useEffect(() => {
    setFilteredReports(visibilityReports);
    
    // Set current month as default filter
    if (visibilityReports.length > 0 && !startDate && !endDate) {
      const currentMonth = getCurrentMonthRange();
      setStartDate(currentMonth.start);
      setEndDate(currentMonth.end);
    }
  }, [visibilityReports, startDate, endDate]);

  // Auto-apply filter when filters change
  useEffect(() => {
    if (visibilityReports.length > 0) {
      applyFilters();
    }
  }, [startDate, endDate, statusFilter, searchTerm, clientIdFilter, visibilityReports]);

  const fetchSalesRepData = async () => {
    try {
      const response = await fetch(`/api/sales-reps/${salesRepId}`);
      if (response.ok) {
        const data = await response.json();
        setSalesRep(data.salesRep);
        fetchVisibilityReports();
      }
    } catch (error) {
      console.error('Error fetching sales rep data:', error);
    }
  };

  const fetchVisibilityReports = async () => {
    try {
      const response = await fetch(`/api/visibility-reports?userId=${salesRepId}`);
      if (response.ok) {
        const data = await response.json();
        setVisibilityReports(data.visibilityReports || []);
      }
    } catch (error) {
      console.error('Error fetching visibility reports:', error);
    }
  };

  const applyFilters = () => {
    let filtered = visibilityReports;

    // Client ID filter
    if (clientIdFilter) {
      filtered = filtered.filter(report => report.clientId === clientIdFilter);
    }

    // Date range filter
    if (startDate && endDate) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.createdAt);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        return reportDate >= start && reportDate <= end;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report => {
        const clientName = report.client_name || report.client_company_name || '';
        const comment = report.comment || '';
        const notes = report.notes || '';
        const searchLower = searchTerm.toLowerCase();
        
        return clientName.toLowerCase().includes(searchLower) || 
               comment.toLowerCase().includes(searchLower) ||
               notes.toLowerCase().includes(searchLower);
      });
    }

    setFilteredReports(filtered);
  };

  const filterByDateRange = () => {
    applyFilters();
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setSearchTerm('');
    setClientIdFilter(null);
    setFilteredReports(visibilityReports);
  };

  const getStatusConfig = (status: number) => {
    const statusConfig = {
      0: { label: 'Pending', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
      1: { label: 'In Progress', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
      2: { label: 'Completed', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      3: { label: 'Verified', bgColor: 'bg-purple-100', textColor: 'text-purple-800' }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig[0];
  };

  const getOverallStats = () => {
    const dataToUse = filteredReports.length > 0 ? filteredReports : visibilityReports;
    
    const totalReports = dataToUse.length;
    const completedReports = dataToUse.filter(report => report.status === 2 || report.status === 3).length;
    const pendingReports = dataToUse.filter(report => report.status === 0).length;
    const completionRate = totalReports > 0 ? (completedReports / totalReports) * 100 : 0;
    
    return { totalReports, completedReports, pendingReports, completionRate };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading route report...</p>
        </div>
      </div>
    );
  }

  if (!salesRep) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Sales representative not found.</p>
        </div>
      </div>
    );
  }

  const overallStats = getOverallStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard/journey-plans')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Route Report</h1>
                <p className="text-sm text-gray-600">
                  Visibility reports for {salesRep.name} - {salesRep.route_name || 'No route assigned'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 hidden">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.totalReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.completedReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.pendingReports}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
                             <div>
                 <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                 <p className="text-2xl font-bold text-gray-900">{overallStats.completionRate.toFixed(1)}%</p>
               </div>
            </div>
          </div>
        </div>

        {/* Filters and Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Visibility Reports</h2>
            <p className="text-sm text-gray-600">Filter and view all visibility reports for the selected period</p>
            
            {/* Filters */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <option value="all">All Status</option>
                  <option value={0}>Pending</option>
                  <option value={1}>In Progress</option>
                  <option value={2}>Completed</option>
                  <option value={3}>Verified</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Search:</label>
                <input
                  type="text"
                  placeholder="Search clients or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  const currentMonth = getCurrentMonthRange();
                  setStartDate(currentMonth.start);
                  setEndDate(currentMonth.end);
                }}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Current Month
              </button>
              {(startDate || endDate || statusFilter !== 'all' || searchTerm || clientIdFilter) && (
                <button
                  onClick={clearDateFilter}
                  className="px-4 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Results Summary */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredReports.length} of {visibilityReports.length} reports
              {startDate && endDate && startDate === endDate && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Date: {startDate}
                </span>
              )}
              {startDate && endDate && startDate !== endDate && ` from ${startDate} to ${endDate}`}
              {clientIdFilter && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Client ID: {clientIdFilter}
                </span>
              )}
            </div>
          </div>

          {/* Reports Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => {
                    const statusConfig = getStatusConfig(report.status);
                    return (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{formatDate(report.createdAt)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.imageUrl ? (
                            <img src={report.imageUrl} alt="Visibility Report" className="h-10 w-10 object-cover rounded-md" />
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-sm">
                              <FileText className="h-5 w-5" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="truncate">
                            {report.comment || <span className="text-gray-400">No comment</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-gray-300" />
                        <p>No visibility reports found</p>
                        {startDate || endDate || statusFilter !== 'all' || searchTerm ? (
                          <p className="text-sm">Try adjusting your filters</p>
                        ) : (
                          <p className="text-sm">No reports have been created yet</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteReportPage;