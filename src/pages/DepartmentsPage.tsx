import React, { useEffect, useState } from 'react';

const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [form, setForm] = useState({ id: '', name: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/departments');
      if (!res.ok) throw new Error('Failed to fetch departments');
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      setError('Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openAddModal = () => {
    setForm({ id: '', name: '' });
    setFormError('');
    setModalType('add');
    setShowModal(true);
  };

  const openEditModal = (dept: any) => {
    setForm({ id: dept.id, name: dept.name });
    setFormError('');
    setModalType('edit');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    if (!form.name) {
      setFormError('Department name is required.');
      setFormLoading(false);
      return;
    }
    try {
      if (modalType === 'add') {
        const response = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name }),
        });
        if (!response.ok) throw new Error('Failed to add department');
      } else {
        const response = await fetch(`/api/departments/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name }),
        });
        if (!response.ok) throw new Error('Failed to update department');
      }
      closeModal();
      fetchDepartments();
    } catch (err) {
      setFormError('Failed to save department.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this department?')) return;
    try {
      const response = await fetch(`/api/departments/${id}/deactivate`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to deactivate department');
      fetchDepartments();
    } catch (err) {
      alert('Failed to deactivate department.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow rounded-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Departments</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        onClick={openAddModal}
      >
        Add Department
      </button>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departments.map((dept: any) => (
              <tr key={dept.id}>
                <td className="px-4 py-2 whitespace-nowrap">{dept.name}</td>
                <td className="px-4 py-2 whitespace-nowrap">{dept.is_active ? 'Active' : 'Inactive'}</td>
                <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                  <button
                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                    onClick={() => openEditModal(dept)}
                    disabled={!dept.is_active}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                    onClick={() => handleDeactivate(dept.id)}
                    disabled={!dept.is_active}
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
            <h2 className="text-xl font-bold mb-4">{modalType === 'add' ? 'Add Department' : 'Edit Department'}</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                disabled={formLoading}
              >
                {formLoading ? (modalType === 'add' ? 'Adding...' : 'Saving...') : (modalType === 'add' ? 'Add Department' : 'Save Changes')}
              </button>
              {formError && <p className="text-red-600 text-center mt-2">{formError}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage; 