import React, { useEffect, useMemo, useState } from 'react';
import { API_CONFIG } from '../config/api';

interface Expense {
  id: number;
  account_id: number;
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  entry_date: string;
}

// Helper function to get current month date range
const getCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0]
  };
};

const ExpensesPage: React.FC = () => {
  const { startDate: defaultStartDate, endDate: defaultEndDate } = getCurrentMonthRange();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [accountNameFilter, setAccountNameFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        const url = API_CONFIG.getUrl(`/financial/expenses`) + (params.toString() ? `?${params.toString()}` : '');
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
        setExpenses(data.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch expenses');
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [startDate, endDate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  // Derived filters and pagination
  const accountNames = useMemo(() => Array.from(new Set(expenses.map(exp => exp.account_name))).sort(), [expenses]);
  const filteredExpenses = useMemo(() => {
    const byAccount = accountNameFilter === 'All' ? expenses : expenses.filter(exp => exp.account_name === accountNameFilter);
    const q = search.trim().toLowerCase();
    if (!q) return byAccount;
    return byAccount.filter(exp =>
      exp.account_name.toLowerCase().includes(q) ||
      exp.account_code.toLowerCase().includes(q) ||
      (exp.description || '').toLowerCase().includes(q)
    );
  }, [expenses, accountNameFilter, search]);
  const totalDebit = useMemo(() => filteredExpenses.reduce((sum, exp) => sum + (Number(exp.debit_amount) || 0), 0), [filteredExpenses]);
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / limit));
  const startIdx = (page - 1) * limit;
  const pageRows = filteredExpenses.slice(startIdx, startIdx + limit);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <div className="flex gap-2 items-end flex-wrap">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Account</label>
            <select
              value={accountNameFilter}
              onChange={e => { setPage(1); setAccountNameFilter(e.target.value); }}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="All">All</option>
              {accountNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={e => { setPage(1); setSearch(e.target.value); }}
              placeholder="Search description, code or name"
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <button
            type="button"
            onClick={() => { setStartDate(''); setEndDate(''); setAccountNameFilter('All'); setSearch(''); setPage(1); }}
            className="ml-2 px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300"
            disabled={!startDate && !endDate && accountNameFilter==='All' && !search}
          >
            Clear Filter
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm min-w-[240px] text-right">
          <div className="text-gray-600 text-sm">Total Expenses</div>
          <div className="text-2xl font-bold text-red-700">{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 }).format(isNaN(totalDebit) ? 0 : totalDebit)}</div>
        </div>
      </div>
      {loading ? (
        <div className="text-gray-600">Loading expenses...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Account Code</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Account Name</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">No expenses found.</td>
                </tr>
              ) : (
                pageRows.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{expense.id}</td>
                    <td className="px-4 py-2">{expense.account_code}</td>
                    <td className="px-4 py-2">{expense.account_name}</td>
                    <td className="px-4 py-2 text-right">{Number(expense.debit_amount || 0).toLocaleString(undefined, { style: 'currency', currency: 'KES' })}</td>
                    <td className="px-4 py-2">{expense.description || '-'}</td>
                    <td className="px-4 py-2">{formatDate(expense.entry_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex items-center justify-between p-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">Page {page} of {totalPages} • {filteredExpenses.length} expenses</div>
            <div className="flex items-center gap-2">
              <select className="border border-gray-300 rounded px-2 py-1 text-sm" value={limit} onChange={e => { setPage(1); setLimit(parseInt(e.target.value) || 25); }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
              <button className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage; 