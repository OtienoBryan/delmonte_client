import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService } from '../services/clientService';

const CustomerLedgerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchLedger = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await clientService.getCustomerLedger(id);
        setLedger(res.success ? res.data : []);
        // Fetch payments
        const payRes = await clientService.getCustomerPayments(id);
        setPayments(payRes.success ? payRes.data : []);
      } catch (err: any) {
        setError('Failed to fetch customer ledger');
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [id]);

  // Filter ledger entries by search and date
  const filteredLedger = ledger.filter(entry => {
    const searchLower = search.toLowerCase();
    const entryDate = entry.date ? new Date(entry.date) : null;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const matchesSearch =
      (entry.description && entry.description.toLowerCase().includes(searchLower)) ||
      (entry.reference_type && entry.reference_type.toLowerCase().includes(searchLower)) ||
      (entry.date && new Date(entry.date).toLocaleDateString().includes(searchLower));
    const matchesStart = !start || (entryDate && entryDate >= start);
    const matchesEnd = !end || (entryDate && entryDate <= end);
    return matchesSearch && matchesStart && matchesEnd;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLedger.length / pageSize);
  const paginatedLedger = filteredLedger.slice((page - 1) * pageSize, page * pageSize);

  // Compute current balance from the first entry in filteredLedger (since it's sorted DESC)
  const currentBalance = filteredLedger.length > 0 ? Number(filteredLedger[0].running_balance) : 0;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Customer Ledger</h1>
        <div className="text-lg font-semibold text-gray-800">
          Current Balance: {currentBalance.toLocaleString(undefined, { style: 'currency', currency: 'KES' })}
        </div>
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <label className="text-sm text-gray-700">Show
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="mx-2 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            entries
          </label>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search ledger..."
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
          />
          <input
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
          />
          <span>-</span>
          <input
            type="date"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-300"
          />
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Back</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference Type</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Running Balance</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedLedger.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-sm text-gray-500">No ledger entries found</td>
              </tr>
            ) : (
              paginatedLedger.map((entry, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.date ? new Date(entry.date).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.description || '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.reference_type || '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-green-600 font-semibold">
                    {entry.debit != null ? Number(entry.debit).toLocaleString(undefined, { style: 'currency', currency: 'KES' }) : '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-red-600 font-semibold">
                    {entry.credit != null ? Number(entry.credit).toLocaleString(undefined, { style: 'currency', currency: 'KES' }) : '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-gray-900">{entry.running_balance != null ? Number(entry.running_balance).toLocaleString(undefined, { style: 'currency', currency: 'KES' }) : '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.created_at ? new Date(entry.created_at).toLocaleString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Payments Table */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Payments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">No payments found</td>
                </tr>
              ) : (
                payments.map((p: any, idx: number) => (
                  <tr key={p.id || idx}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{p.date ? new Date(p.date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-green-600 font-semibold">{p.amount != null ? Number(p.amount).toLocaleString(undefined, { style: 'currency', currency: 'KES' }) : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{p.reference || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{p.invoice_id || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{p.status || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{p.created_at ? new Date(p.created_at).toLocaleString() : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="mx-2">Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CustomerLedgerPage; 