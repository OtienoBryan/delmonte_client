import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface Notice {
  id: number;
  title: string;
  content: string;
  country?: string;
  country_id?: number;
  status?: number;
}

const NoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editNotice, setEditNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState<{ title: string; content: string; country_id?: number | null }>({ title: '', content: '', country_id: null });
  const [submitting, setSubmitting] = useState(false);
  const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);
  const [countryFilter, setCountryFilter] = useState<number | ''>('');
  const [showArchived, setShowArchived] = useState(false);

  const fetchNotices = async (countryId?: number | '', archived = false) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/notices';
      const params = [];
      if (countryId) params.push(`country_id=${countryId}`);
      params.push(`status=${archived ? 1 : 0}`);
      if (params.length) url += '?' + params.join('&');
      const res = await axios.get(url);
      setNotices(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notices');
    }
    setLoading(false);
  };

  useEffect(() => { fetchNotices(); }, []);

  useEffect(() => {
    axios.get('/api/notices/countries').then(res => setCountries(res.data));
  }, []);

  useEffect(() => { fetchNotices(countryFilter, showArchived); }, [countryFilter, showArchived]);

  const handleAdd = () => {
    setForm({ title: '', content: '', country_id: null });
    setEditNotice(null);
    setModalOpen(true);
  };

  const handleEdit = (notice: Notice) => {
    setForm({ title: notice.title, content: notice.content, country_id: notice.country_id });
    setEditNotice(notice);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await axios.delete(`/api/notices/${id}`);
      fetchNotices(countryFilter, showArchived);
    } catch (err: any) {
      setError(err.message || 'Failed to delete notice');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Prepare the data for submission
      const submitData = {
        title: form.title,
        content: form.content,
        country_id: form.country_id || null,
        status: 0 // Default to active
      };
      
      if (editNotice) {
        await axios.put(`/api/notices/${editNotice.id}`, submitData);
      } else {
        await axios.post('/api/notices', submitData);
      }
      setModalOpen(false);
      fetchNotices(countryFilter, showArchived);
    } catch (err: any) {
      setError(err.message || 'Failed to save notice');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-2 sm:px-4">
      <div className="sticky top-0 z-10 bg-white rounded-lg shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 py-2 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
          <div className="flex items-center gap-1.5">
            <label htmlFor="countryFilter" className="text-xs font-medium">Country:</label>
            <select
              id="countryFilter"
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value ? Number(e.target.value) : '')}
              className="border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Countries</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-1 text-xs font-medium">
            <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
            Show Archived
          </label>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-3 py-1.5 text-xs rounded-md hover:bg-blue-700 shadow"
        >
          Add Notice
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
      ) : error ? (
        <div className="text-red-600 text-xs mb-3">{error}</div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <svg width="60" height="60" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#f3f4f6"/><path d="M7 9h10M7 13h5" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/></svg>
          <div className="mt-3 text-base font-medium">No notices found</div>
          <div className="text-xs">Click "Add Notice" to create your first notice.</div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider w-1/2">Content</th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">
                      <div className="text-xs font-medium text-gray-900">{notice.title}</div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-xs text-gray-700 max-w-2xl whitespace-normal break-words" title={notice.content}>
                        {notice.content}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="text-xs text-gray-900">
                        {notice.country_id ? (countries.find(c => c.id === notice.country_id)?.name || notice.country_id) : <span className="text-gray-400">All</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        notice.status === 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {notice.status === 0 ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEdit(notice)}
                          title="Edit"
                          className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(notice.id)}
                          title="Delete"
                          className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {notices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" className="mx-auto mb-3">
                          <rect width="24" height="24" rx="12" fill="#f3f4f6"/>
                          <path d="M7 9h10M7 13h5" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <h3 className="text-base font-medium text-gray-900 mb-1">No notices found</h3>
                        <p className="text-xs text-gray-600">Click "Add Notice" to create your first notice.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition">
          <div className="bg-white rounded-xl p-4 w-full max-w-lg shadow-2xl relative animate-fadeIn">
            <h2 className="text-base font-bold mb-4 text-center">{editNotice ? 'Edit Notice' : 'Add Notice'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Content *</label>
                  <textarea
                    required
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs min-h-[80px] focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={form.country_id || ''}
                    onChange={e => setForm(f => ({ ...f, country_id: e.target.value ? Number(e.target.value) : null }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Countries</option>
                    {countries.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editNotice ? 'Save' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticesPage; 