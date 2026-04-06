import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { staffService } from '../services/staffService';

interface DepartmentExpense {
  id: number;
  description: string;
  amount: number;
  document_url: string;
  document_name?: string;
  department_name?: string;
  uploaded_by_name?: string;
  created_at: string;
  hr_approved?: boolean;
  hr_approved_by?: number;
  hr_approved_by_name?: string;
  hr_approved_at?: string;
  finance_approved?: boolean;
  finance_approved_by?: number;
  finance_approved_by_name?: string;
  finance_approved_at?: string;
  hr_rejected?: boolean;
  finance_rejected?: boolean;
  rejection_reason?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DepartmentExpenseUploadPage: React.FC = () => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expenses, setExpenses] = useState<DepartmentExpense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingDepartment, setLoadingDepartment] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userDepartment, setUserDepartment] = useState<string>('');
  const [approvingExpenseId, setApprovingExpenseId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch logged-in user's department from staff table
  useEffect(() => {
    const fetchUserDepartment = async () => {
      if (!user) {
        setLoadingDepartment(false);
        return;
      }

      try {
        setLoadingDepartment(true);
        const staffList = await staffService.getStaffList();
        
        // Find the staff member matching the logged-in user
        // Try matching by email first, then by username/name
        const staffMember = staffList.find(
          staff => 
            staff.business_email?.toLowerCase() === user.email?.toLowerCase() ||
            staff.department_email?.toLowerCase() === user.email?.toLowerCase() ||
            staff.name?.toLowerCase() === user.username?.toLowerCase() ||
            staff.name?.toLowerCase() === user.name?.toLowerCase()
        );

        if (staffMember) {
          const dept = staffMember.department_name || staffMember.department || user.department || '';
          setDepartmentName(dept);
          setUserDepartment(dept);
        } else {
          // Fallback to user's department if staff record not found
          const dept = user.department || '';
          setDepartmentName(dept);
          setUserDepartment(dept);
        }
      } catch (err) {
        console.error('Error fetching user department:', err);
        // Fallback to user's department from auth context
        setDepartmentName(user.department || '');
      } finally {
        setLoadingDepartment(false);
      }
    };

    fetchUserDepartment();
  }, [user]);

  const token = localStorage.getItem('token');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(value || 0);

  const getStatusBadge = (expense: DepartmentExpense) => {
    if (expense.hr_rejected || expense.finance_rejected) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Rejected
        </span>
      );
    }
    if (expense.finance_approved) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Approved
        </span>
      );
    }
    if (expense.hr_approved) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending Finance
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Pending HR
      </span>
    );
  };

  const isHRUser = () => {
    const dept = userDepartment.toLowerCase();
    return dept.includes('hr') || dept.includes('human resource');
  };

  const isFinanceUser = () => {
    const dept = userDepartment.toLowerCase();
    return dept.includes('finance') || dept.includes('accounting');
  };

  const handleApprove = async (expenseId: number, type: 'hr' | 'finance', reject: boolean = false) => {
    try {
      setApprovingExpenseId(expenseId);
      const endpoint = type === 'hr' 
        ? `${API_BASE_URL}/department-expenses/${expenseId}/approve-hr`
        : `${API_BASE_URL}/department-expenses/${expenseId}/approve-finance`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reject })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve expense');
      }

      setSuccess(data.message || 'Expense updated successfully');
      await loadExpenses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update expense');
      setTimeout(() => setError(''), 5000);
    } finally {
      setApprovingExpenseId(null);
    }
  };

  const loadExpenses = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingExpenses(true);
      const response = await fetch(`${API_BASE_URL}/department-expenses`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch department expenses');
      }

      setExpenses(data.data || []);
    } catch (err: any) {
      console.error('Error loading department expenses:', err);
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoadingExpenses(false);
    }
  }, [token]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDocumentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Department stays the same (from logged-in user)
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('You must be logged in to upload expenses.');
      return;
    }

    if (!description.trim() || !amount || !documentFile) {
      setError('Description, amount, and supporting document are required.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('amount', amount);
      formData.append('document', documentFile);
      if (departmentName) {
        formData.append('department_name', departmentName.trim());
      }

      const response = await fetch(`${API_BASE_URL}/department-expenses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload expense');
      }

      setSuccess('Department expense uploaded successfully.');
      resetForm();
      setIsModalOpen(false);
      await loadExpenses();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to upload department expense:', err);
      setError(err.message || 'Failed to upload department expense.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Header with Add Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Department Expenses</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage all department expenses
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Expense
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">All Department Expenses</h2>
            <p className="text-[11px] text-gray-500">Total: {expenses.length} expense(s)</p>
          </div>
          <button
            onClick={loadExpenses}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            disabled={loadingExpenses}
          >
            {loadingExpenses ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {loadingExpenses ? (
          <div className="px-5 py-6 text-center text-sm text-gray-500">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-gray-500">
            No department expenses uploaded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {(isHRUser() || isFinanceUser()) && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-xs">
                {expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 max-w-xs">
                      <p className="line-clamp-2">{expense.description}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {expense.department_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {formatCurrency(Number(expense.amount))}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {expense.uploaded_by_name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={expense.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(expense.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(expense)}
                      {expense.hr_approved_by_name && (
                        <p className="text-[10px] text-gray-500 mt-1">
                          HR: {expense.hr_approved_by_name}
                        </p>
                      )}
                      {expense.finance_approved_by_name && (
                        <p className="text-[10px] text-gray-500 mt-1">
                          Finance: {expense.finance_approved_by_name}
                        </p>
                      )}
                    </td>
                    {(isHRUser() || isFinanceUser()) && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {isHRUser() && !expense.hr_approved && !expense.hr_rejected && (
                            <>
                              <button
                                onClick={() => handleApprove(expense.id, 'hr', false)}
                                disabled={approvingExpenseId === expense.id}
                                className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                {approvingExpenseId === expense.id ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleApprove(expense.id, 'hr', true)}
                                disabled={approvingExpenseId === expense.id}
                                className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {isFinanceUser() && expense.hr_approved && !expense.finance_approved && !expense.finance_rejected && (
                            <>
                              <button
                                onClick={() => handleApprove(expense.id, 'finance', false)}
                                disabled={approvingExpenseId === expense.id}
                                className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                {approvingExpenseId === expense.id ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleApprove(expense.id, 'finance', true)}
                                disabled={approvingExpenseId === expense.id}
                                className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Adding New Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setIsModalOpen(false)}>
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Upload Department Expense</h2>
              <p className="text-xs text-gray-600 mt-1">
                Capture departmental out-of-pocket spend, attach the supporting document, and keep your finance team in sync.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  {loadingDepartment ? (
                    <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 bg-gray-50">
                      Loading your department...
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={departmentName}
                      readOnly
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                      placeholder="Your department will be auto-filled"
                    />
                  )}
                  <p className="text-[10px] text-gray-500 mt-1">
                    Automatically set from your staff profile
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Amount (KES) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Provide as much detail as possible..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Supporting Document *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,image/*"
                  onChange={e => setDocumentFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Accepted formats: PDF, images, Office documents (max 15MB)
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                    setError('');
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {submitting ? 'Uploading...' : 'Submit Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentExpenseUploadPage;

