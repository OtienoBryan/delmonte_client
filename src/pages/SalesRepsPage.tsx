import React, { useEffect, useState } from 'react';
import { salesService, SalesRep, CreateSalesRepData, Country, Region, Route as SalesRoute, SalesRepTargets } from '../services/salesService';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { saveAs } from 'file-saver';
import SalesRepTargetsModal from '../components/SalesRepTargetsModal';
import { useAuth } from '../contexts/AuthContext';

interface SalesRepModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesRep?: SalesRep;
  onSubmit: (data: CreateSalesRepData) => void;
  loading: boolean;
}

const SalesRepModal: React.FC<SalesRepModalProps> = ({ 
  isOpen, 
  onClose, 
  salesRep, 
  onSubmit, 
  loading 
}) => {
  const [formData, setFormData] = useState<CreateSalesRepData & { status?: number }>({
    name: '',
    email: '',
    phoneNumber: '',
    country: '',
    region: '',
    route_name_update: '',
    photoUrl: '',
    role: 'sales rep',
    expected_weekly_coverage: undefined,
    status: 1,
  });
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [routes, setRoutes] = useState<SalesRoute[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      salesService.getCountries().then(setCountries);
      salesService.getRoutes().then(setRoutes);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.country) {
      const selectedCountry = countries.find(c => c.name === formData.country);
      if (selectedCountry) {
        salesService.getRegions(selectedCountry.id).then(setRegions);
      } else {
        setRegions([]);
      }
    } else {
      setRegions([]);
    }
  }, [formData.country, countries]);

  useEffect(() => {
    if (salesRep) {
      setFormData({
        name: salesRep.name,
        email: salesRep.email,
        phoneNumber: salesRep.phoneNumber || '',
        country: salesRep.country || '',
        region: salesRep.region || '',
        route_name_update: salesRep.route_name_update || '',
        photoUrl: salesRep.photoUrl || '',
        role: salesRep.role || 'sales rep',
        expected_weekly_coverage: salesRep.expected_weekly_coverage,
        status: salesRep.status ?? 1,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        country: '',
        region: '',
        route_name_update: '',
        photoUrl: '',
        role: 'sales rep',
        expected_weekly_coverage: undefined,
        status: 1,
      });
    }
  }, [salesRep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">
            {salesRep ? 'Edit Staff' : 'Add New Staff'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Phone Number *</label>
            <input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Country</label>
            <select
              value={formData.country}
              onChange={e => setFormData({ ...formData, country: e.target.value, region: '' })}
              className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select country</option>
              {countries.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Region</label>
            <select
              value={formData.region}
              onChange={e => setFormData({ ...formData, region: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={!formData.country}
            >
              <option value="">{formData.country ? 'Select region' : 'Select country first'}</option>
              {regions.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Route</label>
            <select
              value={formData.route_name_update}
              onChange={e => setFormData({ ...formData, route_name_update: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select route</option>
              {routes.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                setUploadError(null);
                const formData = new FormData();
                formData.append('photo', file);
                try {
                  const res = await fetch('/api/sales/sales-reps/upload-photo', {
                    method: 'POST',
                    body: formData,
                  });
                  const data = await res.json();
                  if (data.url) {
                    setFormData((prev) => ({ ...prev, photoUrl: data.url }));
                  } else {
                    setUploadError(data.error || 'Upload failed');
                  }
                } catch (err: any) {
                  setUploadError(err.message || 'Upload failed');
                }
                setUploading(false);
              }}
              className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {uploading && <div className="text-blue-600 text-[10px] mt-1">Uploading...</div>}
            {uploadError && <div className="text-red-600 text-[10px] mt-1">{uploadError}</div>}
            {formData.photoUrl && (
              <div className="mt-2">
                <img src={formData.photoUrl} alt="Preview" className="h-12 w-12 rounded-full object-cover border" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Role</label>
            <select
              value={formData.role || 'sales rep'}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sales rep">Sales Rep</option>
              <option value="team leader">Team Leader</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Expected Weekly Coverage</label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.expected_weekly_coverage ?? ''}
              onChange={(e) => setFormData({ ...formData, expected_weekly_coverage: e.target.value ? Number(e.target.value) : undefined })}
              className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter number"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-700 mb-1.5">Status</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.status === 1}
                onChange={e => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
                className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                id="status-toggle"
              />
              <label htmlFor="status-toggle" className="ml-2 text-[10px]">
                {formData.status === 1 ? 'Active' : 'Inactive'}
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 border border-gray-300 rounded-lg text-[10px] text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : (salesRep ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface Manager {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  managerType?: string;
}

const AssignTeamLeaderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  salesRepId: number | null;
  salesRepName?: string;
  onSuccess: () => void;
}> = ({ isOpen, onClose, salesRepId, salesRepName, onSuccess }) => {
  const [teamLeaders, setTeamLeaders] = useState<{ id: number; name: string }[]>([]);
  const [selectedTeamLeaderId, setSelectedTeamLeaderId] = useState<number | null>(null);
  const [currentTeamLeader, setCurrentTeamLeader] = useState<{ id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && salesRepId) {
      setLoading(true);
      Promise.all([
        axios.get('/api/sales/team-leaders').then(res => {
          const allTeamLeaders = Array.isArray(res.data) ? res.data : (res.data.data || []);
          // Filter out the current sales rep if they are a team leader
          return allTeamLeaders
            .filter((tl: SalesRep) => tl.id !== salesRepId)
            .map((tl: SalesRep) => ({ id: tl.id, name: tl.name }));
        }),
        axios.get(`/api/sales/sales-reps/${salesRepId}/team-leader`).then(res => {
          return res.data;
        }).catch(() => null)
      ]).then(([leaders, current]) => {
        setTeamLeaders(leaders);
        if (current && current.id) {
          setCurrentTeamLeader({ id: current.id, name: current.name });
          setSelectedTeamLeaderId(current.id);
        } else {
          setCurrentTeamLeader(null);
          setSelectedTeamLeaderId(null);
        }
      }).finally(() => setLoading(false));
    }
  }, [isOpen, salesRepId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesRepId) return;
    
    setSaving(true);
    try {
      if (selectedTeamLeaderId) {
        await axios.post(`/api/sales/sales-reps/${salesRepId}/team-leader`, {
          team_leader_id: selectedTeamLeaderId
        });
      } else {
        // Unassign if no team leader selected
        await axios.delete(`/api/sales/sales-reps/${salesRepId}/team-leader`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = (err as any).response?.data?.error || 'Failed to assign team leader';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !salesRepId) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">
            Assign Team Leader {salesRepName && `to ${salesRepName}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-[10px] text-gray-600">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {currentTeamLeader && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-[10px] font-medium text-blue-900 mb-1">Current Team Leader:</p>
                  <p className="text-[10px] text-blue-700">{currentTeamLeader.name}</p>
                </div>
              )}
              <div>
                <label htmlFor="team-leader-select" className="block text-[10px] font-medium text-gray-700 mb-1.5">
                  Select Team Leader:
                </label>
                <select
                  id="team-leader-select"
                  value={selectedTeamLeaderId || ''}
                  onChange={e => setSelectedTeamLeaderId(e.target.value ? Number(e.target.value) : null)}
                  className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">None (Unassign)</option>
                  {teamLeaders.map(tl => (
                    <option key={tl.id} value={tl.id}>{tl.name}</option>
                  ))}
                </select>
              </div>
              {teamLeaders.length === 0 && (
                <div className="text-[10px] text-gray-500 text-center py-4">
                  No team leaders available.
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 border border-gray-300 rounded-lg text-[10px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const AssignManagersModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  salesRepId: number | null;
}> = ({ isOpen, onClose, salesRepId }) => {
  const [allManagers, setAllManagers] = useState<Manager[]>([]);
  const [assignments, setAssignments] = useState<{ manager_id: number; manager_type: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const managerTypes = ['Retail', 'Distribution', 'Key Account'];

  useEffect(() => {
    if (isOpen && salesRepId) {
      setLoading(true);
      Promise.all([
        axios.get('/api/managers'),
        axios.get(`/api/sales/sales-reps/${salesRepId}/managers`)
      ]).then(([allRes, assignedRes]) => {
        setAllManagers(allRes.data);
        setAssignments(
          assignedRes.data.map((a: any) => ({ manager_id: a.manager_id, manager_type: a.manager_type }))
        );
      }).finally(() => setLoading(false));
    }
  }, [isOpen, salesRepId]);

  const isAssigned = (managerId: number) => assignments.some(a => a.manager_id === managerId);
  const getType = (managerId: number) => assignments.find(a => a.manager_id === managerId)?.manager_type || '';

  const handleToggle = (managerId: number) => {
    if (isAssigned(managerId)) {
      setAssignments(assignments.filter(a => a.manager_id !== managerId));
    } else {
      setAssignments([...assignments, { manager_id: managerId, manager_type: 'Retail' }]);
    }
  };

  const handleTypeChange = (managerId: number, type: string) => {
    setAssignments(assignments.map(a => a.manager_id === managerId ? { ...a, manager_type: type } : a));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesRepId) return;
    setSaving(true);
    try {
      await axios.post(`/api/sales/sales-reps/${salesRepId}/managers`, { assignments });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !salesRepId) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Assign Managers</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-[10px] text-gray-600">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {allManagers.map(manager => (
                <div key={manager.id} className="flex items-center gap-2 border-b border-gray-200 py-2">
                  <input
                    type="checkbox"
                    checked={isAssigned(manager.id)}
                    onChange={() => handleToggle(manager.id)}
                    className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="flex-1 text-[10px]">{manager.name} <span className="text-[10px] text-gray-500">({manager.email})</span></span>
                  {isAssigned(manager.id) && (
                    <select
                      value={getType(manager.id)}
                      onChange={e => handleTypeChange(manager.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:ring-blue-500 focus:border-blue-500"
                    >
                      {managerTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
              {allManagers.length === 0 && <div className="text-[10px] text-gray-500 text-center py-4">No managers available.</div>}
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 mt-4">
              <button type="button" onClick={onClose} className="px-2.5 py-1 border border-gray-300 rounded-lg text-[10px] text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const SalesRepsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // If the logged-in user is a team leader, restrict visible staff to that leader's assigned reps.
  const teamLeaderUserId =
    user?.role === 'team_leader' || user?.role === 'leader' ? user?.id ?? null : null;
  const isTeamLeaderUser = teamLeaderUserId !== null;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSalesRep, setEditingSalesRep] = useState<SalesRep | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSalesRepId] = useState<number | null>(null);
  const [assignTeamLeaderModalOpen, setAssignTeamLeaderModalOpen] = useState(false);
  const [selectedSalesRepForTeamLeader, setSelectedSalesRepForTeamLeader] = useState<{ id: number; name: string } | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [defaultCountrySet, setDefaultCountrySet] = useState<boolean>(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [routes, setRoutes] = useState<SalesRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [teamLeaders, setTeamLeaders] = useState<{ id: number; name: string }[]>([]);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState<string>('');
  const [salesRepTeamLeaders, setSalesRepTeamLeaders] = useState<Record<number, { id: number; name: string }[]>>({});
  const [teamLeaderMappingLoading, setTeamLeaderMappingLoading] = useState(false);

  // Targets modal state
  const [targetsModalOpen, setTargetsModalOpen] = useState(false);
  const [selectedSalesRepForTargets, setSelectedSalesRepForTargets] = useState<SalesRep | null>(null);
  const [targetsLoading, setTargetsLoading] = useState(false);

  // 1. Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  // 1. Add state for records per page
  const [repsPerPage, setRepsPerPage] = useState(10);
  const recordsPerPageOptions = [10, 20, 50, 100];

  // 1. Add status filter state - check location state for filterStatus
  const [selectedStatus, setSelectedStatus] = useState<'1' | '0' | ''>(
    (location.state as any)?.filterStatus || '1'
  ); // '1' = active, '0' = inactive, '' = all
  const [pendingStatus, setPendingStatus] = useState<'1' | '0' | ''>(
    (location.state as any)?.filterStatus || '1'
  );
  
  // Role filter state
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [pendingRole, setPendingRole] = useState<string>('');

  const isTeamLeaderRow = (rep?: SalesRep) => (rep?.role || '')
    .toLowerCase()
    .trim() === 'team leader';

  // 2. Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCountry, selectedRegion, selectedRoute, selectedTeamLeader, selectedStatus, selectedRole, salesReps]);

  // 3. Reset to page 1 when repsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [repsPerPage]);

  // When team-leader assignment mapping loads, the filtered list size can change.
  // Reset pagination to avoid landing on an out-of-range page.
  useEffect(() => {
    setCurrentPage(1);
  }, [teamLeaderUserId, teamLeaderMappingLoading]);

  // 2. Update filter logic to include status and role
  const filteredSalesReps = salesReps.filter(rep => {
    const statusMatch = selectedStatus !== '' ? String(rep.status ?? 1) === selectedStatus : true;
    const countryMatch = selectedCountry ? rep.country === selectedCountry : true;
    const regionMatch = selectedRegion ? rep.region === selectedRegion : true;
    const routeMatch = selectedRoute ? rep.route_name_update === selectedRoute : true;
    const effectiveTeamLeaderId = teamLeaderUserId ?? (selectedTeamLeader || null);
    const teamLeaderMatch = effectiveTeamLeaderId
      ? (teamLeaderMappingLoading
        ? true
        : (salesRepTeamLeaders[rep.id] || []).some(tl => String(tl.id) === String(effectiveTeamLeaderId)))
      : true;
    const roleMatch = selectedRole ? (rep.role || 'sales rep') === selectedRole : true;
    return statusMatch && countryMatch && regionMatch && routeMatch && teamLeaderMatch && roleMatch;
  });

  // 3. Paginate filtered sales reps
  const totalPages = Math.ceil(filteredSalesReps.length / repsPerPage);
  const paginatedSalesReps = filteredSalesReps.slice((currentPage - 1) * repsPerPage, currentPage * repsPerPage);

  // 4. Add pagination controls below the table

  // 5. Remove the inline filter controls from the main page, and add a 'Filter' button */
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // 6. Move filter states (selectedCountry, selectedRegion, selectedRoute, selectedTeamLeader) into a local state for the modal
  const [pendingCountry, setPendingCountry] = useState(selectedCountry);
  const [pendingRegion, setPendingRegion] = useState(selectedRegion);
  const [pendingRoute, setPendingRoute] = useState(selectedRoute);
  const [pendingTeamLeader, setPendingTeamLeader] = useState(selectedTeamLeader);

  // 7. When opening the modal, sync pending states with current filter states
  const openFilterModal = () => {
    setPendingCountry(selectedCountry);
    setPendingRegion(selectedRegion);
    setPendingRoute(selectedRoute);
    setPendingTeamLeader(selectedTeamLeader);
    setPendingStatus(selectedStatus);
    setPendingRole(selectedRole);
    setFilterModalOpen(true);
  };

  // Load regions when pending country changes in filter modal
  useEffect(() => {
    if (filterModalOpen && pendingCountry) {
      const countryObj = countries.find(c => c.name === pendingCountry);
      if (countryObj) {
        salesService.getRegions(countryObj.id).then(setRegions);
      } else {
        setRegions([]);
      }
    }
  }, [pendingCountry, countries, filterModalOpen]);

  // 8. When applying, set the real filter states and close the modal
  const applyFilters = () => {
    setSelectedCountry(pendingCountry);
    setSelectedRegion(pendingRegion);
    setSelectedRoute(pendingRoute);
    setSelectedTeamLeader(pendingTeamLeader);
    setSelectedStatus(pendingStatus);
    setSelectedRole(pendingRole);
    setFilterModalOpen(false);
  };

  // 9. When clearing, reset all pending and real filter states
  const clearFilters = () => {
    setPendingCountry('Kenya'); // Reset to Kenya instead of empty
    setPendingRegion('');
    setPendingRoute('');
    setPendingTeamLeader('');
    setPendingStatus('1');
    setPendingRole('');
    setSelectedCountry('Kenya'); // Reset to Kenya instead of empty
    setSelectedRegion('');
    setSelectedRoute('');
    setSelectedTeamLeader('');
    setSelectedStatus('1');
    setSelectedRole('');
    setFilterModalOpen(false);
    // Reset regions to empty array when clearing
    setRegions([]);
  };

  const exportToCSV = () => {
    const headers = [
      'Name',
      'Email',
      'Phone Number',
      'Country',
      'Region',
      'Route',
      'Role',
      'Status'
    ];
    const rows = filteredSalesReps.map(rep => [
      rep.name,
      rep.email,
      rep.phoneNumber,
      rep.country || '',
      rep.region || '',
      rep.route_name_update || '',
      rep.role || 'FMR',
      rep.status === 1 ? 'Active' : 'Inactive'
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'fmrs.csv');
  };

  useEffect(() => {
    salesService.getCountries().then(setCountries);
  }, []);

  // Fetch user's country and set default filter
  useEffect(() => {
    const fetchUserCountry = async () => {
      // Only set default once
      if (!user?.id || countries.length === 0 || defaultCountrySet) return;
      
      try {
        const response = await axios.get(`/api/staff/${user.id}`);
        const staffData = response.data;
        const userCountry = staffData.country || staffData.country_id || staffData.countryId;
        
        // Set default country based on user's country
        // country = 1 means Kenya, country = 2 means Tanzania
        if (userCountry === 1 || userCountry === '1') {
          // Find Kenya in the countries list
          const kenyaCountry = countries.find(c => c.id === 1 || c.name.toLowerCase() === 'kenya');
          if (kenyaCountry) {
            setSelectedCountry(kenyaCountry.name);
            setPendingCountry(kenyaCountry.name);
          } else {
            setSelectedCountry('Kenya');
            setPendingCountry('Kenya');
          }
          setDefaultCountrySet(true);
        } else if (userCountry === 2 || userCountry === '2') {
          // Find Tanzania in the countries list
          const tanzaniaCountry = countries.find(c => c.id === 2 || c.name.toLowerCase() === 'tanzania');
          if (tanzaniaCountry) {
            setSelectedCountry(tanzaniaCountry.name);
            setPendingCountry(tanzaniaCountry.name);
          } else {
            setSelectedCountry('Tanzania');
            setPendingCountry('Tanzania');
          }
          setDefaultCountrySet(true);
        }
      } catch (error) {
        console.error('Failed to fetch user country:', error);
        // Default to Kenya if we can't fetch the user's country
        if (!defaultCountrySet) {
          setSelectedCountry('Kenya');
          setPendingCountry('Kenya');
          setDefaultCountrySet(true);
        }
      }
    };
    
    fetchUserCountry();
  }, [user?.id, countries, defaultCountrySet]);

  useEffect(() => {
    if (selectedCountry) {
      const countryObj = countries.find(c => c.name === selectedCountry);
      if (countryObj) {
        salesService.getRegions(countryObj.id).then(setRegions);
      } else {
        setRegions([]);
      }
      setSelectedRegion(''); // Reset region when country changes
    } else {
      setRegions([]);
      setSelectedRegion('');
    }
  }, [selectedCountry, countries]);

  useEffect(() => {
    salesService.getRoutes().then(setRoutes);
  }, []);

  // Fetch team leaders from SalesRep table where role = 'team leader'
  useEffect(() => {
    const fetchTeamLeaders = async () => {
      try {
        const response = await axios.get('/api/sales/team-leaders');
        const allTeamLeaders = Array.isArray(response.data) ? response.data : (response.data.data || []);
        const teamLeadersList = allTeamLeaders.map((tl: SalesRep) => ({ id: tl.id, name: tl.name }));
        setTeamLeaders(teamLeadersList);
      } catch (err) {
        console.error('Failed to fetch team leaders:', err);
        setTeamLeaders([]);
      }
    };
    
    fetchTeamLeaders();
  }, []);

  useEffect(() => {
    const fetchTeamLeadersForReps = async () => {
      setTeamLeaderMappingLoading(true);
      const mapping: Record<number, { id: number; name: string }[]> = {};
      try {
        await Promise.all(salesReps.map(async (rep) => {
          try {
            // Fetch team leader assigned to this sales rep
            const res = await axios.get(`/api/sales/sales-reps/${rep.id}/team-leader`);
            if (res.data && res.data.id) {
              mapping[rep.id] = [{ id: res.data.id, name: res.data.name }];
            } else {
              mapping[rep.id] = [];
            }
          } catch {
            mapping[rep.id] = [];
          }
        }));
        setSalesRepTeamLeaders(mapping);
      } finally {
        setTeamLeaderMappingLoading(false);
      }
    };
    if (salesReps.length > 0) fetchTeamLeadersForReps();
    else setTeamLeaderMappingLoading(false);
  }, [salesReps]);

  const fetchSalesReps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesService.getAllSalesReps();
      // Ensure data is always an array
      setSalesReps(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales reps');
      setSalesReps([]); // Set empty array on error
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSalesReps();
  }, []);

  const handleCreate = () => {
    if (isTeamLeaderUser) return;
    setEditingSalesRep(undefined);
    setModalOpen(true);
  };

  const handleEdit = (salesRep: SalesRep) => {
    if (isTeamLeaderUser) return;
    if (isTeamLeaderRow(salesRep)) return;
    setEditingSalesRep(salesRep);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (isTeamLeaderUser) return;
    const rep = salesReps.find(r => r.id === id);
    if (isTeamLeaderRow(rep)) return;
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      await salesService.deleteSalesRep(id);
      await fetchSalesReps();
    } catch (err: any) {
      setError(err.message || 'Failed to delete sales rep');
    }
  };

  const handleSubmit = async (data: CreateSalesRepData & { status?: number }) => {
    setSubmitting(true);
    try {
      if (editingSalesRep) {
        await salesService.updateSalesRep({ ...data, id: editingSalesRep.id });
        if (data.status !== undefined && data.status !== editingSalesRep.status) {
          await salesService.updateSalesRepStatus(editingSalesRep.id, data.status);
        }
      } else {
        await salesService.createSalesRep(data);
      }
      setModalOpen(false);
      await fetchSalesReps();
    } catch (err: any) {
      setError(err.message || 'Failed to save sales rep');
    }
    setSubmitting(false);
  };

  const handleSetTargets = (salesRep: SalesRep) => {
    setSelectedSalesRepForTargets(salesRep);
    setTargetsModalOpen(true);
  };

  const handleTargetsSubmit = async (targets: SalesRepTargets) => {
    setTargetsLoading(true);
    try {
      if (targets.id) {
        // Update existing target
        await salesService.updateSalesRepTarget(targets.id, {
          year: targets.year,
          month: targets.month,
          vapesTarget: targets.vapesTarget,
          pouchesTarget: targets.pouchesTarget
        });
        alert('Target updated successfully!');
      } else {
        // Create new target
        await salesService.setSalesRepTarget(targets);
        alert('Target set successfully!');
      }
      setTargetsModalOpen(false);
      setSelectedSalesRepForTargets(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save target');
    }
    setTargetsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  {selectedCountry === 'Kenya' && (
                    <>
                      <img src="/kenya_flag.jpeg" alt="Kenya Flag" className="h-4 w-auto inline-block align-middle rounded shadow" />
                      Kenya Staff
                    </>
                  )}
                  {selectedCountry === 'Tanzania' && (
                    <>
                      <img src="/tz_flag.jpeg" alt="Tanzania Flag" className="h-4 w-auto inline-block align-middle rounded shadow" />
                      Tanzania Staff
                    </>
                  )}
                  {selectedCountry !== 'Kenya' && selectedCountry !== 'Tanzania' && 'Staff'}
                </h1>
                <p className="mt-1 text-[10px] text-gray-500">
                  Manage and track staff
                </p>
              </div>
              <button
                onClick={handleCreate}
                disabled={isTeamLeaderUser}
                className={`inline-flex items-center px-2.5 py-1 text-[10px] rounded-lg hover:bg-blue-700 transition-colors ${
                  isTeamLeaderUser
                    ? 'bg-blue-600 text-white opacity-50 cursor-not-allowed'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Staff
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-[10px]">
            {error}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <Link
            to="/overall-attendance"
            className="inline-flex items-center px-2.5 py-1 text-[10px] bg-blue-100 text-blue-700 font-medium rounded-lg shadow hover:bg-blue-200 transition-colors"
          >
            Overall Attendance
          </Link>
          <Link
            to="/sales-rep-working-days"
            className="inline-flex items-center px-2.5 py-1 text-[10px] bg-blue-100 text-blue-700 font-medium rounded-lg shadow hover:bg-blue-200 transition-colors"
          >
            Sales Rep Working Days
          </Link>
          <button
            onClick={openFilterModal}
            className="inline-flex items-center px-2.5 py-1 text-[10px] bg-gray-100 text-gray-800 font-medium rounded-lg shadow hover:bg-gray-200 transition-colors"
          >
            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-2.5 py-1 text-[10px] bg-green-100 text-green-800 font-medium rounded-lg hover:bg-green-200 border border-green-300 transition-colors"
          >
            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <div className="flex items-center gap-1.5 ml-auto">
            <label htmlFor="records-per-page" className="text-[10px] font-medium text-gray-700">Show:</label>
            <select
              id="records-per-page"
              className="border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:ring-blue-500 focus:border-blue-500"
              value={repsPerPage}
              onChange={e => setRepsPerPage(Number(e.target.value))}
            >
              {recordsPerPageOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Country filter buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`px-2 py-1 rounded-lg border text-[10px] font-medium transition-colors ${
              selectedCountry === '' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => setSelectedCountry('')}
          >
            All Countries
          </button>
          {countries.map(c => (
            <button
              key={c.id}
              type="button"
              className={`px-2 py-1 rounded-lg border text-[10px] font-medium transition-colors ${
                selectedCountry === c.name 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedCountry(c.name)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-[10px] text-gray-600">Loading staff...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Expected Weekly Coverage
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Team Leader
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSalesReps.map((rep) => (
                    <tr key={rep.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {rep.photoUrl ? (
                          <img
                            src={rep.photoUrl}
                            alt={rep.name}
                            className="h-6 w-6 rounded-full object-cover cursor-pointer"
                            onClick={() => setExpandedPhotoUrl(rep.photoUrl!)}
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/40x40?text=' + rep.name.charAt(0);
                            }}
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-[10px] font-medium text-gray-700">
                              {rep.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] font-medium text-gray-900">{rep.name}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">{rep.email}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">{rep.phoneNumber || '-'}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">
                          {rep.country && <span>{rep.country}</span>}
                          {rep.country && rep.region && <span>, </span>}
                          {rep.region && <span>{rep.region}</span>}
                          {!rep.country && !rep.region && <span className="text-gray-400">Not specified</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">
                          {rep.route_name_update || <span className="text-gray-400">Not specified</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900 capitalize">
                          {rep.role || 'sales rep'}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">
                          {rep.expected_weekly_coverage !== undefined && rep.expected_weekly_coverage !== null
                            ? rep.expected_weekly_coverage
                            : <span className="text-gray-400">Not set</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-[10px] text-gray-900">
                          {salesRepTeamLeaders[rep.id] && salesRepTeamLeaders[rep.id].length > 0 ? (
                            <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-800 border border-blue-200">
                              {salesRepTeamLeaders[rep.id].map(tl => tl.name).join(', ')}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {rep.status === 1 ? (
                          <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">Active</span>
                        ) : rep.status === 0 ? (
                          <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Inactive</span>
                        ) : (
                          <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">Unknown</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => handleEdit(rep)}
                            disabled={isTeamLeaderUser || isTeamLeaderRow(rep)}
                            className={`px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-lg transition-colors ${
                              isTeamLeaderUser || isTeamLeaderRow(rep)
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-blue-200'
                            }`}
                          >
                            Edit
                          </button>
                          {!isTeamLeaderUser && !isTeamLeaderRow(rep) && (
                            <button
                              onClick={() => {
                                setSelectedSalesRepForTeamLeader({ id: rep.id, name: rep.name });
                                setAssignTeamLeaderModalOpen(true);
                              }}
                              className="px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              Assign Team Leader
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(rep.id)}
                            disabled={isTeamLeaderUser || isTeamLeaderRow(rep)}
                            className={`px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors ${
                              isTeamLeaderUser || isTeamLeaderRow(rep)
                                ? 'opacity-50 cursor-not-allowed hover:bg-red-100'
                                : ''
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedSalesReps.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-6 py-8 text-center">
                        <div className="text-[10px] text-gray-500">No staff found.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow border border-gray-200 mt-4">
            <div className="px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-[10px] text-gray-700">
                  Showing {((currentPage - 1) * repsPerPage) + 1} to {Math.min(currentPage * repsPerPage, filteredSalesReps.length)} of {filteredSalesReps.length} results
                  {totalPages > 1 && (
                    <span className="ml-2 text-gray-500">
                      (Page {currentPage} of {totalPages})
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-2 py-1 text-[10px] font-medium rounded-lg transition-colors ${
                            pageNum === currentPage 
                              ? 'bg-blue-600 text-white' 
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <SalesRepModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        salesRep={editingSalesRep}
        onSubmit={handleSubmit}
        loading={submitting}
      />

      <AssignManagersModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        salesRepId={selectedSalesRepId}
      />

      <AssignTeamLeaderModal
        isOpen={assignTeamLeaderModalOpen}
        onClose={() => {
          setAssignTeamLeaderModalOpen(false);
          setSelectedSalesRepForTeamLeader(null);
        }}
        salesRepId={selectedSalesRepForTeamLeader?.id || null}
        salesRepName={selectedSalesRepForTeamLeader?.name}
        onSuccess={() => {
          fetchSalesReps();
        }}
      />

      <SalesRepTargetsModal
        isOpen={targetsModalOpen}
        onClose={() => {
          setTargetsModalOpen(false);
          setSelectedSalesRepForTargets(null);
        }}
        salesRep={selectedSalesRepForTargets}
        onSubmit={handleTargetsSubmit}
        loading={targetsLoading}
      />

        {/* Filter Modal */}
        {filterModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900">Filter Staff</h2>
                <button
                  onClick={() => setFilterModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-4 py-4 space-y-4">
                <div>
                  <label htmlFor="status-filter" className="block text-[10px] font-medium text-gray-700 mb-1.5">Status:</label>
                  <select
                    id="status-filter"
                    value={pendingStatus}
                    onChange={e => setPendingStatus(e.target.value as '1' | '0' | '')}
                    className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                    <option value="">All</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="country-filter" className="block text-[10px] font-medium text-gray-700 mb-1.5">Country:</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`px-2 py-1 rounded-lg border text-[10px] font-medium transition-colors ${
                        pendingCountry === '' 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setPendingCountry('');
                        setPendingRegion('');
                      }}
                    >
                      All Countries
                    </button>
                    {countries.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className={`px-2 py-1 rounded-lg border text-[10px] font-medium transition-colors ${
                          pendingCountry === c.name 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          setPendingCountry(c.name);
                          setPendingRegion('');
                        }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="region-filter" className="block text-[10px] font-medium text-gray-700 mb-1.5">Region:</label>
                  <select
                    id="region-filter"
                    value={pendingRegion}
                    onChange={e => setPendingRegion(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={!pendingCountry}
                  >
                    <option value="">All Regions</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="route-filter" className="block text-[10px] font-medium text-gray-700 mb-1.5">Route:</label>
                  <select
                    id="route-filter"
                    value={pendingRoute}
                    onChange={e => setPendingRoute(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Routes</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="team-leader-filter" className="block text-[10px] font-medium text-gray-700 mb-1.5">Team Leader:</label>
                  <select
                    id="team-leader-filter"
                    value={isTeamLeaderUser && teamLeaderUserId !== null ? String(teamLeaderUserId) : pendingTeamLeader}
                    disabled={isTeamLeaderUser && teamLeaderUserId !== null}
                    onChange={e => setPendingTeamLeader(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isTeamLeaderUser && teamLeaderUserId !== null ? (
                      <option value={String(teamLeaderUserId)}>
                        {teamLeaders.find(tl => tl.id === teamLeaderUserId)?.name || 'My Team Leader'}
                      </option>
                    ) : (
                      <>
                        <option value="">All Team Leaders</option>
                        {teamLeaders.map(tl => (
                          <option key={tl.id} value={tl.id}>{tl.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label htmlFor="role-filter" className="block text-[10px] font-medium text-gray-700 mb-1.5">Role:</label>
                  <select
                    id="role-filter"
                    value={pendingRole}
                    onChange={e => setPendingRole(e.target.value)}
                    className="block w-full border border-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Roles</option>
                    <option value="sales rep">Sales Rep</option>
                    <option value="team leader">Team Leader</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 px-4 py-3 border-t border-gray-200">
                <button
                  onClick={clearFilters}
                  className="px-2.5 py-1 border border-gray-300 rounded-lg text-[10px] text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={applyFilters}
                  className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Expanded Photo Modal */}
      {expandedPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setExpandedPhotoUrl(null)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
                    <img src={expandedPhotoUrl} alt="FMR" className="max-w-full max-h-[80vh] rounded shadow-lg" />
            <button
              onClick={() => setExpandedPhotoUrl(null)}
              className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1 hover:bg-opacity-100"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesRepsPage; 