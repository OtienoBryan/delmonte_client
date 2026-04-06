import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

interface SalesRep {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  region?: string;
  route_name_update?: string;
  photoUrl?: string;
}

interface AssignedManager {
  manager_id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  manager_type: string;
}

interface KeyAccountTarget {
  id: number;
  vapes_targets: number;
  pouches_targets: number;
  new_outlets_targets: number;
  target_month: string;
  created_at: string;
}

interface Manager {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
}

const AddKeyAccountTargetModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<KeyAccountTarget, 'id' | 'created_at'>) => void;
  loading: boolean;
  initial?: Partial<Omit<KeyAccountTarget, 'id' | 'created_at'>>;
}> = ({ isOpen, onClose, onSubmit, loading, initial }) => {
  const [form, setForm] = useState({ vapes_targets: 0, pouches_targets: 0, new_outlets_targets: 0, target_month: '' });
  useEffect(() => {
    if (!isOpen) setForm({ vapes_targets: 0, pouches_targets: 0, new_outlets_targets: 0, target_month: '' });
    else if (initial) setForm({
      vapes_targets: initial.vapes_targets ?? 0,
      pouches_targets: initial.pouches_targets ?? 0,
      new_outlets_targets: initial.new_outlets_targets ?? 0,
      target_month: initial.target_month ?? ''
    });
  }, [isOpen, initial]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-5 w-full max-w-md">
        <h2 className="text-lg font-bold mb-3">{initial ? 'Edit' : 'Add'} Key Account Targets</h2>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Month</label>
              <input type="month" required value={form.target_month} onChange={e => setForm(f => ({ ...f, target_month: e.target.value }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Vapes Targets</label>
              <input type="number" min={0} value={form.vapes_targets} onChange={e => setForm(f => ({ ...f, vapes_targets: Number(e.target.value) }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">Pouches Targets</label>
              <input type="number" min={0} value={form.pouches_targets} onChange={e => setForm(f => ({ ...f, pouches_targets: Number(e.target.value) }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">New Outlets Targets</label>
              <input type="number" min={0} value={form.new_outlets_targets} onChange={e => setForm(f => ({ ...f, new_outlets_targets: Number(e.target.value) }))} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-xs" />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-5">
            <button type="button" onClick={onClose} className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : (initial ? 'Save' : 'Add')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const KeyAccountTargetsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  salesRepId: string;
}> = ({ isOpen, onClose, salesRepId }) => {
  const [targets, setTargets] = useState<KeyAccountTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [editTarget, setEditTarget] = useState<KeyAccountTarget | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      axios.get(`/api/sales/sales-reps/${salesRepId}/key-account-targets`)
        .then(res => setTargets(res.data))
        .catch(err => setError(err.message || 'Failed to fetch targets'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, salesRepId]);

  const refreshTargets = async () => {
    setLoading(true);
    const res = await axios.get(`/api/sales/sales-reps/${salesRepId}/key-account-targets`);
    setTargets(res.data);
    setLoading(false);
  };

  const handleAddTarget = async (data: Omit<KeyAccountTarget, 'id' | 'created_at'>) => {
    setSavingTarget(true);
    setError(null);
    try {
      await axios.post(`/api/sales/sales-reps/${salesRepId}/key-account-targets`, data);
      setTargetModalOpen(false);
      await refreshTargets();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add target');
    }
    setSavingTarget(false);
  };
  const handleEditTarget = (target: KeyAccountTarget) => setEditTarget(target);
  const handleUpdateTarget = async (data: Omit<KeyAccountTarget, 'id' | 'created_at'>) => {
    if (!editTarget) return;
    setSavingTarget(true);
    setError(null);
    try {
      await axios.put(`/api/sales/sales-reps/${salesRepId}/key-account-targets/${editTarget.id}`, data);
      setEditTarget(null);
      await refreshTargets();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update target');
    }
    setSavingTarget(false);
  };
  const handleDeleteTarget = async (targetId: number) => {
    if (!window.confirm('Are you sure you want to delete this target?')) return;
    await axios.delete(`/api/sales/sales-reps/${salesRepId}/key-account-targets/${targetId}`);
    await refreshTargets();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">Key Account Targets</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
        <button onClick={() => setTargetModalOpen(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 mb-3">Add Targets</button>
        {loading ? <div>Loading...</div> : (
          <table className="min-w-full divide-y divide-gray-200 mb-3 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Vapes</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Pouches</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">New Outlets</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {targets.map(tgt => (
                <tr key={tgt.id}>
                  <td className="px-3 py-2">{tgt.vapes_targets}</td>
                  <td className="px-3 py-2">{tgt.pouches_targets}</td>
                  <td className="px-3 py-2">{tgt.new_outlets_targets}</td>
                  <td className="px-3 py-2">{tgt.target_month}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => handleEditTarget(tgt)} className="bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded mr-2 text-[11px] hover:bg-blue-200 transition">Edit</button>
                    <button onClick={() => handleDeleteTarget(tgt.id)} className="bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded text-[11px] hover:bg-red-200 transition">Delete</button>
                  </td>
                </tr>
              ))}
              {targets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-center text-gray-500 text-sm">No targets set.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        <AddKeyAccountTargetModal
          isOpen={targetModalOpen || !!editTarget}
          onClose={() => { setTargetModalOpen(false); setEditTarget(null); }}
          onSubmit={editTarget ? handleUpdateTarget : handleAddTarget}
          loading={savingTarget}
          initial={editTarget || undefined}
        />
      </div>
    </div>
  );
};

const RetailTargetsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  salesRepId: string;
}> = ({ isOpen, onClose, salesRepId }) => {
  const [targets, setTargets] = useState<KeyAccountTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [editTarget, setEditTarget] = useState<KeyAccountTarget | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      axios.get(`/api/sales/sales-reps/${salesRepId}/retail-targets`)
        .then(res => setTargets(res.data))
        .catch(err => setError(err.message || 'Failed to fetch targets'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, salesRepId]);

  const refreshTargets = async () => {
    setLoading(true);
    const res = await axios.get(`/api/sales/sales-reps/${salesRepId}/retail-targets`);
    setTargets(res.data);
    setLoading(false);
  };

  const handleAddTarget = async (data: Omit<KeyAccountTarget, 'id' | 'created_at'>) => {
    setSavingTarget(true);
    setError(null);
    try {
      await axios.post(`/api/sales/sales-reps/${salesRepId}/retail-targets`, data);
      setTargetModalOpen(false);
      await refreshTargets();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add target');
    }
    setSavingTarget(false);
  };
  const handleEditTarget = (target: KeyAccountTarget) => setEditTarget(target);
  const handleUpdateTarget = async (data: Omit<KeyAccountTarget, 'id' | 'created_at'>) => {
    if (!editTarget) return;
    setSavingTarget(true);
    setError(null);
    try {
      await axios.put(`/api/sales/sales-reps/${salesRepId}/retail-targets/${editTarget.id}`, data);
      setEditTarget(null);
      await refreshTargets();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update target');
    }
    setSavingTarget(false);
  };
  const handleDeleteTarget = async (targetId: number) => {
    if (!window.confirm('Are you sure you want to delete this target?')) return;
    await axios.delete(`/api/sales/sales-reps/${salesRepId}/retail-targets/${targetId}`);
    await refreshTargets();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">Retail Targets</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
        <button onClick={() => setTargetModalOpen(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 mb-3">Add Targets</button>
        {loading ? <div>Loading...</div> : (
          <table className="min-w-full divide-y divide-gray-200 mb-3 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Vapes</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Pouches</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">New Outlets</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {targets.map(tgt => (
                <tr key={tgt.id}>
                  <td className="px-3 py-2">{tgt.vapes_targets}</td>
                  <td className="px-3 py-2">{tgt.pouches_targets}</td>
                  <td className="px-3 py-2">{tgt.new_outlets_targets}</td>
                  <td className="px-3 py-2">{tgt.target_month}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => handleEditTarget(tgt)} className="bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded mr-2 text-[11px] hover:bg-blue-200 transition">Edit</button>
                    <button onClick={() => handleDeleteTarget(tgt.id)} className="bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded text-[11px] hover:bg-red-200 transition">Delete</button>
                  </td>
                </tr>
              ))}
              {targets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-center text-gray-500 text-sm">No targets set.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        <AddKeyAccountTargetModal
          isOpen={targetModalOpen || !!editTarget}
          onClose={() => { setTargetModalOpen(false); setEditTarget(null); }}
          onSubmit={editTarget ? handleUpdateTarget : handleAddTarget}
          loading={savingTarget}
          initial={editTarget || undefined}
        />
      </div>
    </div>
  );
};

const DistributorsTargetsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  salesRepId: string;
}> = ({ isOpen, onClose, salesRepId }) => {
  const [targets, setTargets] = useState<KeyAccountTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [editTarget, setEditTarget] = useState<KeyAccountTarget | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      axios.get(`/api/sales/sales-reps/${salesRepId}/distributors-targets`)
        .then(res => setTargets(res.data))
        .catch(err => setError(err.message || 'Failed to fetch targets'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, salesRepId]);

  const refreshTargets = async () => {
    setLoading(true);
    const res = await axios.get(`/api/sales/sales-reps/${salesRepId}/distributors-targets`);
    setTargets(res.data);
    setLoading(false);
  };

  const handleAddTarget = async (data: Omit<KeyAccountTarget, 'id' | 'created_at'>) => {
    setSavingTarget(true);
    setError(null);
    try {
      await axios.post(`/api/sales/sales-reps/${salesRepId}/distributors-targets`, data);
      setTargetModalOpen(false);
      await refreshTargets();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add target');
    }
    setSavingTarget(false);
  };
  const handleEditTarget = (target: KeyAccountTarget) => setEditTarget(target);
  const handleUpdateTarget = async (data: Omit<KeyAccountTarget, 'id' | 'created_at'>) => {
    if (!editTarget) return;
    setSavingTarget(true);
    setError(null);
    try {
      await axios.put(`/api/sales/sales-reps/${salesRepId}/distributors-targets/${editTarget.id}`, data);
      setEditTarget(null);
      await refreshTargets();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update target');
    }
    setSavingTarget(false);
  };
  const handleDeleteTarget = async (targetId: number) => {
    if (!window.confirm('Are you sure you want to delete this target?')) return;
    await axios.delete(`/api/sales/sales-reps/${salesRepId}/distributors-targets/${targetId}`);
    await refreshTargets();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">Distributors Targets</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
        <button onClick={() => setTargetModalOpen(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 mb-3">Add Targets</button>
        {loading ? <div>Loading...</div> : (
          <table className="min-w-full divide-y divide-gray-200 mb-3 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Vapes</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Pouches</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">New Outlets</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {targets.map(tgt => (
                <tr key={tgt.id}>
                  <td className="px-3 py-2">{tgt.vapes_targets}</td>
                  <td className="px-3 py-2">{tgt.pouches_targets}</td>
                  <td className="px-3 py-2">{tgt.new_outlets_targets}</td>
                  <td className="px-3 py-2">{tgt.target_month}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => handleEditTarget(tgt)} className="bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded mr-2 text-[11px] hover:bg-blue-200 transition">Edit</button>
                    <button onClick={() => handleDeleteTarget(tgt.id)} className="bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded text-[11px] hover:bg-red-200 transition">Delete</button>
                  </td>
                </tr>
              ))}
              {targets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-center text-gray-500 text-sm">No targets set.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        <AddKeyAccountTargetModal
          isOpen={targetModalOpen || !!editTarget}
          onClose={() => { setTargetModalOpen(false); setEditTarget(null); }}
          onSubmit={editTarget ? handleUpdateTarget : handleAddTarget}
          loading={savingTarget}
          initial={editTarget || undefined}
        />
      </div>
    </div>
  );
};

const AssignManagerTypesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  salesRepId: string;
}> = ({ isOpen, onClose, salesRepId }) => {
  const [allManagers, setAllManagers] = useState<Manager[]>([]);
  const [assignments, setAssignments] = useState<{ [type: string]: number | '' }>({ Retail: '', 'Key Account': '', Distribution: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const managerTypes = ['Retail', 'Key Account', 'Distribution'];

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
        axios.get('/api/managers'),
        axios.get(`/api/sales/sales-reps/${salesRepId}/manager-assignments`)
      ]).then(([allRes, assignedRes]) => {
        setAllManagers(allRes.data);
        const initial: { [type: string]: number | '' } = { Retail: '', 'Key Account': '', Distribution: '' };
        assignedRes.data.forEach((a: any) => {
          initial[a.manager_type] = a.manager_id;
        });
        setAssignments(initial);
      }).catch(err => setError(err.message || 'Failed to fetch managers')).finally(() => setLoading(false));
    }
  }, [isOpen, salesRepId]);

  const handleChange = (type: string, managerId: string) => {
    setAssignments(a => ({ ...a, [type]: managerId ? Number(managerId) : '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = managerTypes.map(type => ({ manager_type: type, manager_id: assignments[type] || null })).filter(a => a.manager_id);
      await axios.post(`/api/sales/sales-reps/${salesRepId}/manager-assignments`, { assignments: payload });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save assignments');
    }
    setSaving(false);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-5 w-full max-w-md">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">Assign Managers by Type</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
        {loading ? <div>Loading...</div> : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {managerTypes.map(type => (
                <div key={type}>
                  <label className="block text-xs font-medium text-gray-700">{type} Manager</label>
                  <select
                    value={assignments[type]}
                    onChange={e => handleChange(type, e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-xs"
                  >
                    <option value="">Select {type} Manager</option>
                    {allManagers.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 mt-5">
              <button type="button" onClick={onClose} className="px-3 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const SalesRepDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [salesRep, setSalesRep] = useState<SalesRep | null>(null);
  const [managers, setManagers] = useState<AssignedManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetsModalOpen, setTargetsModalOpen] = useState(false);
  const [retailTargetsModalOpen, setRetailTargetsModalOpen] = useState(false);
  const [distributorsTargetsModalOpen, setDistributorsTargetsModalOpen] = useState(false);
  const [assignManagerTypesModalOpen, setAssignManagerTypesModalOpen] = useState(false);
  const [managerAssignments, setManagerAssignments] = useState<{ [type: string]: { name: string; email: string } | null }>({ Retail: null, 'Key Account': null, Distribution: null });

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const [repRes, mgrRes, tgtRes, assignRes] = await Promise.all([
          axios.get(`/api/sales/sales-reps/${id}`),
          axios.get(`/api/sales/sales-reps/${id}/managers`),
          axios.get(`/api/sales/sales-reps/${id}/key-account-targets`),
          axios.get(`/api/sales/sales-reps/${id}/manager-assignments`)
        ]);
        setSalesRep(repRes.data);
        setManagers(mgrRes.data);
        // setTargets(tgtRes.data); // targets now in modal
        const assignments: { [type: string]: { name: string; email: string } | null } = { Retail: null, 'Key Account': null, Distribution: null };
        assignRes.data.forEach((a: any) => {
          assignments[a.manager_type] = { name: a.name, email: a.email };
        });
        setManagerAssignments(assignments);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch sales rep details');
      }
      setLoading(false);
    };
    if (id) fetchDetails();
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!salesRep) return <div className="p-8 text-gray-500">Sales rep not found.</div>;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <Link to="/sales-reps" className="text-blue-600 hover:underline mb-3 inline-block text-sm">&larr; Back to Sales Reps</Link>
      <div className="bg-white rounded shadow p-5 mb-5">
        <div className="flex items-center gap-5 mb-3">
          {salesRep.photoUrl ? (
            <img src={salesRep.photoUrl} alt={salesRep.name} className="h-20 w-20 rounded-full object-cover border" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-700">{salesRep.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold mb-1">{salesRep.name}</h1>
            <div className="text-gray-700 text-sm">{salesRep.email}</div>
            <div className="text-gray-500 text-sm">{salesRep.phoneNumber}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
          <div><span className="font-semibold">Country:</span> {salesRep.country || <span className="text-gray-400">Not specified</span>}</div>
          <div><span className="font-semibold">Region:</span> {salesRep.region || <span className="text-gray-400">Not specified</span>}</div>
          <div><span className="font-semibold">Route:</span> {salesRep.route_name_update || <span className="text-gray-400">Not specified</span>}</div>
        </div>
        <div className="mt-4">
          <h2 className="text-base font-semibold mb-2">Assigned Managers by Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {['Retail', 'Key Account', 'Distribution'].map(type => (
              <div key={type} className="border rounded p-2.5 bg-gray-50">
                <div className="font-semibold text-gray-700 mb-1 text-sm">{type} Manager</div>
                {managerAssignments[type] ? (
                  <>
                    <div className="text-gray-900 text-sm">{managerAssignments[type]!.name}</div>
                    <div className="text-gray-500 text-[11px]">{managerAssignments[type]!.email}</div>
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">Not assigned</div>
                )}
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setTargetsModalOpen(true)} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 mt-5">Manage Key Account Targets</button>
        <button onClick={() => setRetailTargetsModalOpen(true)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700 mt-5 ml-3">Manage Retail Targets</button>
        <button onClick={() => setDistributorsTargetsModalOpen(true)} className="bg-yellow-600 text-white px-3 py-1.5 rounded text-xs hover:bg-yellow-700 mt-5 ml-3">Manage Distributors Targets</button>
        <button onClick={() => setAssignManagerTypesModalOpen(true)} className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs hover:bg-purple-700 mt-5 ml-3">Assign Managers by Type</button>
      </div>
      <KeyAccountTargetsModal
        isOpen={targetsModalOpen}
        onClose={() => setTargetsModalOpen(false)}
        salesRepId={id!}
      />
      <RetailTargetsModal
        isOpen={retailTargetsModalOpen}
        onClose={() => setRetailTargetsModalOpen(false)}
        salesRepId={id!}
      />
      <DistributorsTargetsModal
        isOpen={distributorsTargetsModalOpen}
        onClose={() => setDistributorsTargetsModalOpen(false)}
        salesRepId={id!}
      />
      <AssignManagerTypesModal
        isOpen={assignManagerTypesModalOpen}
        onClose={() => setAssignManagerTypesModalOpen(false)}
        salesRepId={id!}
      />
    </div>
  );
};

export default SalesRepDetailsPage; 