import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  Filter,
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  outletVisitsService,
  OutletVisitsRow,
} from '../services/outletVisitsService';
import { clientService } from '../services/clientService';

const months = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type MonthKey = (typeof months)[number] | 'total';

const OutletVisitsSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<OutletVisitsRow[]>([]);
  const [totals, setTotals] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number | 'all'>(25);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const [sortColumn, setSortColumn] = useState<MonthKey>('total');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [outletAccountId, setOutletAccountId] = useState<string>('');
  const [outletAccounts, setOutletAccounts] = useState<Array<{ id: number; name: string }>>([]);

  // Simple debounce
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
        console.error('Failed to load outlet accounts for visits summary filter:', err);
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

      let rows = result.data || [];

      // Client-side sort (values are numeric counts)
      if (sortColumn) {
        rows = [...rows].sort((a, b) => {
          const av = a[sortColumn as keyof OutletVisitsRow] as number;
          const bv = b[sortColumn as keyof OutletVisitsRow] as number;
          if (sortDirection === 'asc') return av - bv;
          return bv - av;
        });
      }

      setData(rows);
      setTotals(result.totals || null);
      setTotalItems(result.pagination.totalItems);
      setTotalPages(result.pagination.totalPages);
    } catch (err: any) {
      console.error('Failed to fetch outlet visits summary:', err);
      setError(err.message || 'Failed to fetch outlet visits summary');
      setData([]);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, startDate, endDate, search, page, limit, sortColumn, sortDirection, outletAccountId]);

  const handleSort = (column: MonthKey) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (column: MonthKey) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 inline-block ml-0.5" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 inline-block ml-0.5" />
    ) : (
      <ArrowDown className="w-3 h-3 inline-block ml-0.5" />
    );
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;

    const headers = ['Outlet', ...monthLabels, 'Total Visits'];
    const rows = data.map((row) => [
      row.outlet_name,
      row.january,
      row.february,
      row.march,
      row.april,
      row.may,
      row.june,
      row.july,
      row.august,
      row.september,
      row.october,
      row.november,
      row.december,
      row.total,
    ]);

    if (totals) {
      rows.push([
        'Grand Total',
        totals.january,
        totals.february,
        totals.march,
        totals.april,
        totals.may,
        totals.june,
        totals.july,
        totals.august,
        totals.september,
        totals.october,
        totals.november,
        totals.december,
        totals.total,
      ]);
    }

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
    link.setAttribute('download', `Outlet_Visits_Summary_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-2 sm:px-4 lg:px-6">
      <div className="w-full">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center text-xs text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>

        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Outlet Visits Summary</h1>
            <p className="text-xs text-gray-600">
              Yearly summary of number of visits per outlet, per month.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-3 mb-4">
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
                  placeholder="Search by outlet name..."
                  className="w-full pl-7 pr-2 py-1.5 text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-1.5 sm:self-end">
              <button
                onClick={() => {
                  setYear(new Date().getFullYear());
                  setStartDate('');
                  setEndDate('');
                  setSearch('');
                  setSearchInput('');
                  setOutletAccountId('');
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-[10px] bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300"
              >
                Clear
              </button>
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 text-[10px] bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
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
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-xs text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-red-600">{error}</div>
          ) : data.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500">
              No visits data available for the selected filters.
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Outlet
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Outlet Account
                    </th>
                    {months.map((m, idx) => (
                      <th
                        key={m}
                        className="px-2 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort(m)}
                      >
                        {monthLabels[idx]} {getSortIcon(m)}
                      </th>
                    ))}
                    <th
                      className="px-3 py-2 text-right text-[10px] font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('total')}
                    >
                      Total Visits {getSortIcon('total')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((row) => (
                    <tr key={row.outlet_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-[10px] text-gray-900">{row.outlet_name}</td>
                      <td className="px-3 py-2 text-[10px] text-gray-700">
                        {row.outlet_account_name || 'N/A'}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right text-gray-900">
                        {row.january || ''}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right text-gray-900">
                        {row.february || ''}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right text-gray-900">
                        {row.march || ''}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right text-gray-900">
                        {row.april || ''}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right text-gray-900">
                        {row.may || ''}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right text-gray-900">
                        {row.june || ''}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right text-gray-900">
                        {row.july || ''}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right text-gray-900">
                        {row.august || ''}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right text-gray-900">
                        {row.september || ''}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right text-gray-900">
                        {row.october || ''}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right text-gray-900">
                        {row.november || ''}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right text-gray-900">
                        {row.december || ''}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {row.total || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {totals && (
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td className="px-3 py-2 text-[10px] font-semibold text-gray-900">
                        Grand Total
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {totals.january}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {totals.february}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {totals.march}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {totals.april}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {totals.may}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {totals.june}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {totals.july}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {totals.august}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {totals.september}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {totals.october}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {totals.november}
                      </td>
                      <td className="px-2 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {totals.december}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-right font-semibold text-gray-900">
                        {totals.total}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200">
                <div className="text-[10px] text-gray-600">
                  Page {page} of {totalPages} • {totalItems} outlets
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

export default OutletVisitsSummaryPage;

