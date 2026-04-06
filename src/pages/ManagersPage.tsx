import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Manager {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  region?: string;
  managerType?: string;
}

interface Country { id: number; name: string; }
interface Region { id: number; name: string; country_id?: number; }

const ManagerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Manager, 'id'>) => void;
  loading: boolean;
}> = ({ isOpen, onClose, onSubmit, loading }) => {
  const [form, setForm] = useState<Omit<Manager, 'id'>>({
    name: '',
    email: '',
    phoneNumber: '',
    country: '',
    region: '',
    managerType: ''
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/sales/countries').then(res => setCountries(res.data));
    }
  }, [isOpen]);

  useEffect(() => {
    if (form.country) {
      const selectedCountry = countries.find(c => c.name === form.country);
      if (selectedCountry) {
        axios.get('/api/sales/regions', { params: { country_id: selectedCountry.id } })
          .then(res => setRegions(res.data));
      } else {
        setRegions([]);
      }
    } else {
      setRegions([]);
    }
  }, [form.country, countries]);

  useEffect(() => {
    if (!isOpen) {
      setForm({ name: '', email: '', phoneNumber: '', country: '', region: '', managerType: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Manager</h2>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input type="tel" value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <select
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value, region: '' }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select country</option>
                {countries.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Region</label>
              <select
                value={form.region}
                onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={!form.country}
              >
                <option value="">{form.country ? 'Select region' : 'Select country first'}</option>
                {regions.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Manager Type</label>
              <select
                value={form.managerType}
                onChange={e => setForm(f => ({ ...f, managerType: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select type</option>
                <option value="Retail">Retail</option>
                <option value="Distribution">Distribution</option>
                <option value="Key Account">Key Account</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManagersPage: React.FC = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editManager, setEditManager] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Add state for countries and regions in edit modal
  const [editCountries, setEditCountries] = useState<Country[]>([]);
  const [editRegions, setEditRegions] = useState<Region[]>([]);

  const fetchManagers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/managers');
      setManagers(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch managers');
    }
    setLoading(false);
  };

  useEffect(() => { fetchManagers(); }, []);

  // Fetch countries when edit modal opens
  useEffect(() => {
    if (editModalOpen) {
      axios.get('/api/sales/countries').then(res => setEditCountries(res.data));
    }
  }, [editModalOpen]);

  // Fetch regions when country changes in edit modal
  useEffect(() => {
    if (editModalOpen && editManager && editManager.country) {
      const selectedCountry = editCountries.find(c => c.name === editManager.country);
      if (selectedCountry) {
        axios.get('/api/sales/regions', { params: { country_id: selectedCountry.id } })
          .then(res => setEditRegions(res.data));
      } else {
        setEditRegions([]);
      }
    } else if (editModalOpen) {
      setEditRegions([]);
    }
  }, [editModalOpen, editManager?.country, editCountries]);

  const handleAdd = async (data: Omit<Manager, 'id'>) => {
    setSubmitting(true);
    try {
      await axios.post('/api/managers', data);
      setModalOpen(false);
      await fetchManagers();
    } catch (err: any) {
      setError(err.message || 'Failed to add manager');
    }
    setSubmitting(false);
  };

  // Edit button handler
  const handleEditClick = (manager: any) => {
    setEditManager(manager);
    setEditModalOpen(true);
    setEditError(null);
  };

  // Edit modal save handler
  const handleEditSave = async (updated: any) => {
    setEditLoading(true);
    setEditError(null);
    try {
      await axios.put(`/api/managers/${updated.id}`, updated);
      setEditModalOpen(false);
      setEditManager(null);
      await fetchManagers();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update manager');
    }
    setEditLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Managers</h1>
        <button onClick={() => setModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add Manager</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600 mb-4">{error}</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {managers.map((manager) => (
                <tr key={manager.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{manager.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{manager.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{manager.phoneNumber || <span className="text-gray-400">Not specified</span>}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{manager.managerType || <span className="text-gray-400">Not specified</span>}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEditClick(manager)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {managers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No managers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <ManagerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAdd} loading={submitting} />
      {editModalOpen && editManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Manager</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleEditSave(editManager);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={editManager.name}
                    onChange={e => setEditManager({ ...editManager, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editManager.email || ''}
                    onChange={e => setEditManager({ ...editManager, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    value={editManager.phoneNumber || ''}
                    onChange={e => setEditManager({ ...editManager, phoneNumber: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <select
                    value={editManager.country || ''}
                    onChange={e => setEditManager({ ...editManager, country: e.target.value, region: '' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select country</option>
                    {editCountries.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Region</label>
                  <select
                    value={editManager.region || ''}
                    onChange={e => setEditManager({ ...editManager, region: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={!editManager.country}
                  >
                    <option value="">{editManager.country ? 'Select region' : 'Select country first'}</option>
                    {editRegions.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Manager Type</label>
                  <select
                    value={editManager.managerType || ''}
                    onChange={e => setEditManager({ ...editManager, managerType: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select type</option>
                    <option value="Retailer">Retailer</option>
                    <option value="Distribution">Distribution</option>
                    <option value="Key Channel">Key Channel</option>
                  </select>
                </div>
              </div>
              {editError && <div className="text-red-600 mt-2">{editError}</div>}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setEditManager(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagersPage; 