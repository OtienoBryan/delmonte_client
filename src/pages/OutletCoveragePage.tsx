import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Calendar, Download, TrendingUp } from 'lucide-react';

interface OutletCoverageData {
  salesRepId: number;
  salesRepName: string;
  region: string | null;
  expectedWeeklyCoverage: number | null;
  week1: number;
  week1Percentage: number | null;
  week2: number;
  week2Percentage: number | null;
  week3: number;
  week3Percentage: number | null;
  week4: number;
  week4Percentage: number | null;
  week5: number;
  week5Percentage: number | null;
}

interface WeekInfo {
  week: number;
  start: string;
  end: string;
}

const OutletCoveragePage: React.FC = () => {
  const navigate = useNavigate();
  const [coverageData, setCoverageData] = useState<OutletCoverageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchCoverageData();
  }, [selectedMonth, selectedYear]);

  const fetchCoverageData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/journey-plans/outlet-coverage', {
        params: {
          month: selectedMonth,
          year: selectedYear
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setCoverageData(response.data.data);
        setWeeks(response.data.weeks || []);
      } else {
        setError(response.data.message || 'Failed to fetch outlet coverage');
      }
    } catch (err: any) {
      console.error('Error fetching outlet coverage:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch outlet coverage');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const csvHeaders = ['Sales Rep Name', 'Region', 'Expected Weekly Coverage', 'Week 1', 'Week 1 %', 'Week 2', 'Week 2 %', 'Week 3', 'Week 3 %', 'Week 4', 'Week 4 %', 'Week 5', 'Week 5 %', 'Total Performance'];
      const csvRows = [csvHeaders.join(',')];
      
      coverageData.forEach(row => {
        // Calculate total performance (average of all week percentages)
        const percentages = [
          row.week1Percentage,
          row.week2Percentage,
          row.week3Percentage,
          row.week4Percentage,
          row.week5Percentage
        ].filter(p => p !== null) as number[];
        
        const totalPerformance = percentages.length > 0
          ? Number((percentages.reduce((sum, p) => sum + p, 0) / percentages.length).toFixed(1))
          : null;
        
        const values = [
          `"${row.salesRepName.replace(/"/g, '""')}"`,
          `"${(row.region || '').replace(/"/g, '""')}"`,
          row.expectedWeeklyCoverage ?? '',
          row.week1,
          row.week1Percentage !== null ? `${row.week1Percentage}%` : '',
          row.week2,
          row.week2Percentage !== null ? `${row.week2Percentage}%` : '',
          row.week3,
          row.week3Percentage !== null ? `${row.week3Percentage}%` : '',
          row.week4,
          row.week4Percentage !== null ? `${row.week4Percentage}%` : '',
          row.week5,
          row.week5Percentage !== null ? `${row.week5Percentage}%` : '',
          totalPerformance !== null ? `${totalPerformance}%` : ''
        ];
        csvRows.push(values.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `outlet-coverage-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const getWeekLabel = (weekNum: number) => {
    const week = weeks.find(w => w.week === weekNum);
    if (week) {
      const start = new Date(week.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = new Date(week.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `Week ${weekNum} (${start} - ${end})`;
    }
    return `Week ${weekNum}`;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/visits')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors text-xs"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Reports</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Outlet Coverage</h1>
                <p className="text-xs text-gray-600 mt-1">
                  Weekly outlet coverage by sales representative
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {monthNames.map((month, idx) => (
                    <option key={idx} value={idx + 1}>{month}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleExportCSV}
                disabled={exporting || coverageData.length === 0}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                <Download className="w-3 h-3" />
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-xs">
            {error}
          </div>
        )}

        {/* Coverage Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-xs text-gray-600">Loading outlet coverage data...</p>
            </div>
          ) : coverageData.length === 0 ? (
            <div className="p-8 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-600">No outlet coverage data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                      Sales Rep Name
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider sticky left-[120px] bg-gray-50 z-10">
                      Region
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Expected Weekly Coverage
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      {getWeekLabel(1)}
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Week 1 %
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      {getWeekLabel(2)}
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Week 2 %
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      {getWeekLabel(3)}
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Week 3 %
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      {getWeekLabel(4)}
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Week 4 %
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      {getWeekLabel(5)}
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Week 5 %
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Total Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coverageData.map((row) => {
                    const getCoverageColor = (coverage: number, expected: number | null) => {
                      if (expected === null || expected === 0) return '';
                      const percentage = (coverage / expected) * 100;
                      if (percentage >= 100) return 'bg-green-100 text-green-800';
                      if (percentage >= 80) return 'bg-yellow-100 text-yellow-800';
                      return 'bg-red-100 text-red-800';
                    };
                    
                    const getPercentageColor = (percentage: number | null) => {
                      if (percentage === null) return '';
                      if (percentage >= 100) return 'bg-green-100 text-green-800';
                      if (percentage >= 80) return 'bg-yellow-100 text-yellow-800';
                      return 'bg-red-100 text-red-800';
                    };
                    
                    // Calculate total performance (average of all week percentages)
                    const percentages = [
                      row.week1Percentage,
                      row.week2Percentage,
                      row.week3Percentage,
                      row.week4Percentage,
                      row.week5Percentage
                    ].filter(p => p !== null) as number[];
                    
                    const totalPerformance = percentages.length > 0
                      ? Number((percentages.reduce((sum, p) => sum + p, 0) / percentages.length).toFixed(1))
                      : null;
                    
                    return (
                      <tr key={row.salesRepId} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap sticky left-0 bg-white z-10">
                          <span className="text-[10px] font-medium text-gray-900">
                            {row.salesRepName}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap sticky left-[120px] bg-white z-10">
                          <span className="text-[10px] text-gray-900">
                            {row.region || 'Not set'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-[10px] text-gray-900">
                            {row.expectedWeeklyCoverage ?? 'Not set'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium ${getCoverageColor(row.week1, row.expectedWeeklyCoverage)}`}>
                            {row.week1}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium ${getPercentageColor(row.week1Percentage)}`}>
                            {row.week1Percentage !== null ? `${row.week1Percentage}%` : '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium ${getCoverageColor(row.week2, row.expectedWeeklyCoverage)}`}>
                            {row.week2}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium ${getPercentageColor(row.week2Percentage)}`}>
                            {row.week2Percentage !== null ? `${row.week2Percentage}%` : '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium ${getCoverageColor(row.week3, row.expectedWeeklyCoverage)}`}>
                            {row.week3}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium ${getPercentageColor(row.week3Percentage)}`}>
                            {row.week3Percentage !== null ? `${row.week3Percentage}%` : '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium ${getCoverageColor(row.week4, row.expectedWeeklyCoverage)}`}>
                            {row.week4}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium ${getPercentageColor(row.week4Percentage)}`}>
                            {row.week4Percentage !== null ? `${row.week4Percentage}%` : '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium ${getCoverageColor(row.week5, row.expectedWeeklyCoverage)}`}>
                            {row.week5}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium ${getPercentageColor(row.week5Percentage)}`}>
                            {row.week5Percentage !== null ? `${row.week5Percentage}%` : '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium ${getPercentageColor(totalPerformance)}`}>
                            {totalPerformance !== null ? `${totalPerformance}%` : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutletCoveragePage;
