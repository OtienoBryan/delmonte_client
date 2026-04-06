import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { outletVisitsService } from '../services/outletVisitsService';

interface VisitDetailRow {
  id: number;
  visit_date: string;
  checkInTime: string;
  checkOutTime: string | null;
  sales_rep_name: string | null;
  time_spent_minutes: number;
}

const OutletVisitDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { outletId } = useParams<{ outletId: string }>();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const outletName = searchParams.get('name') || '';
  const year = searchParams.get('year') ? parseInt(searchParams.get('year') as string, 10) : undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const [rows, setRows] = useState<VisitDetailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!outletId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await outletVisitsService.getOutletVisitDetails(
          parseInt(outletId, 10),
          year,
          startDate,
          endDate,
        );
        setRows(data || []);
      } catch (err: any) {
        console.error('Failed to fetch outlet visit details:', err);
        setError(err.message || 'Failed to fetch outlet visit details');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [outletId, year, startDate, endDate]);

  const subtitle =
    startDate || endDate
      ? `Date range: ${startDate || '...'} – ${endDate || '...'}`
      : year
      ? `Year: ${year}`
      : undefined;

  const handleExportCSV = () => {
    if (!rows || rows.length === 0) return;

    const headers = ['Date', 'Sales Rep', 'Check-in Time', 'Check-out Time', 'Time Spent (mins)'];
    const dataRows = rows.map((r) => [
      r.visit_date,
      r.sales_rep_name || 'N/A',
      r.checkInTime,
      r.checkOutTime || '',
      r.time_spent_minutes,
    ]);

    const csvContent = [
      headers.join(','),
      ...dataRows.map((row) =>
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
    link.setAttribute(
      'download',
      `Outlet_Visit_Details_${outletName || outletId || ''}_${year || ''}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-2 sm:px-4 lg:px-6">
      <div className="w-full">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-xs text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 text-[10px] bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Export
          </button>
        </div>

        <div className="mb-4">
          <h1 className="text-lg font-bold text-gray-900">
            Outlet Visits – {outletName || `Outlet #${outletId}`}
          </h1>
          {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-xs text-gray-500">Loading visits…</div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-red-600">{error}</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500">
              No visits found for this outlet in the selected period.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Sales Rep
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Check-in Time
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Check-out Time
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Time Spent (mins)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-1.5 text-[10px] text-gray-900">{d.visit_date}</td>
                    <td className="px-3 py-1.5 text-[10px] text-gray-900">
                      {d.sales_rep_name || 'N/A'}
                    </td>
                    <td className="px-3 py-1.5 text-[10px] text-gray-900">{d.checkInTime}</td>
                    <td className="px-3 py-1.5 text-[10px] text-gray-900">
                      {d.checkOutTime || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-[10px] text-gray-900">
                          {d.time_spent_minutes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutletVisitDetailsPage;

