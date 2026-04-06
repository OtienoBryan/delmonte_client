import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../services/api';

const initialForm = {
  name: '',
  staffNumber: '',
  phoneNumber: '',
  department: '',
  businessEmail: '',
  departmentEmail: '',
  salary: '',
  employmentType: 'Consultant',
};

const EmployeesPage: React.FC = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>(initialForm);
  const [editFormId, setEditFormId] = useState<string | null>(null);
  const [editFormError, setEditFormError] = useState('');
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [filter, setFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [editDocuments, setEditDocuments] = useState<any[]>([]);
  const [editDocLoading, setEditDocLoading] = useState(false);
  const [editDocError, setEditDocError] = useState('');

  // --- Contract State ---
  const [editContracts, setEditContracts] = useState<any[]>([]);
  const [editContractLoading, setEditContractLoading] = useState(false);
  const [editContractError, setEditContractError] = useState('');
  const [contractRenewData, setContractRenewData] = useState<any | null>(null);
  const [expiringContracts, setExpiringContracts] = useState<any[]>([]);

  // --- Warning State ---
  const [editWarnings, setEditWarnings] = useState<any[]>([]);
  const [editWarningLoading, setEditWarningLoading] = useState(false);
  const [editWarningError, setEditWarningError] = useState('');
  const [newWarning, setNewWarning] = useState('');

  const location = useLocation();
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const [warningsModalEmp, setWarningsModalEmp] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expiring') === '1') {
      setExpiringOnly(true);
    } else {
      setExpiringOnly(false);
    }
  }, [location.search]);

  const fetchStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/staff');
      setStaff(response.data);
    } catch (err) {
      setError('Failed to fetch employees.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (err) {
      setDepartments([]);
    }
  };

  const fetchEditDocuments = async (id: string) => {
    setEditDocLoading(true);
    setEditDocError('');
    try {
      const response = await api.get(`/staff/${id}/documents`);
      setEditDocuments(response.data);
    } catch (err) {
      setEditDocError('Failed to fetch documents.');
    } finally {
      setEditDocLoading(false);
    }
  };

  const fetchEditContracts = async (id: string) => {
    setEditContractLoading(true);
    setEditContractError('');
    try {
      const response = await api.get(`/staff/${id}/contracts`);
      setEditContracts(response.data);
    } catch (err) {
      setEditContractError('Failed to fetch contracts.');
    } finally {
      setEditContractLoading(false);
    }
  };

  const fetchExpiringContracts = async () => {
    try {
      const response = await api.get('/staff/contracts/expiring');
      setExpiringContracts(response.data);
    } catch {}
  };

  const fetchEditWarnings = async (id: string) => {
    setEditWarningLoading(true);
    setEditWarningError('');
    try {
      const response = await api.get(`/staff/${id}/warnings`);
      setEditWarnings(response.data);
    } catch (err) {
      setEditWarningError('Failed to fetch warnings.');
    } finally {
      setEditWarningLoading(false);
    }
  };

  const handlePostWarning = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editFormId || !newWarning.trim()) return;
    setEditWarningLoading(true);
    setEditWarningError('');
    try {
      await api.post(`/staff/${editFormId}/warnings`, { message: newWarning });
      setNewWarning('');
      fetchEditWarnings(editFormId);
    } catch (err) {
      setEditWarningError('Failed to post warning.');
    } finally {
      setEditWarningLoading(false);
    }
  };

  const handleDeleteWarning = async (warningId: number) => {
    if (!window.confirm('Delete this warning?')) return;
    setEditWarningLoading(true);
    setEditWarningError('');
    try {
      await api.delete(`/staff/warnings/${warningId}`);
      if (editFormId) fetchEditWarnings(editFormId);
    } catch (err) {
      setEditWarningError('Failed to delete warning.');
    } finally {
      setEditWarningLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchDepartments();
    fetchExpiringContracts();
  }, []);

  const openModal = () => {
    setForm(initialForm);
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    if (!form.name || !form.staffNumber || !form.phoneNumber || !form.department || !form.businessEmail || !form.departmentEmail || !form.salary || !form.employmentType) {
      setFormError('All fields are required.');
      setFormLoading(false);
      return;
    }
    try {
      await api.post('/staff', {
        name: form.name,
        photo_url: 'https://randomuser.me/api/portraits/lego/1.jpg',
        empl_no: form.staffNumber,
        id_no: form.staffNumber,
        role: form.department,
        phone_number: form.phoneNumber,
        department: form.department,
        business_email: form.businessEmail,
        department_email: form.departmentEmail,
        salary: form.salary,
        employment_type: form.employmentType,
      });
      closeModal();
      fetchStaff();
    } catch (err) {
      setFormError('Failed to add employee.');
    } finally {
      setFormLoading(false);
    }
  };

  // Update openEditModal to fetch contracts
  const openEditModal = (emp: any) => {
    setEditForm({
      name: emp.name,
      staffNumber: emp.empl_no,
      phoneNumber: emp.phone_number,
      department: emp.department,
      businessEmail: emp.business_email,
      departmentEmail: emp.department_email,
      salary: emp.salary || '',
      employmentType: emp.employment_type || 'Permanent',
    });
    setEditFormId(emp.id);
    setEditFormError('');
    setShowEditModal(true);
    fetchEditDocuments(emp.id);
    fetchEditContracts(emp.id);
    fetchEditWarnings(emp.id);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditFormError('');
  };
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
    setEditFormError('');
  };
  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError('');
    setEditFormLoading(true);
    if (!editForm.name || !editForm.staffNumber || !editForm.phoneNumber || !editForm.department || !editForm.businessEmail || !editForm.departmentEmail) {
      setEditFormError('All fields are required.');
      setEditFormLoading(false);
      return;
    }
    try {
      await api.put(`/staff/${editFormId}`, {
        name: editForm.name,
        photo_url: 'https://randomuser.me/api/portraits/lego/1.jpg',
        empl_no: editForm.staffNumber,
        id_no: editForm.staffNumber,
        role: editForm.department,
        phone_number: editForm.phoneNumber,
        department: editForm.department,
        business_email: editForm.businessEmail,
        department_email: editForm.departmentEmail,
        salary: editForm.salary,
        employment_type: editForm.employmentType,
      });
      closeEditModal();
      fetchStaff();
    } catch (err) {
      setEditFormError('Failed to update employee.');
    } finally {
      setEditFormLoading(false);
    }
  };
  const handleDocumentUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editFormId) return;
    setEditDocLoading(true);
    setEditDocError('');
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/staff/${editFormId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload document');
      fetchEditDocuments(editFormId);
      e.currentTarget.reset();
      setEditDocError(''); // Clear error after successful upload
    } catch (err) {
        e.currentTarget.reset();
      //setEditDocError('Failed to upload document.');
    } finally {
      setEditDocLoading(false);
    }
  };
  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this employee?')) return;
    try {
      await api.patch(`/staff/${id}/deactivate`);
      fetchStaff();
    } catch (err) {
      alert('Failed to deactivate employee.');
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/staff/documents/${docId}`);
      if (editFormId) fetchEditDocuments(editFormId);
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  // --- Contract Upload Handler ---
  const handleContractUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editFormId) return;
    setEditContractLoading(true);
    setEditContractError('');
    const formData = new FormData(e.currentTarget);
    try {
      await api.post(`/staff/${editFormId}/contracts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchEditContracts(editFormId);
      e.currentTarget.reset();
      setContractRenewData(null);
      setEditContractError('');
    } catch (err) {
      setEditContractError('Failed to upload contract.');
    } finally {
      setEditContractLoading(false);
    }
  };

  // --- Contract Renew Handler ---
  const handleRenewContract = (contract: any) => {
    setContractRenewData({
      renewed_from: contract.id,
      start_date: '',
      end_date: '',
    });
  };

  const handleContractRenewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editFormId || !contractRenewData) return;
    setEditContractLoading(true);
    setEditContractError('');
    const formData = new FormData(e.currentTarget);
    formData.append('renewed_from', contractRenewData.renewed_from);
    try {
      await api.post(`/staff/contracts/${contractRenewData.renewed_from}/renew`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchEditContracts(editFormId);
      setContractRenewData(null);
      setEditContractError('');
    } catch (err) {
      setEditContractError('Failed to renew contract.');
    } finally {
      setEditContractLoading(false);
    }
  };

  // Filtered staff list
  const filteredStaff = staff.filter((emp: any) => {
    if (expiringOnly) {
      // Only show employees whose id is in expiringContracts
      return expiringContracts.some((c: any) => c.staff_id === emp.id);
    }
    if (filter === 'active') return emp.is_active === 1;
    if (filter === 'inactive') return emp.is_active === 0;
    return true;
  });

  const openWarningsModal = (emp: any) => {
    setWarningsModalEmp(emp);
    setShowWarningsModal(true);
    fetchEditWarnings(emp.id);
  };
  const closeWarningsModal = () => {
    setShowWarningsModal(false);
    setWarningsModalEmp(null);
    setEditWarnings([]);
  };

  return (
    <div className="max-w-7xl mx-auto mt-10 bg-white shadow rounded-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Link
          to="/hr/warnings"
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          View Warnings
        </Link>
      </div>
      <div className="flex items-center mb-4 gap-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={openModal}
        >
          Add Employee
        </button>
        <label className="block text-sm font-medium text-gray-700">Show:
          <select
            className="ml-2 border rounded px-2 py-1"
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
        </label>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Number</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employment Type</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStaff.map((emp: any) => (
              <tr key={emp.id}>
                <td className="px-4 py-2 whitespace-nowrap">{emp.name}</td>
                <td className="px-4 py-2 whitespace-nowrap">{emp.empl_no}</td>
                <td className="px-4 py-2 whitespace-nowrap">{emp.department}</td>
                <td className="px-4 py-2 whitespace-nowrap">{emp.phone_number}</td>
                <td className="px-4 py-2 whitespace-nowrap">{emp.business_email}</td>
                <td className="px-4 py-2 whitespace-nowrap">{emp.salary || '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap">{emp.employment_type || '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                  <button
                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                    onClick={() => openEditModal(emp)}
                  >
                    Edit
                  </button>
                   
                  <button
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                    onClick={() => handleDeactivate(emp.id)}
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={closeModal}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Add Employee</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Staff Number</label>
                <input
                  type="text"
                  name="staffNumber"
                  value={form.staffNumber}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                >
                  <option value="">Select a department</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Email</label>
                <input
                  type="email"
                  name="businessEmail"
                  value={form.businessEmail}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department Email</label>
                <input
                  type="email"
                  name="departmentEmail"
                  value={form.departmentEmail}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Salary</label>
                <input
                  type="number"
                  name="salary"
                  value={form.salary}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                <select
                  name="employmentType"
                  value={form.employmentType}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                  required
                >
                  <option value="Consultant">Consultant</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                disabled={formLoading}
              >
                {formLoading ? 'Adding...' : 'Add Employee'}
              </button>
              {formError && <p className="text-red-600 text-center mt-2">{formError}</p>}
            </form>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={closeEditModal}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Employee</h2>
            <form onSubmit={handleEditFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Staff Number</label>
                <input
                  type="text"
                  name="staffNumber"
                  value={editForm.staffNumber}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={editForm.phoneNumber}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  name="department"
                  value={editForm.department}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                >
                  <option value="">Select a department</option>
                  {departments.map((dept: any) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Email</label>
                <input
                  type="email"
                  name="businessEmail"
                  value={editForm.businessEmail}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department Email</label>
                <input
                  type="email"
                  name="departmentEmail"
                  value={editForm.departmentEmail}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Salary</label>
                <input
                  type="number"
                  name="salary"
                  value={editForm.salary}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                <select
                  name="employmentType"
                  value={editForm.employmentType}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                  required
                >
                  <option value="Consultant">Consultant</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                disabled={editFormLoading}
              >
                {editFormLoading ? 'Saving...' : 'Save Changes'}
              </button>
              {editFormError && <p className="text-red-600 text-center mt-2">{editFormError}</p>}
            </form>
            {/* Employee Documents */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Employee Documents</h3>
              <form onSubmit={handleDocumentUpload} className="mb-2" encType="multipart/form-data">
                <div className="flex gap-2 items-center">
                  <input type="file" name="file" className="border rounded px-2 py-1" required />
                </div>
                <div className="mt-2">
                  <input type="text" name="description" placeholder="Description (optional)" className="border rounded px-2 py-1 w-full" />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded mt-2" disabled={editDocLoading}>
                  {editDocLoading ? 'Uploading...' : 'Upload'}
                </button>
              </form>
              {editDocError && <p className="text-red-600 text-xs mb-2">{editDocError}</p>}
              {editDocLoading ? (
                <div>Loading documents...</div>
              ) : (
                <ul className="list-disc pl-5">
                  {editDocuments.map((doc: any) => (
                    <li key={doc.id} className="mb-1 flex items-center gap-2">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                        {doc.file_name}
                      </a>
                      {doc.description && <span className="ml-2 text-gray-600 text-xs">({doc.description})</span>}
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="ml-2 text-red-600 hover:underline text-xs"
                        title="Delete document"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                  {editDocuments.length === 0 && <li className="text-gray-500 text-xs">No documents uploaded.</li>}
                </ul>
              )}
            </div>
            {/* Employee Contracts */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Employee Contracts</h3>
              {/* Notification for expiring contract */}
              {editContracts.some(c => new Date(c.end_date) <= new Date(Date.now() + 31*24*60*60*1000)) && (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded mb-2 text-xs">
                  This employee has a contract expiring within 1 month!
                </div>
              )}
              {/* Upload or Renew form */}
              {contractRenewData ? (
                <form onSubmit={handleContractRenewSubmit} className="mb-2" encType="multipart/form-data">
                  <div className="flex flex-col gap-2">
                    <input type="file" name="file" className="border rounded px-2 py-1" required />
                    <input type="date" name="start_date" className="border rounded px-2 py-1" required />
                    <input type="date" name="end_date" className="border rounded px-2 py-1" required />
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded mt-2" disabled={editContractLoading}>
                    {editContractLoading ? 'Renewing...' : 'Renew Contract'}
                  </button>
                  <button type="button" className="ml-2 text-xs underline" onClick={() => setContractRenewData(null)}>Cancel</button>
                </form>
              ) : (
                <form onSubmit={handleContractUpload} className="mb-2" encType="multipart/form-data">
                  <div className="flex flex-col gap-2">
                    <input type="file" name="file" className="border rounded px-2 py-1" required />
                    <input type="date" name="start_date" className="border rounded px-2 py-1" required />
                    <input type="date" name="end_date" className="border rounded px-2 py-1" required />
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded mt-2" disabled={editContractLoading}>
                    {editContractLoading ? 'Uploading...' : 'Upload Contract'}
                  </button>
                </form>
              )}
              {editContractError && <p className="text-red-600 text-xs mb-2">{editContractError}</p>}
              {editContractLoading ? (
                <div>Loading contracts...</div>
              ) : (
                <ul className="list-disc pl-5">
                  {editContracts.map((contract: any) => (
                    <li key={contract.id} className="mb-1 flex items-center gap-2">
                      <a href={contract.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                        {contract.file_name}
                      </a>
                      <span className="ml-2 text-gray-600 text-xs">
                        ({contract.start_date} to {contract.end_date})
                      </span>
                      <button
                        onClick={() => handleRenewContract(contract)}
                        className="ml-2 text-green-600 hover:underline text-xs"
                        title="Renew contract"
                      >
                        Renew
                      </button>
                    </li>
                  ))}
                  {editContracts.length === 0 && <li className="text-gray-500 text-xs">No contracts uploaded.</li>}
                </ul>
              )}
            </div>
            {/* Employee Warnings */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Employee Warnings</h3>
              <form onSubmit={handlePostWarning} className="flex gap-2 mb-2">
                <textarea
                  value={newWarning}
                  onChange={e => setNewWarning(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Enter warning message..."
                  rows={2}
                  required
                />
                <button type="submit" className="bg-red-600 text-white px-3 py-1 rounded" disabled={editWarningLoading || !newWarning.trim()}>
                  Post
                </button>
              </form>
              {editWarningError && <p className="text-red-600 text-xs mb-2">{editWarningError}</p>}
              {editWarningLoading ? (
                <div>Loading warnings...</div>
              ) : (
                <ul className="list-disc pl-5">
                  {editWarnings.map((w: any) => (
                    <li key={w.id} className="mb-1 flex items-center gap-2">
                      <span className="text-gray-800 text-sm">{w.message}</span>
                      <span className="text-gray-500 text-xs">{w.issued_at && new Date(w.issued_at).toLocaleString()}</span>
                      <button
                        onClick={() => handleDeleteWarning(w.id)}
                        className="ml-2 text-red-600 hover:underline text-xs"
                        title="Delete warning"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                  {editWarnings.length === 0 && <li className="text-gray-500 text-xs">No warnings posted.</li>}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      {showWarningsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md max-h-[80vh] overflow-y-auto relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={closeWarningsModal}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Employee Warnings</h2>
            <div className="mb-2 text-sm text-gray-700 font-semibold">{warningsModalEmp?.name}</div>
            <form onSubmit={handlePostWarning} className="flex gap-2 mb-2">
              <textarea
                value={newWarning}
                onChange={e => setNewWarning(e.target.value)}
                className="border rounded px-2 py-1 w-full"
                placeholder="Enter warning message..."
                rows={2}
                required
              />
              <button type="submit" className="bg-red-600 text-white px-3 py-1 rounded" disabled={editWarningLoading || !newWarning.trim()}>
                Post
              </button>
            </form>
            {editWarningError && <p className="text-red-600 text-xs mb-2">{editWarningError}</p>}
            {editWarningLoading ? (
              <div>Loading warnings...</div>
            ) : (
              <ul className="list-disc pl-5">
                {editWarnings.map((w: any) => (
                  <li key={w.id} className="mb-1 flex items-center gap-2">
                    <span className="text-gray-800 text-sm">{w.message}</span>
                    <span className="text-gray-500 text-xs">{w.issued_at && new Date(w.issued_at).toLocaleString()}</span>
                    <button
                      onClick={() => handleDeleteWarning(w.id)}
                      className="ml-2 text-red-600 hover:underline text-xs"
                      title="Delete warning"
                    >
                      Delete
                    </button>
                  </li>
                ))}
                {editWarnings.length === 0 && <li className="text-gray-500 text-xs">No warnings posted.</li>}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage; 