import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { ArrowRight } from 'lucide-react';

interface AgingPayable {
  supplier_id: number;
  company_name: string;
  total_payable: number;
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
}

interface Account {
  id: number;
  account_code: string;
  account_name: string;
}

interface Payment {
  id: number;
  supplier_id: number;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  account_id: number;
  reference: string;
  notes: string;
  status: string;
}

const formatCurrency = (n: number) => Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'KES' });

const PayablesPage: React.FC = () => {
  const [payables, setPayables] = useState<AgingPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPayables = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = API_CONFIG.getUrl('/financial/payables/aging');
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
        setPayables(Array.isArray(data.data) ? data.data : []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch payables');
      } finally {
        setLoading(false);
      }
    };
    fetchPayables();
  }, []);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payables;
    return payables.filter(p => String(p.company_name || '').toLowerCase().includes(q));
  }, [payables, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.total_payable += Number(r.total_payable || 0);
        acc.current += Number(r.current || 0);
        acc.days_1_30 += Number(r.days_1_30 || 0);
        acc.days_31_60 += Number(r.days_31_60 || 0);
        acc.days_61_90 += Number(r.days_61_90 || 0);
        acc.days_90_plus += Number(r.days_90_plus || 0);
        return acc;
      },
      { total_payable: 0, current: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, days_90_plus: 0 }
    );
  }, [filtered]);

  const totalPayable = totals.total_payable;
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const startIdx = (page - 1) * limit;
  const pageRows = filtered.slice(startIdx, startIdx + limit);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Aging Payables</h1>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              placeholder="Search supplier..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Total Payable</p>
            <p className="text-xl font-bold text-blue-700">{formatCurrency(totals.total_payable)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">Current</p>
            <p className="text-xl font-semibold">{formatCurrency(totals.current)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">1-30 Days</p>
            <p className="text-xl font-semibold">{formatCurrency(totals.days_1_30)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">31-60 Days</p>
            <p className="text-xl font-semibold">{formatCurrency(totals.days_31_60)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">61-90 Days</p>
            <p className="text-xl font-semibold">{formatCurrency(totals.days_61_90)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">90+ Days</p>
            <p className="text-xl font-semibold">{formatCurrency(totals.days_90_plus)}</p>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="p-6 bg-white border border-gray-200 rounded-lg">Loading...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">{error}</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Supplier</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Total Payable</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Current</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">1-30 Days</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">31-60 Days</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">61-90 Days</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">90+ Days</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">No results.</td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.supplier_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{row.company_name}</div>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(row.total_payable)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(row.current)}</td>
                    <td className="px-4 py-2 text-right text-yellow-700">{formatCurrency(row.days_1_30)}</td>
                    <td className="px-4 py-2 text-right text-orange-700">{formatCurrency(row.days_31_60)}</td>
                    <td className="px-4 py-2 text-right text-red-700">{formatCurrency(row.days_61_90)}</td>
                    <td className="px-4 py-2 text-right text-red-900 font-bold">{formatCurrency(row.days_90_plus)}</td>
                    <td className="px-4 py-2 text-right">
                      <Link to={`/suppliers/${row.supplier_id}/ledger`} className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 text-sm">
                        View Ledger <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          <div className="flex items-center justify-between p-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages} • {filtered.length} suppliers
            </div>
            <div className="flex items-center gap-2">
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                value={limit}
                onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value) || 25); }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayablesPage; 