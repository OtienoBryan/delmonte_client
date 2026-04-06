import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { Rider, RiderCompany } from '../services/riderService';

const RiderEditModal: React.FC<{
  open: boolean;
  rider: Rider | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ open, rider, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Rider>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<RiderCompany[]>([]);

  useEffect(() => {
    if (open && rider) {
      setForm({ ...rider });
      setError(null);
    }
    if (open) {
      fetchCompanies();
    }
  }, [open, rider]);

  const fetchCompanies = async () => {
    try {
      const companiesData = await riderService.getCompanies();
      setCompanies(companiesData);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rider?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_CONFIG.getUrl(`/riders/${rider.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: form.name,
          contact: form.contact,
          id_number: form.id_number,
          company_id: form.company_id
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setLoading(false);
      onSave();
      onClose();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to update rider');
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Edit Rider</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
            <input 
              name="name" 
              value={form.name || ''} 
              onChange={handleChange} 
              className="border rounded px-2 py-1 w-full" 
              required 
              disabled={loading} 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contact</label>
            <input 
              name="contact" 
              value={form.contact || ''} 
              onChange={handleChange} 
              className="border rounded px-2 py-1 w-full" 
              required 
              disabled={loading} 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ID Number</label>
            <input 
              name="id_number" 
              value={form.id_number || ''} 
              onChange={handleChange} 
              className="border rounded px-2 py-1 w-full" 
              required 
              disabled={loading} 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
            <select 
              name="company_id" 
              value={form.company_id || ''} 
              onChange={handleChange} 
              className="border rounded px-2 py-1 w-full" 
              disabled={loading}
            >
              <option value="">-- Select Company --</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-50" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RiderAddModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}> = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Rider>>({
    name: '',
    contact: '',
    id_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<RiderCompany[]>([]);

  useEffect(() => {
    if (open) {
      fetchCompanies();
    }
  }, [open]);

  const fetchCompanies = async () => {
    try {
      const companiesData = await riderService.getCompanies();
      setCompanies(companiesData);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_CONFIG.getUrl('/riders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: form.name,
          contact: form.contact,
          id_number: form.id_number,
          company_id: form.company_id
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setLoading(false);
      onSave();
      onClose();
      setForm({ name: '', contact: '', id_number: '' });
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to add rider');
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Add Rider</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              className="border rounded px-2 py-1 w-full" 
              required 
              disabled={loading} 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contact</label>
            <input 
              name="contact" 
              value={form.contact} 
              onChange={handleChange} 
              className="border rounded px-2 py-1 w-full" 
              required 
              disabled={loading} 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ID Number</label>
            <input 
              name="id_number" 
              value={form.id_number} 
              onChange={handleChange} 
              className="border rounded px-2 py-1 w-full" 
              required 
              disabled={loading} 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
            <select 
              name="company_id" 
              value={form.company_id || ''} 
              onChange={handleChange} 
              className="border rounded px-2 py-1 w-full" 
              disabled={loading}
            >
              <option value="">-- Select Company --</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-50" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RidersPage: React.FC = () => {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editRider, setEditRider] = useState<Rider | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  const fetchRiders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_CONFIG.getUrl('/riders'), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.data) {
        setRiders(data.data || []);
      } else {
        setError('Failed to fetch riders');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch riders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

     const filtered = useMemo(() => {
     const q = search.trim().toLowerCase();
     const base = q
       ? riders.filter((r) =>
           [r.name, r.contact, r.id_number, r.company_name]
             .filter(Boolean)
             .some((v: string) => v.toLowerCase().includes(q))
         )
       : riders;
     return base;
   }, [riders, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const handleEdit = (rider: Rider) => {
    setEditRider(rider);
    setEditOpen(true);
  };

  const handleDelete = async (riderId: number) => {
    if (!confirm('Are you sure you want to delete this rider?')) return;
    
    try {
      const res = await fetch(API_CONFIG.getUrl(`/riders/${riderId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchRiders();
    } catch (err: any) {
      alert('Failed to delete rider: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Riders</h1>
          <p className="text-gray-600">Manage delivery riders and their information</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search riders..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔎</span>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow"
            onClick={() => setAddOpen(true)}
          >
            Add Rider
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Riders</p>
          <p className="text-2xl font-bold text-gray-900">{riders.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Filtered</p>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{riders.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full divide-y divide-gray-200">
                                                          <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID Number</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                                 {paged.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No riders found</td>
                   </tr>
                 ) : (
                  paged.map((rider) => (
                                         <tr key={rider.id} className="hover:bg-gray-50">
                       <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{rider.name}</td>
                       <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{rider.contact}</td>
                       <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{rider.id_number}</td>
                       <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{rider.company_name || 'N/A'}</td>
                                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                         <div className="inline-flex items-center gap-2">
                                                       <button
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                              onClick={() => navigate(`/financial/customer-orders?rider_id=${rider.id}&status=2,3,4`)}
                            >
                              Orders
                            </button>
                           <button
                             className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                             onClick={() => handleEdit(rider)}
                           >
                             Edit
                           </button>
                           <button
                             className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                             onClick={() => handleDelete(rider.id)}
                           >
                             Delete
                           </button>
                         </div>
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between p-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <span className="text-sm text-gray-700">Page {currentPage} / {totalPages}</span>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <RiderEditModal
        open={editOpen}
        rider={editRider}
        onClose={() => setEditOpen(false)}
        onSave={() => {
          setEditOpen(false);
          setEditRider(null);
          fetchRiders();
        }}
      />
      <RiderAddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={() => {
          setAddOpen(false);
          fetchRiders();
        }}
      />
    </div>
  );
};

export default RidersPage;
