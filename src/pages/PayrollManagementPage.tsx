import React, { useEffect, useMemo, useState } from 'react';
import { API_CONFIG } from '../config/api';
import { SearchIcon, FilterIcon, UsersIcon, WalletIcon, CalendarIcon } from 'lucide-react';

interface StaffItem {
  id: number;
  name: string;
  role?: string;
  salary?: number | null;
}

const API_BASE = API_CONFIG.getUrl('/payroll');

const PayrollManagementPage: React.FC = () => {
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Reserved for future inline salary edits; disable to avoid unused warnings
  // const [salaryEdits, setSalaryEdits] = useState<{ [id: number]: string }>({});
  const [showRunPayroll, setShowRunPayroll] = useState(false);
  const [runPayrollLoading, setRunPayrollLoading] = useState(false);
  const [runPayrollResult, setRunPayrollResult] = useState<any>(null);
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [overrideSalaries, setOverrideSalaries] = useState<{ [id: number]: string }>({});
  const [notes, setNotes] = useState('');
  const [showHistoryStaffId, setShowHistoryStaffId] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [allHistoryLoading, setAllHistoryLoading] = useState(false);
  const [allHistoryData, setAllHistoryData] = useState<any[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<string>('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string }>(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: firstDayOfMonth.toISOString().slice(0, 10),
      end: lastDayOfMonth.toISOString().slice(0, 10)
    };
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = API_CONFIG.getUrl('/staff');
        const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const normalized: StaffItem[] = (Array.isArray(data) ? data : []).map((s: any) => ({
          id: Number(s.id),
          name: s.name,
          role: s.role,
          salary: s.salary !== undefined && s.salary !== null ? Number(s.salary) : null,
        }));
        setStaff(normalized);
        // Inline salary edits initialization omitted for now
      } catch (err: any) {
        setError('Failed to fetch staff');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  // Fetch payment accounts
  useEffect(() => {
    const fetchPaymentAccounts = async () => {
      try {
        const res = await fetch(`${API_BASE}/payment-accounts`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const json = await res.json();
        if (json.success) {
          setPaymentAccounts(json.data || []);
          // Set default payment account if available
          if (json.data && json.data.length > 0) {
            setSelectedPaymentAccount(String(json.data[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to fetch payment accounts:', err);
      }
    };
    fetchPaymentAccounts();
  }, []);

  // Fetch payroll history for a staff member
  const fetchHistory = async (staffId: number) => {
    setHistoryLoading(true);
    setHistoryData([]);
    try {
      const res = await fetch(`${API_BASE}/history?staff_id=${staffId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const json = await res.json();
      setHistoryData(json.data || []);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch all payroll history
  const fetchAllHistory = async () => {
    setAllHistoryLoading(true);
    setAllHistoryData([]);
    try {
      const res = await fetch(`${API_BASE}/history`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const json = await res.json();
      setAllHistoryData(json.data || []);
    } catch {
      setAllHistoryData([]);
    } finally {
      setAllHistoryLoading(false);
    }
  };

  // Handle Run Payroll
  const handleRunPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunPayrollLoading(true);
    setRunPayrollResult(null);
    try {
      const body: any = {
        pay_date: payDate,
        notes,
      };
      if (selectedStaffIds.length > 0) body.staff_ids = selectedStaffIds;
      // Only send overrides for staff with a value
      const overrides: { [id: number]: number } = {};
      Object.entries(overrideSalaries).forEach(([id, val]) => {
        if (val && !isNaN(Number(val))) overrides[Number(id)] = Number(val);
      });
      if (Object.keys(overrides).length > 0) body.overrides = overrides;
      if (selectedPaymentAccount) body.payment_account_id = Number(selectedPaymentAccount);
      const res = await fetch(`${API_BASE}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setRunPayrollResult(json);
      if (json.success) {
        setShowRunPayroll(false);
        fetchAllHistory();
      }
    } catch (err) {
      setRunPayrollResult({ success: false, error: 'Failed to run payroll' });
    } finally {
      setRunPayrollLoading(false);
    }
  };

  // Example deduction functions (Kenya context, adjust as needed)
  function calculatePAYE(gross: number): number {
    // Simple tiered example, replace with actual tax bands
    if (gross <= 24000) return 0;
    if (gross <= 32333) return (gross - 24000) * 0.25;
    return (8333 * 0.25) + (gross - 32333) * 0.3;
  }

  function calculateNSSF(gross: number): number {
    // Flat rate or percentage, adjust as per law
    return Math.min(gross * 0.06, 1080); // Example: 6% capped at 1080
  }

  function calculateNHIF(gross: number): number {
    // Example: flat bands, replace with actual NHIF bands
    if (gross < 6000) return 150;
    if (gross < 8000) return 300;
    if (gross < 12000) return 400;
    return 500;
  }

  function calculateDeductions(gross: number) {
    const paye = calculatePAYE(gross);
    const nssf = calculateNSSF(gross);
    const nhif = calculateNHIF(gross);
    const total = paye + nssf + nhif;
    return { paye, nssf, nhif, total, net: gross - total };
  }

  // Filtering and pagination
  const filteredStaff = useMemo(() => {
    let list = staff;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q) || s.role?.toLowerCase().includes(q));
    }
    if (roleFilter) list = list.filter(s => (s.role || '') === roleFilter);
    return list;
  }, [staff, search, roleFilter]);

  const roles = useMemo(() => {
    return Array.from(new Set(staff.map(s => s.role).filter(Boolean))) as string[];
  }, [staff]);

  // Filtered payroll history data
  const filteredHistoryData = useMemo(() => {
    let filtered = historyData;
    
    // Filter by search term
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(h => 
        h.staff_name?.toLowerCase().includes(q) || 
        h.role?.toLowerCase().includes(q) || 
        h.notes?.toLowerCase().includes(q)
      );
    }
    
    // Filter by role
    if (roleFilter) {
      filtered = filtered.filter(h => h.role === roleFilter);
    }
    
    // Filter by date range
    if (dateRangeFilter.start || dateRangeFilter.end) {
      filtered = filtered.filter(h => {
        const payDate = new Date(h.pay_date);
        const startDate = dateRangeFilter.start ? new Date(dateRangeFilter.start) : null;
        const endDate = dateRangeFilter.end ? new Date(dateRangeFilter.end) : null;
        
        if (startDate && endDate) {
          return payDate >= startDate && payDate <= endDate;
        } else if (startDate) {
          return payDate >= startDate;
        } else if (endDate) {
          return payDate <= endDate;
        }
        return true;
      });
    }
    
    return filtered;
  }, [historyData, search, roleFilter, dateRangeFilter]);

  const filteredAllHistoryData = useMemo(() => {
    let filtered = allHistoryData;
    
    // Filter by search term
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(h => 
        h.staff_name?.toLowerCase().includes(q) || 
        h.role?.toLowerCase().includes(q) || 
        h.notes?.toLowerCase().includes(q)
      );
    }
    
    // Filter by role
    if (roleFilter) {
      filtered = filtered.filter(h => h.role === roleFilter);
    }
    
    // Filter by date range
    if (dateRangeFilter.start || dateRangeFilter.end) {
      filtered = filtered.filter(h => {
        const payDate = new Date(h.pay_date);
        const startDate = dateRangeFilter.start ? new Date(dateRangeFilter.start) : null;
        const endDate = dateRangeFilter.end ? new Date(dateRangeFilter.end) : null;
        
        if (startDate && endDate) {
          return payDate >= startDate && payDate <= endDate;
        } else if (startDate) {
          return payDate >= startDate;
        } else if (endDate) {
          return payDate <= endDate;
        }
        return true;
      });
    }
    
    return filtered;
  }, [allHistoryData, search, roleFilter, dateRangeFilter]);

  // Helper function to get current month date range
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: firstDayOfMonth.toISOString().slice(0, 10),
      end: lastDayOfMonth.toISOString().slice(0, 10)
    };
  };

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  // KPI summaries
  const totalEmployees = filteredStaff.length;
  const estimatedNetMonthly = filteredStaff.reduce((sum, s) => {
    const gross = s.salary ? Number(s.salary) : 0;
    const { net } = calculateDeductions(gross);
    return sum + net;
  }, 0);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Payroll Management</h1>
          <p className="text-xs text-gray-600">Manage staff salaries, run payroll, and review history</p>
        </div>
        <div className="flex gap-2">
        <button
            className="bg-green-600 text-white px-3 py-1.5 text-xs rounded-lg hover:bg-green-700"
          onClick={() => setShowRunPayroll(true)}
        >
          Run Payroll
        </button>
        <button
            className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 text-xs rounded-lg hover:bg-gray-50"
          onClick={() => { setShowAllHistory(true); fetchAllHistory(); }}
        >
            View History
        </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <UsersIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Employees</div>
            <div className="text-base font-semibold text-gray-900">{totalEmployees}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <WalletIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Est. Net Monthly</div>
            <div className="text-base font-semibold text-gray-900">{estimatedNetMonthly.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <SearchIcon className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or role"
              className="pl-7 pr-2 py-1.5 text-xs w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <FilterIcon className="w-3 h-3 text-gray-400" />
              <select
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All roles</option>
                {roles.map(r => (
                  <option key={r} value={r || ''}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-gray-500">Rows</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Payroll Table */}
      <div className="overflow-x-auto bg-white shadow-sm rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-4 text-xs">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={4} className="text-center text-red-600 py-4 text-xs">{error}</td></tr>
            ) : filteredStaff.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4 text-xs">No staff found</td></tr>
            ) : pageItems.map((s) => (
              <tr key={s.id}>
                <td className="px-3 py-2 text-xs">{s.name}</td>
                <td className="px-3 py-2 text-xs">{s.role}</td>
                <td className="px-3 py-2 text-xs">{s.salary !== undefined && s.salary !== null ? Number(s.salary).toLocaleString('en-US', { minimumFractionDigits: 2 }) : <span className="text-gray-400">N/A</span>}</td>
                <td className="px-3 py-2">
                  <button
                    className="text-blue-600 hover:underline mr-2 text-xs"
                    onClick={() => { setShowHistoryStaffId(s.id); fetchHistory(s.id); }}
                  >
                    View History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-xs">
        <div className="text-gray-600">Page {currentPage} of {totalPages}</div>
        <div className="flex gap-2">
          <button
            className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <button
            className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* Run Payroll Modal */}
      {showRunPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white bg-opacity-20 rounded-lg">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold">Run Payroll</h2>
                    <p className="text-green-100 text-xs">Process payroll for selected staff members</p>
                  </div>
              </div>
                <button 
                  className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  onClick={() => setShowRunPayroll(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleRunPayroll} className="space-y-4">
                {/* Basic Settings Section */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Basic Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Pay Date</label>
                      <input
                        type="date" 
                        value={payDate} 
                        onChange={e => setPayDate(e.target.value)} 
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Payment Account</label>
                <select
                  value={selectedPaymentAccount}
                  onChange={e => setSelectedPaymentAccount(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  required
                >
                  <option value="">Select Payment Account</option>
                  {paymentAccounts.map(pa => (
                    <option key={pa.id} value={pa.id}>
                      {pa.account_code} - {pa.account_name}
                    </option>
                  ))}
                </select>
                    </div>
                  </div>
              </div>

                {/* Staff Selection Section */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-gray-600" />
                    Staff Selection
                  </h3>
              <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Select Staff Members
                    </label>
                    <div className="bg-white border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <div className="space-y-1.5">
                        {staff.map(s => (
                          <label key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedStaffIds.length === 0 || selectedStaffIds.includes(s.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (selectedStaffIds.length === 0) {
                                    // If "all" was selected, now select only this one
                                    setSelectedStaffIds([s.id]);
                                  } else {
                                    setSelectedStaffIds([...selectedStaffIds, s.id]);
                                  }
                                } else {
                                  setSelectedStaffIds(selectedStaffIds.filter(id => id !== s.id));
                                }
                              }}
                              className="w-3 h-3 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-xs text-gray-900">{s.name}</div>
                              <div className="text-xs text-gray-500">{s.role}</div>
                            </div>
                            <div className="text-xs text-gray-600">
                              {s.salary ? `KES ${Number(s.salary).toLocaleString()}` : 'N/A'}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {selectedStaffIds.length === 0 ? 
                        'All staff members will be included' : 
                        `${selectedStaffIds.length} staff member(s) selected`
                      }
                    </div>
                  </div>
                </div>

                {/* Salary Overrides Section */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Salary Overrides (Optional)
                  </h3>
                  <div className="bg-white border border-gray-300 rounded-lg p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {staff.filter(s => selectedStaffIds.length === 0 || selectedStaffIds.includes(s.id)).map(s => (
                        <div key={s.id} className="space-y-1.5">
                          <div className="text-xs font-medium text-gray-900">{s.name}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500">Override:</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder={s.salary ? Number(s.salary).toLocaleString() : 'Enter amount'}
                              value={overrideSalaries[s.id] || ''}
                              onChange={e => setOverrideSalaries({ ...overrideSalaries, [s.id]: e.target.value })}
                              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          {s.salary && (
                            <div className="text-[10px] text-gray-500">
                              Current: KES {Number(s.salary).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Deductions Preview Section */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Payroll Preview
                  </h3>
                  <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">PAYE</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">NSSF</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">NHIF</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Total Deductions</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                      </tr>
                    </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                      {staff.filter(s => selectedStaffIds.length === 0 || selectedStaffIds.includes(s.id)).map(s => {
                        const gross = overrideSalaries[s.id] !== undefined && overrideSalaries[s.id] !== '' ? Number(overrideSalaries[s.id]) : (s.salary ?? 0);
                        const ded = calculateDeductions(gross);
                        return (
                              <tr key={s.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <div>
                                    <div className="text-xs font-medium text-gray-900">{s.name}</div>
                                    <div className="text-xs text-gray-500">{s.role}</div>
                                  </div>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                  KES {gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-red-600">
                                  KES {ded.paye.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-red-600">
                                  KES {ded.nssf.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-red-600">
                                  KES {ded.nhif.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-red-600 font-medium">
                                  KES {ded.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-green-600 font-bold">
                                  KES {ded.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                          </tr>
                        );
                      })}
                    </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td className="px-3 py-2 text-xs font-medium text-gray-900">Totals</td>
                            <td className="px-3 py-2 text-xs font-medium text-gray-900">
                              KES {staff.filter(s => selectedStaffIds.length === 0 || selectedStaffIds.includes(s.id))
                                .reduce((sum, s) => {
                                  const gross = overrideSalaries[s.id] !== undefined && overrideSalaries[s.id] !== '' ? Number(overrideSalaries[s.id]) : (s.salary ?? 0);
                                  return sum + gross;
                                }, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-xs font-medium text-red-600">
                              KES {staff.filter(s => selectedStaffIds.length === 0 || selectedStaffIds.includes(s.id))
                                .reduce((sum, s) => {
                                  const gross = overrideSalaries[s.id] !== undefined && overrideSalaries[s.id] !== '' ? Number(overrideSalaries[s.id]) : (s.salary ?? 0);
                                  return sum + calculateDeductions(gross).paye;
                                }, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-xs font-medium text-red-600">
                              KES {staff.filter(s => selectedStaffIds.length === 0 || selectedStaffIds.includes(s.id))
                                .reduce((sum, s) => {
                                  const gross = overrideSalaries[s.id] !== undefined && overrideSalaries[s.id] !== '' ? Number(overrideSalaries[s.id]) : (s.salary ?? 0);
                                  return sum + calculateDeductions(gross).nssf;
                                }, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-xs font-medium text-red-600">
                              KES {staff.filter(s => selectedStaffIds.length === 0 || selectedStaffIds.includes(s.id))
                                .reduce((sum, s) => {
                                  const gross = overrideSalaries[s.id] !== undefined && overrideSalaries[s.id] !== '' ? Number(overrideSalaries[s.id]) : (s.salary ?? 0);
                                  return sum + calculateDeductions(gross).nhif;
                                }, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-xs font-medium text-red-600">
                              KES {staff.filter(s => selectedStaffIds.length === 0 || selectedStaffIds.includes(s.id))
                                .reduce((sum, s) => {
                                  const gross = overrideSalaries[s.id] !== undefined && overrideSalaries[s.id] !== '' ? Number(overrideSalaries[s.id]) : (s.salary ?? 0);
                                  return sum + calculateDeductions(gross).total;
                                }, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-xs font-bold text-green-600">
                              KES {staff.filter(s => selectedStaffIds.length === 0 || selectedStaffIds.includes(s.id))
                                .reduce((sum, s) => {
                                  const gross = overrideSalaries[s.id] !== undefined && overrideSalaries[s.id] !== '' ? Number(overrideSalaries[s.id]) : (s.salary ?? 0);
                                  return sum + calculateDeductions(gross).net;
                                }, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                  </table>
                </div>
              </div>
                </div>

                {/* Notes Section */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Additional Notes (Optional)
                  </h3>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    placeholder="Enter any additional notes about this payroll run..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                    rows={3}
                  />
              </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                {runPayrollResult && (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        runPayrollResult.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                    {runPayrollResult.success ? runPayrollResult.message : runPayrollResult.error}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRunPayroll(false)}
                      className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={runPayrollLoading}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1.5"
                    >
                      {runPayrollLoading ? (
                        <>
                          <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Run Payroll
                        </>
                      )}
                    </button>
                  </div>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Staff Payroll History Modal */}
      {showHistoryStaffId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full h-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white bg-opacity-20 rounded-lg">
                    <WalletIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold">Payroll History</h2>
                    <p className="text-blue-100 text-xs">
                      {staff.find(s => s.id === showHistoryStaffId)?.name} - Payment Records
                    </p>
                  </div>
                </div>
                <button 
                  className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  onClick={() => setShowHistoryStaffId(null)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto h-full">
            {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3 text-gray-600">
                    <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs">Loading payroll history...</span>
                  </div>
                </div>
            ) : historyData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <WalletIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No Payroll History</h3>
                  <p className="text-xs text-gray-500">This staff member hasn't received any payroll payments yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-500 rounded-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-600">Total Payments</p>
                          <p className="text-base font-bold text-green-900">{filteredHistoryData.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-500 rounded-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-blue-600">Total Amount</p>
                          <p className="text-base font-bold text-blue-900">
                            KES {filteredHistoryData.reduce((sum, h) => sum + Number(h.amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-500 rounded-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-purple-600">Latest Payment</p>
                          <p className="text-sm font-bold text-purple-900">
                            {filteredHistoryData[0]?.pay_date ? new Date(filteredHistoryData[0].pay_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={dateRangeFilter.start}
                            onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, start: e.target.value })}
                            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Start Date"
                          />
                          <span className="flex items-center text-xs text-gray-500">to</span>
                          <input
                            type="date"
                            value={dateRangeFilter.end}
                            onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, end: e.target.value })}
                            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="End Date"
                          />
                        </div>
                      </div>
                                              <div className="flex items-end gap-2">
                          <button
                            onClick={() => setDateRangeFilter(getCurrentMonthRange())}
                            className="px-2 py-1.5 text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            Current Month
                          </button>
                          <button
                            onClick={() => {
                              setDateRangeFilter(getCurrentMonthRange());
                              setSearch('');
                              setRoleFilter('');
                            }}
                            className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Reset All
                          </button>
                        </div>
                    </div>
                  </div>

                  {/* History Table */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-sm font-semibold text-gray-900">Payment Records</h3>
                    </div>
                    <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Pay Date</th>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredHistoryData.map((h: any, index: number) => (
                            <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-gray-900">
                                      {new Date(h.pay_date).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                      {new Date(h.pay_date).toLocaleDateString('en-US', { 
                                        weekday: 'long' 
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-bold text-green-600">
                                  KES {Number(h.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-xs text-gray-900 max-w-xs">
                                  {h.notes || (
                                    <span className="text-gray-400 italic">No notes provided</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                                  <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Paid
                                </span>
                              </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                    </div>
                  </div>
                </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* All Payroll History Modal */}
      {showAllHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full h-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white bg-opacity-20 rounded-lg">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold">All Payroll History</h2>
                    <p className="text-indigo-100 text-xs">Complete overview of all payroll payments across the organization</p>
                  </div>
                </div>
                <button 
                  className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  onClick={() => setShowAllHistory(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto h-full">
            {allHistoryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3 text-gray-600">
                    <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs">Loading payroll history...</span>
                  </div>
                </div>
            ) : allHistoryData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No Payroll History</h3>
                  <p className="text-xs text-gray-500">No payroll payments have been processed yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-500 rounded-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-600">Total Staff Paid</p>
                          <p className="text-base font-bold text-green-900">
                            {new Set(allHistoryData.map(h => h.staff_id || h.staff_name)).size}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-500 rounded-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-blue-600">Total Payments</p>
                          <p className="text-base font-bold text-blue-900">{filteredAllHistoryData.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-500 rounded-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-purple-600">Total Amount</p>
                          <p className="text-base font-bold text-purple-900">
                            KES {filteredAllHistoryData.reduce((sum, h) => sum + Number(h.amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 rounded-xl border border-orange-200">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-orange-500 rounded-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-orange-600">Latest Payment</p>
                          <p className="text-sm font-bold text-orange-900">
                            {filteredAllHistoryData[0]?.pay_date ? new Date(filteredAllHistoryData[0].pay_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex flex-col gap-3">
                      {/* Search and Role Filter Row */}
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1">
                          <div className="relative">
                            <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search by staff name, role, or notes..."
                              className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="">All Roles</option>
                            {Array.from(new Set(allHistoryData.map(h => h.role))).map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              setSearch('');
                              setRoleFilter('');
                              setDateRangeFilter(getCurrentMonthRange());
                            }}
                            className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Reset to Current Month
                          </button>
                        </div>
                      </div>
                      
                      {/* Date Range Filter Row */}
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={dateRangeFilter.start}
                              onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, start: e.target.value })}
                              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Start Date"
                            />
                            <span className="flex items-center text-xs text-gray-500">to</span>
                            <input
                              type="date"
                              value={dateRangeFilter.end}
                              onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, end: e.target.value })}
                              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="End Date"
                            />
                          </div>
                        </div>
                        <div className="flex items-end gap-2">
                          <button
                            onClick={() => setDateRangeFilter(getCurrentMonthRange())}
                            className="px-2 py-1.5 text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            Current Month
                          </button>
                          <button
                            onClick={() => {
                              setSearch('');
                              setRoleFilter('');
                              setDateRangeFilter(getCurrentMonthRange());
                            }}
                            className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Reset All
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* History Table */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-sm font-semibold text-gray-900">Payment Records</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Pay Date</th>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAllHistoryData.map((h: any, index: number) => (
                            <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-indigo-600">{index + 1}</span>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-gray-900">
                                      {new Date(h.pay_date).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                      {new Date(h.pay_date).toLocaleDateString('en-US', { 
                                        weekday: 'short' 
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-gray-600">
                                      {h.staff_name?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                  </div>
                                  <div className="text-xs font-medium text-gray-900">{h.staff_name}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800">
                                  {h.role || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-bold text-green-600">
                                  KES {Number(h.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-xs text-gray-900 max-w-xs">
                                  {h.notes || (
                                    <span className="text-gray-400 italic">No notes provided</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                                  <svg className="w-2.5 h-2.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Paid
                                </span>
                              </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                    </div>
                    
                    {/* No Results Message */}
                    {allHistoryData.filter(h => {
                      const searchLower = search.toLowerCase();
                      const matchesSearch = !search || 
                        h.staff_name?.toLowerCase().includes(searchLower) ||
                        h.role?.toLowerCase().includes(searchLower) ||
                        h.notes?.toLowerCase().includes(searchLower);
                      const matchesRole = !roleFilter || h.role === roleFilter;
                      return matchesSearch && matchesRole;
                    }).length === 0 && search && (
                      <div className="text-center py-8 text-xs text-gray-500">
                        No results found for "{search}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagementPage; 