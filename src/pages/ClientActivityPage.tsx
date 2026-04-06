import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ClientActivity {
  id: number;
  name: string;
  total_orders: number;
  orders_in_period: number;
  last_order_date: string | null;
  days_since_last_order: number | null;
  status: string;
}

const ClientActivityPage: React.FC = () => {
  const [data, setData] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Set default start and end date to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchData = async (customPage: number, customLimit: number, customSearch = search) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/clients/activity';
      const params: Record<string, string | number> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      params.page = customPage;
      params.limit = customLimit;
      if (customSearch) params.search = customSearch;
      const query = new URLSearchParams(params as any).toString();
      if (query) url += `?${query}`;
      const res = await axios.get(url);
      setData(res.data.data || []);
      setPage(res.data.page || 1);
      setLimit(res.data.limit || 20);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch client activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page, limit, search);
    // eslint-disable-next-line
  }, [startDate, endDate, limit, page, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };
  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Client Activity</h1>
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search clients..."
          className="border rounded px-3 py-1"
        />
        <button type="submit" className="px-3 py-1 border rounded bg-blue-600 text-white">Search</button>
        {search && (
          <button type="button" onClick={handleClearSearch} className="px-3 py-1 border rounded bg-gray-200">Clear</button>
        )}
      </form>
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <button onClick={() => { setPage(page - 1); }} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
        <span>Page {page} of {totalPages} (Total: {total})</span>
        <button onClick={() => { setPage(page + 1); }} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600 mb-4">{error}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white shadow rounded-lg text-xs md:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">Client Name</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Total Orders</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Orders in Period</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Last Order Date</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Days Since Last Order</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map(client => {
                  let rowClass = '';
                  if (client.status === 'Active') rowClass = 'bg-green-50';
                  else if (client.status === 'Inactive') rowClass = 'bg-orange-50';
                  else if (client.status === 'Never Ordered') rowClass = 'bg-red-50';
                  return (
                    <tr key={client.id} className={rowClass}>
                      <td className="px-2 py-2 font-medium text-gray-900 whitespace-nowrap">{client.name}</td>
                      <td className="px-2 py-2 text-center">{client.total_orders}</td>
                      <td className="px-2 py-2 text-center">{client.orders_in_period}</td>
                      <td className="px-2 py-2 text-center">{client.last_order_date ? new Date(client.last_order_date).toLocaleDateString() : '-'}</td>
                      <td className="px-2 py-2 text-center">{client.last_order_date ? client.days_since_last_order : '-'}</td>
                      <td className="px-2 py-2 text-center">{client.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
              <div className="flex items-center gap-2">
                <label htmlFor="records-per-page" className="text-sm font-medium text-gray-700">Show:</label>
                <select
                  id="records-per-page"
                  className="border border-gray-300 rounded px-2 py-1"
                  value={limit}
                  onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                >
                  {[10, 20, 50, 100].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientActivityPage; 