import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';

interface Report {
  id: number;
  report_type: string;
  createdAt: string;
  notes: string;
  imageUrl?: string;
}

interface ReportsData {
  visibility_reports: Report[];
  feedback_reports: Report[];
  all_reports: Report[];
}

const SalesRepReportsPage: React.FC = () => {
  const { salesRepId, clientId } = useParams<{ salesRepId: string; clientId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [reports, setReports] = useState<ReportsData>({
    visibility_reports: [],
    feedback_reports: [],
    all_reports: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesRepName, setSalesRepName] = useState<string>('');
  const [outletName, setOutletName] = useState<string>('');
  const [selectedDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (salesRepId && clientId) {
      fetchReports();
      fetchSalesRepAndOutletInfo();
    }
  }, [salesRepId, clientId, selectedDate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        salesRepId: salesRepId!,
        clientId: clientId!,
        date: selectedDate
      });

      const response = await fetch(`/api/sales/rep/reports?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      console.log('Reports data received:', data);
      console.log('Visibility reports count:', data.visibility_reports?.length || 0);
      console.log('Feedback reports count:', data.feedback_reports?.length || 0);
      setReports(data);
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesRepAndOutletInfo = async () => {
    try {
      // Fetch sales rep name
      const salesRepResponse = await fetch(`/api/sales/sales-reps/${salesRepId}`);
      if (salesRepResponse.ok) {
        const salesRepData = await salesRepResponse.json();
        setSalesRepName(salesRepData.name);
      }

      // Fetch outlet name
      const outletResponse = await fetch(`/api/clients/${clientId}`);
      if (outletResponse.ok) {
        const outletData = await outletResponse.json();
        setOutletName(outletData.name);
      }
    } catch (err) {
      console.error('Error fetching additional info:', err);
    }
  };

  const exportToCSV = async () => {
    try {
      const headers = ['Report Type', 'Date', 'Notes/Feedback'];
      
      const csvData = reports.all_reports.map(report => [
        report.report_type === 'visibility' ? 'Visibility Report' : 'Feedback Report',
        report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A',
        report.notes || 'N/A'
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      a.download = `sales-rep-reports-${salesRepName}-${outletName}-${selectedDate}-${dateStr}.csv`;
      
      a.click();
      window.URL.revokeObjectURL(url);
      
      console.log('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error</p>
          <p>{error}</p>
          <button
            onClick={fetchReports}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Reports - {salesRepName} at {outletName}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Date: {selectedDate}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={exportToCSV}
            disabled={reports.all_reports.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-4 p-4 bg-gray-100 rounded hidden">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info:</h3>
        <p className="text-xs text-gray-600">Visibility Reports: {reports.visibility_reports?.length || 0}</p>
        <p className="text-xs text-gray-600">Feedback Reports: {reports.feedback_reports?.length || 0}</p>
        <p className="text-xs text-gray-600">All Reports: {reports.all_reports?.length || 0}</p>
      </div>

      {/* Reports Content */}
      {reports.all_reports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <p className="text-lg font-medium">No reports found</p>
            <p className="mt-2">No reports were found for this sales rep at this outlet on the selected date.</p>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Visibility Reports */}
          {reports.visibility_reports.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Visibility Reports</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Notes</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Image</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {reports.visibility_reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900">
                          {report.notes || 'N/A'}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900">
                          {report.imageUrl ? (
                            <img 
                              src={report.imageUrl} 
                              alt="Visibility Report" 
                              className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-75"
                              onClick={() => window.open(report.imageUrl, '_blank')}
                            />
                          ) : (
                            'No Image'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Feedback Reports */}
          {reports.feedback_reports && reports.feedback_reports.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Feedback Reports</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {reports.feedback_reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900">
                          {report.notes || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Feedback Reports</h2>
              <div className="text-center py-8 text-gray-500">
                No feedback reports found for this sales rep at this outlet on the selected date.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesRepReportsPage; 