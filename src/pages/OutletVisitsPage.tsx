import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, ArrowLeft, Download, RotateCcw, Building2, Activity, TrendingUp, ChevronRight } from 'lucide-react';
import { outletVisitsService, OutletVisitsRow } from '../services/outletVisitsService';
import { clientService } from '../services/clientService';

// Helper function to get first and last day of current month
const getCurrentMonthDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  
  return {
    start: formatDate(firstDay),
    end: formatDate(lastDay),
  };
};

// Calculate current month dates once at module load
const currentMonthDates = getCurrentMonthDates();

const OutletVisitsPage: React.FC = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<OutletVisitsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>(currentMonthDates.start);
  const [endDate, setEndDate] = useState<string>(currentMonthDates.end);
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number | 'all'>(25);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const [outletAccountId, setOutletAccountId] = useState<string>('');
  const [outletAccounts, setOutletAccounts] = useState<Array<{ id: number; name: string }>>([]);

  // Debounce search input
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    const loadOutletAccounts = async () => {
      try {
        const accounts = await clientService.getOutletAccounts();
        setOutletAccounts(accounts || []);
      } catch (err) {
        console.error('Failed to load outlet accounts for outlet visits filter:', err);
      }
    };
    loadOutletAccounts();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const effectiveLimit = limit === 'all' ? 999999 : limit;
      const effectivePage = limit === 'all' ? 1 : page;

      const result = await outletVisitsService.getSummary(
        year,
        startDate || undefined,
        endDate || undefined,
        effectivePage,
        effectiveLimit as number,
        search.trim() || undefined,
        outletAccountId || undefined,
      );

      setData(result.data || []);
      setTotalItems(result.pagination.totalItems);
      setTotalPages(result.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to fetch outlet visits:', err);
      setError(err.message || 'Failed to fetch outlet visits');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, startDate, endDate, search, page, limit, outletAccountId]);

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;

    const headers = ['Outlet', 'Outlet Account', 'Total Visits'];
    const rows = data.map((row) => [
      row.outlet_name,
      row.outlet_account_name || 'N/A',
      row.total,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Outlet_Visits_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalVisitsOnPage = useMemo(
    () => data.reduce((sum, row) => sum + (Number(row.total) || 0), 0),
    [data],
  );

  const averageVisitsOnPage = useMemo(
    () => (data.length > 0 ? (totalVisitsOnPage / data.length).toFixed(1) : '0.0'),
    [data, totalVisitsOnPage],
  );

  const topOutletOnPage = useMemo(
    () => data.reduce<OutletVisitsRow | null>((top, row) => {
      if (!top) return row;
      return (Number(row.total) || 0) > (Number(top.total) || 0) ? row : top;
    }, null),
    [data],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-6 px-2 sm:px-4 lg:px-6">
      <div className="w-full">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>

        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Outlet Visits</h1>
            <p className="text-xs text-gray-600 mt-0.5">
              Track outlet visit performance across the selected period.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
              {startDate || 'Any start'} - {endDate || 'Any end'}
            </span>
            {outletAccountId && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-800">
                Filtered Account
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Outlets (Page)</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-lg font-bold text-gray-900">{data.length}</p>
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Visits (Page)</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-lg font-bold text-gray-900">{totalVisitsOnPage}</p>
              <Activity className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Average Visits</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-lg font-bold text-gray-900">{averageVisitsOnPage}</p>
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-3">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Top Outlet (Page)</p>
            <p className="mt-1 text-xs font-semibold text-gray-900 truncate">
              {topOutletOnPage?.outlet_name || 'N/A'}
            </p>
            <p className="text-[10px] text-gray-500">{topOutletOnPage ? `${topOutletOnPage.total} visits` : '-'}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-3 mb-4">
          {/* Top row: search + actions */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="flex-1">
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Search Outlet
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by outlet name"
                  className="w-full pl-7 pr-2 py-1.5 text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="flex gap-1.5 sm:self-end">
              <button
                onClick={() => {
                  const currentMonth = getCurrentMonthDates();
                  setYear(new Date().getFullYear());
                  setStartDate(currentMonth.start);
                  setEndDate(currentMonth.end);
                  setSearch('');
                  setSearchInput('');
                  setOutletAccountId('');
                  setPage(1);
                }}
                className="inline-flex items-center px-2.5 py-1.5 text-[10px] bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center px-2.5 py-1.5 text-[10px] bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </button>
            </div>
          </div>

          {/* Second row: year, dates, outlet account */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || new Date().getFullYear();
                  setYear(v);
                  setPage(1);
                }}
                className="w-full px-2 py-1.5 text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-7 pr-2 py-1.5 text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-7 pr-2 py-1.5 text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Outlet Account
              </label>
              <select
                value={outletAccountId}
                onChange={(e) => {
                  setOutletAccountId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2 py-1.5 text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Outlet Accounts</option>
                {outletAccounts.map((oa) => (
                  <option key={oa.id} value={oa.id}>
                    {oa.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500">Loading outlet visits...</div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-red-600">{error}</div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No visit data available for the selected filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/90">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Outlet
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Outlet Account
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Total Visits
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((row) => (
                    <tr
                      key={row.outlet_id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/dashboard/reports/outlet-visits/${row.outlet_id}?name=${encodeURIComponent(
                            row.outlet_name,
                          )}&year=${year}${
                            startDate ? `&startDate=${startDate}` : ''
                          }${endDate ? `&endDate=${endDate}` : ''}`,
                        )
                      }
                    >
                      <td className="px-3 py-2 text-[10px] text-gray-900">{row.outlet_name}</td>
                      <td className="px-3 py-2 text-[10px] text-gray-700">
                        {row.outlet_account_name || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {row.total}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="inline-flex items-center text-[10px] font-medium text-blue-700">
                          Open <ChevronRight className="h-3 w-3 ml-0.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50/60">
                <div className="text-[10px] text-gray-600">
                  Showing page {page} of {totalPages} • {totalItems} outlets total
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-[10px]"
                    value={limit}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                      setLimit(val as any);
                      setPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value="all">View All</option>
                  </select>
                  <button
                    className="px-2.5 py-1 text-[10px] border rounded disabled:opacity-50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                  <button
                    className="px-2.5 py-1 text-[10px] border rounded disabled:opacity-50"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutletVisitsPage;

