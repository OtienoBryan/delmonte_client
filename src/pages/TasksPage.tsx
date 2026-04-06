import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

interface Task {
  id: number;
  title: string;
  description: string;
  date: string;
  status: string;
  isCompleted: boolean;
  priority: string;
  salesRepId: number;
  createdAt: string;
  assigned_sales_reps?: SalesRep[]; // New field for multiple assignments
}

interface SalesRep { id: number; name: string; email?: string; }

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState<Omit<Task, 'id' | 'createdAt' | 'isCompleted' | 'salesRepId'> & { selectedSalesReps: number[] }>({
    title: '',
    description: '',
    date: '',
    status: 'pending',
    priority: 'medium',
    selectedSalesReps: [], // New field for multiple selection
  });
  const [submitting, setSubmitting] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [salesRepsLoading, setSalesRepsLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/tasks?month=${month}`);
      if (res.data && Array.isArray(res.data)) {
        setTasks(res.data);
      } else {
        console.error('Invalid response format:', res.data);
        setTasks([]);
        setError('Invalid data format received from server');
      }
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to fetch tasks');
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [month]);

  // Fetch sales reps on mount
  useEffect(() => {
    const fetchSalesReps = async () => {
      setSalesRepsLoading(true);
      try {
        const res = await axios.get('/api/sales/sales-reps?status=1');
        if (res.data && Array.isArray(res.data)) {
          setSalesReps(res.data);
        } else {
          console.error('Invalid sales reps response format:', res.data);
          setSalesReps([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch sales reps:', err);
        setSalesReps([]);
        setError('Failed to load sales representatives');
      }
      setSalesRepsLoading(false);
    };
    fetchSalesReps();
  }, []);

  const filteredTasks = tasks.filter(
    t => {
      const statusMatch = !filterStatus || t.status === filterStatus;
      
      let userMatch = true;
      if (filterUser) {
        // Check if the task is assigned to the selected sales rep
        if (t.assigned_sales_reps && t.assigned_sales_reps.length > 0) {
          userMatch = t.assigned_sales_reps.some(rep => rep.name === filterUser);
        } else {
          const assignedRep = salesReps.find(rep => rep.id === t.salesRepId);
          userMatch = assignedRep && assignedRep.name === filterUser;
        }
      }
      
      return statusMatch && userMatch;
    }
  );

  const handleAdd = () => {
    setForm({ 
      title: '', 
      description: '', 
      date: '', 
      status: 'pending', 
      priority: 'medium',
      selectedSalesReps: []
    });
    setEditTask(null);
    setModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setForm({
      title: task.title,
      description: task.description,
      date: task.date,
      status: task.status,
      priority: task.priority,
      selectedSalesReps: task.assigned_sales_reps?.map(rep => rep.id) || [task.salesRepId]
    });
    setEditTask(task);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`/api/tasks/${id}`);
      await fetchTasks(); // Refresh the tasks list
    } catch (err: any) {
      console.error('Error deleting task:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to delete task');
      }
    }
  };

  const handleSalesRepToggle = (salesRepId: number) => {
    setForm(prev => ({
      ...prev,
      selectedSalesReps: prev.selectedSalesReps.includes(salesRepId)
        ? prev.selectedSalesReps.filter(id => id !== salesRepId)
        : [...prev.selectedSalesReps, salesRepId]
    }));
  };

  const removeSelectedSalesRep = (salesRepId: number) => {
    setForm(prev => ({
      ...prev,
      selectedSalesReps: prev.selectedSalesReps.filter(id => id !== salesRepId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = {
        title: form.title,
        description: form.description,
        date: form.date,
        status: form.status,
        priority: form.priority,
        salesRepId: form.selectedSalesReps[0] || 1, // Use first selected sales rep or default
        isCompleted: form.status === 'completed'
      };

      if (editTask) {
        await axios.put(`/api/tasks/${editTask.id}`, formData);
      } else {
        await axios.post('/api/tasks', formData);
      }
      setModalOpen(false);
      await fetchTasks(); // Refresh the tasks list
    } catch (err: any) {
      console.error('Error saving task:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to save task');
      }
    }
    setSubmitting(false);
  };

  const getSelectedSalesReps = () => {
    return salesReps.filter(rep => form.selectedSalesReps.includes(rep.id));
  };

  return (
    <div className="w-full py-8 px-2 sm:px-4">
      <div className="sticky top-0 z-10 bg-white rounded-lg shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium">Month:</label>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium">Status:</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium">Assigned:</label>
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              disabled={salesRepsLoading}
              className="border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All</option>
              {salesReps.map(rep => (
                <option key={rep.id} value={rep.name}>{rep.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-3 py-1.5 text-xs rounded-md hover:bg-blue-700 shadow"
        >
          Add Task
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <div className="flex items-center">
            <div className="text-red-600 font-medium text-xs">Error:</div>
            <div className="text-red-700 ml-2 text-xs">{error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg width="60" height="60" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#f3f4f6"/><path d="M7 9h10M7 13h5" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/></svg>
          <div className="mt-4 text-sm font-medium">No tasks found</div>
          <div className="text-xs">Click "Add Task" to create your first task.</div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-900">{task.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-700 max-w-xs truncate" title={task.description}>
                        {task.description}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-900">
                        {task.date ? new Date(task.date).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        task.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : task.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        task.priority === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : task.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-900">
                        {task.assigned_sales_reps && task.assigned_sales_reps.length > 0 
                          ? task.assigned_sales_reps.map(rep => rep.name).join(', ')
                          : (() => {
                              const assignedRep = salesReps.find(rep => rep.id === task.salesRepId);
                              return assignedRep ? assignedRep.name : `Sales Rep ID: ${task.salesRepId}`;
                            })()
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-900">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEdit(task)}
                          title="Edit"
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          title="Delete"
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" className="mx-auto mb-3">
                          <rect width="24" height="24" rx="12" fill="#f3f4f6"/>
                          <path d="M7 9h10M7 13h5" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">No tasks found</h3>
                        <p className="text-xs text-gray-600">Click "Add Task" to create your first task.</p>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl relative animate-fadeIn">
            <h2 className="text-lg font-bold mb-4 text-center">{editTask ? 'Edit Task' : 'Add Task'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    required
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-xs min-h-[60px] focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      required
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Priority *</label>
                  <select
                    required
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                {/* Multiple Sales Rep Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Assign to Sales Reps *</label>
                  
                  {/* Selected Sales Reps Display */}
                  {form.selectedSalesReps.length > 0 && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-md">
                      <div className="text-xs font-medium text-gray-700 mb-2">Selected Sales Reps:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {getSelectedSalesReps().map(rep => (
                          <span
                            key={rep.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full"
                          >
                            {rep.name}
                            <button
                              type="button"
                              onClick={() => removeSelectedSalesRep(rep.id)}
                              className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                            >
                              <FiX size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Sales Rep Selection Dropdown */}
                  <select
                    value=""
                    onChange={e => {
                      const selectedId = parseInt(e.target.value);
                      if (selectedId && !form.selectedSalesReps.includes(selectedId)) {
                        handleSalesRepToggle(selectedId);
                      }
                      e.target.value = ''; // Reset selection
                    }}
                    disabled={salesRepsLoading}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {salesRepsLoading ? 'Loading sales reps...' : 'Select sales rep to add'}
                    </option>
                    {salesReps
                      .filter(rep => !form.selectedSalesReps.includes(rep.id))
                      .map(rep => (
                        <option key={rep.id} value={rep.id}>{rep.name}</option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    You can select multiple sales reps. Click on a selected rep to remove them.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || form.selectedSalesReps.length === 0}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editTask ? 'Save' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage; 