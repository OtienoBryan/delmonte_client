import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DateTime } from 'luxon';
import { FileText, Calendar, User, MapPin, Search, Filter, Download, ArrowLeft, Clock, MessageSquare, Eye, Image } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure axios for authentication
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface FeedbackReport {
  id: number;
  reportId: string;
  comment: string;
  createdAt: string;
  outlet: string;
  country: string;
  salesRep: string;
}

interface VisibilityReport {
  id: number;
  reportId: number;
  comment: string;
  imageUrl: string;
  createdAt: string;
  outlet: string;
  country: string;
  salesRep: string;
}

interface MyReportsPageProps {
  clientId?: number;
  clientName?: string;
  salesRepId?: number;
  salesRepName?: string;
  visitDate?: string;
}

const MyReportsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'feedback' | 'visibility'>('feedback');
  const [feedbackReports, setFeedbackReports] = useState<FeedbackReport[]>([]);
  const [visibilityReports, setVisibilityReports] = useState<VisibilityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [filteredFeedbackReports, setFilteredFeedbackReports] = useState<FeedbackReport[]>([]);
  const [filteredVisibilityReports, setFilteredVisibilityReports] = useState<VisibilityReport[]>([]);

  // Get filter parameters from navigation state
  const { clientId, clientName, salesRepId, salesRepName, visitDate } = location.state as MyReportsPageProps || {};

  useEffect(() => {
    fetchFeedbackReports();
    fetchVisibilityReports();
  }, [clientId, salesRepId, visitDate, dateFilter, searchQuery]);

  useEffect(() => {
    filterFeedbackReports();
    filterVisibilityReports();
  }, [feedbackReports, visibilityReports, searchQuery, dateFilter]);

  const fetchFeedbackReports = async () => {
    try {
      let url = `${API_BASE_URL}/feedback-reports`;
      const params = new URLSearchParams();
      
      // Add date filter - prioritize visitDate from navigation, then dateFilter from UI
      const dateToFilter = visitDate || dateFilter;
      if (dateToFilter) {
        // Send date as-is without timezone conversion
        params.append('currentDate', dateToFilter);
      }
      
      // Add sales rep filter
      if (salesRepId) {
        params.append('salesRep', salesRepName || '');
      }
      
      // Add search filter
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, { headers: getAuthHeaders() });
      
      if (response.data.success) {
        let fetchedReports = response.data.data;
        
        // Filter by client ID if provided
        if (clientId) {
          fetchedReports = fetchedReports.filter((report: any) => {
            // This assumes the API returns clientId in the response
            // You may need to modify the API to include this field
            return true; // Placeholder - implement based on actual API response
          });
        }
        
        setFeedbackReports(fetchedReports);
      }
    } catch (err: any) {
      console.error('Error fetching feedback reports:', err);
    }
  };

  const fetchVisibilityReports = async () => {
    try {
      let url = `${API_BASE_URL}/visibility-reports`;
      const params = new URLSearchParams();
      
      // Add date filter - prioritize visitDate from navigation, then dateFilter from UI
      const dateToFilter = visitDate || dateFilter;
      if (dateToFilter) {
        // Send date as-is without timezone conversion
        params.append('currentDate', dateToFilter);
      }
      
      // Add sales rep filter
      if (salesRepId) {
        params.append('salesRep', salesRepName || '');
      }
      
      // Add search filter
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, { headers: getAuthHeaders() });
      
      if (response.data.success) {
        let fetchedReports = response.data.data || [];
        
        // Ensure fetchedReports is an array
        if (!Array.isArray(fetchedReports)) {
          console.error('Visibility reports data is not an array:', fetchedReports);
          setVisibilityReports([]);
          return;
        }
        
        // Filter by client ID if provided
        if (clientId) {
          fetchedReports = fetchedReports.filter((report: any) => {
            // This assumes the API returns clientId in the response
            // You may need to modify the API to include this field
            return true; // Placeholder - implement based on actual API response
          });
        }
        
        setVisibilityReports(fetchedReports);
      } else {
        console.error('Visibility reports API error:', response.data);
        setError('Failed to fetch visibility reports');
      }
    } catch (err: any) {
      console.error('Error fetching visibility reports:', err);
      setError(`Failed to fetch visibility reports: ${err.response?.data?.error || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filterFeedbackReports = () => {
    let filtered = [...feedbackReports];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report =>
        report.outlet.toLowerCase().includes(query) ||
        report.country.toLowerCase().includes(query) ||
        report.salesRep.toLowerCase().includes(query) ||
        report.comment.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(report => {
        if (!report.createdAt) return false;
        // Try SQL datetime first
        let date = DateTime.fromSQL(report.createdAt);
        if (date.isValid) {
          return date.toISODate() === dateFilter;
        }
        // Fallback to ISO
        date = DateTime.fromISO(report.createdAt);
        if (date.isValid) {
          return date.toISODate() === dateFilter;
        }
        const nativeDate = new Date(report.createdAt);
        if (!isNaN(nativeDate.getTime())) {
          return nativeDate.toISOString().split('T')[0] === dateFilter;
        }
        return false;
      });
    }

    setFilteredFeedbackReports(filtered);
  };

  const filterVisibilityReports = () => {
    let filtered = [...visibilityReports];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report =>
        report.outlet.toLowerCase().includes(query) ||
        report.country.toLowerCase().includes(query) ||
        report.salesRep.toLowerCase().includes(query) ||
        report.comment.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(report => {
        if (!report.createdAt) return false;
        // Try SQL datetime first
        let date = DateTime.fromSQL(report.createdAt);
        if (date.isValid) {
          return date.toISODate() === dateFilter;
        }
        // Fallback to ISO
        date = DateTime.fromISO(report.createdAt);
        if (date.isValid) {
          return date.toISODate() === dateFilter;
        }
        const nativeDate = new Date(report.createdAt);
        if (!isNaN(nativeDate.getTime())) {
          return nativeDate.toISOString().split('T')[0] === dateFilter;
        }
        return false;
      });
    }

    setFilteredVisibilityReports(filtered);
  };

  const exportToCSV = () => {
    const currentReports = activeTab === 'feedback' ? filteredFeedbackReports : filteredVisibilityReports;
    const headers = activeTab === 'feedback' 
      ? ['ID', 'Outlet', 'Country', 'Sales Rep', 'Comment', 'Date']
      : ['ID', 'Outlet', 'Country', 'Sales Rep', 'Comment', 'Image URL', 'Date'];
    
    const rows = currentReports.map(report => {
      const baseRow = [
        report.id,
        report.outlet,
        report.country,
        report.salesRep,
        report.comment,
        (() => {
          if (!report.createdAt) return 'N/A';
          // Try SQL datetime first
          let date = DateTime.fromSQL(report.createdAt);
          if (date.isValid) {
            return date.toISODate();
          }
          // Fallback to ISO
          date = DateTime.fromISO(report.createdAt);
          if (date.isValid) {
            return date.toISODate();
          }
          const nativeDate = new Date(report.createdAt);
          if (!isNaN(nativeDate.getTime())) {
            return nativeDate.toISOString().split('T')[0];
          }
          return 'Invalid Date';
        })()
      ];
      
      if (activeTab === 'visibility' && 'imageUrl' in report) {
        baseRow.splice(5, 0, report.imageUrl || '');
      }
      
      return baseRow;
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `my-${activeTab}-reports-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    // Extract date and time from the ISO string without any conversion
    // Format: 2025-09-07T20:08:29.590Z
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hours, minutes] = match;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = parseInt(month) - 1;
      return `${parseInt(day)} ${monthNames[monthIndex]} ${year}, ${hours}:${minutes}`;
    }
    
    // If the format doesn't match, try parsing as SQL datetime
    let parsedDate = DateTime.fromSQL(dateString);
    if (parsedDate.isValid) {
      // Display without timezone conversion
      return parsedDate.toFormat('d MMM yyyy, HH:mm');
    }
    
    // Fallback to native Date - format manually to avoid timezone conversion
    const nativeDate = new Date(dateString);
    if (!isNaN(nativeDate.getTime())) {
      // Format manually to show the exact time from database
      const year = nativeDate.getUTCFullYear();
      const month = nativeDate.getUTCMonth() + 1;
      const day = nativeDate.getUTCDate();
      const hours = nativeDate.getUTCHours();
      const minutes = nativeDate.getUTCMinutes();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${monthNames[month - 1]} ${year}, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // If all else fails, return the original string or a fallback
    return dateString || 'Invalid Date';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-4 sm:space-y-0">
            <div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <ArrowLeft className="h-6 w-6 text-gray-600" />
                </button>
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    My Reports
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    {clientName && salesRepName && visitDate 
                      ? `Feedback reports for ${clientName} by ${salesRepName} on ${visitDate}`
                      : 'View and manage your feedback reports'
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Reports
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by outlet, country, sales rep, or comment..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDateFilter('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('feedback')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'feedback'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback Reports
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {filteredFeedbackReports.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('visibility')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'visibility'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Visibility Reports
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {filteredVisibilityReports.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Reports Table */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-600 to-emerald-600">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
            <p className="mt-6 text-lg font-medium text-gray-700">Loading reports...</p>
            <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your feedback reports</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
              <div className="text-red-600 text-2xl">⚠️</div>
            </div>
            <h3 className="mt-6 text-lg font-medium text-red-900">Error Loading Reports</h3>
            <p className="mt-2 text-red-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => {
                setError(null);
                fetchFeedbackReports();
                fetchVisibilityReports();
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        ) : (activeTab === 'feedback' ? filteredFeedbackReports.length === 0 : filteredVisibilityReports.length === 0) ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <FileText className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-500">
              {searchQuery || dateFilter 
                ? 'No reports match your current filters. Try adjusting your search criteria.'
                : 'No feedback reports available at the moment.'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activeTab === 'feedback' ? 'Feedback Reports' : 'Visibility Reports'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Showing {activeTab === 'feedback' ? filteredFeedbackReports.length : filteredVisibilityReports.length} of {activeTab === 'feedback' ? feedbackReports.length : visibilityReports.length} reports
                  </p>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outlet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales Rep
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comment
                    </th>
                    {activeTab === 'visibility' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(activeTab === 'feedback' ? filteredFeedbackReports : filteredVisibilityReports).map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-full">
                              <MapPin className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{report.outlet}</div>
                            <div className="text-sm text-gray-500">ID: {report.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {report.country}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-full">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{report.salesRep}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={report.comment}>
                          {report.comment}
                        </div>
                      </td>
                      {activeTab === 'visibility' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {report.imageUrl ? (
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 rounded-full">
                                  <Image className="h-4 w-4 text-white" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <a
                                  href={report.imageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 truncate max-w-xs block"
                                >
                                  View Image
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No Image</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 rounded-full">
                              <Clock className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm text-gray-900">{formatDate(report.createdAt)}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReportsPage;
