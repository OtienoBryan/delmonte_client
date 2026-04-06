import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
 

type LedgerEntry = {
  id: number;
  date: string;
  description: string;
  reference_type: string;
  reference_id: number;
  debit: number;
  credit: number;
  running_balance: number;
};

type Aging = {
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
  total_payable: number;
};

const formatCurrency = (n: number) => (n || 0).toLocaleString(undefined, { style: 'currency', currency: 'KES' });
const formatDate = (d: string) => new Date(d).toLocaleDateString();

const SupplierLedgerPage: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplier, setSupplier] = useState<any>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const tableRef = useRef<HTMLDivElement>(null);
  const [aging, setAging] = useState<Aging>({ current: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, days_90_plus: 0, total_payable: 0 });
  const [showPayModal, setShowPayModal] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [accountId, setAccountId] = useState<number>(0);
  const [accounts, setAccounts] = useState<Array<{ id: number; account_code?: string; account_name?: string; name?: string }>>([]);
  const [amount, setAmount] = useState<number>(0);
  const [allocations, setAllocations] = useState<Array<{
    purchase_order_id: number;
    po_number?: string;
    invoice_number?: string | null;
    order_date?: string | null;
    status?: string | null;
    total_amount: number;
    amount_paid: number;
    balance_remaining: number;
    amount: number;
  }>>([]);

  const openPayModal = useCallback(async () => {
    setShowPayModal(true);
    setPayError(null);
    try {
      // Load cash/bank accounts
      try {
        const accUrl = API_CONFIG.getUrl(`/financial/cash-equivalents/accounts`);
        const accRes = await fetch(accUrl, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        const accData = await accRes.json();
        if (accRes.ok && accData.success) {
          const list = Array.isArray(accData.data) ? accData.data : [];
          setAccounts(list);
          if (!accountId && list.length > 0) setAccountId(Number(list[0].id));
        }
      } catch {}

      const url = API_CONFIG.getUrl(`/financial/purchase-orders`) + `?supplier_id=${supplierId}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (res.ok && data.success) {
        const rows = (data.data || [])
          .filter((po: any) => ['received', 'partially_received'].includes(String(po.status || '').toLowerCase()))
          .sort((a: any, b: any) => new Date(b.order_date || b.created_at || 0).getTime() - new Date(a.order_date || a.created_at || 0).getTime());
        const mapped = rows.map((po: any) => ({
          purchase_order_id: po.id,
          po_number: po.po_number,
          invoice_number: po.invoice_number || null,
          order_date: po.order_date || po.created_at || null,
          status: po.status || null,
          total_amount: Number(po.total_amount || 0),
          amount_paid: Number(po.amount_paid || 0),
          balance_remaining: Number(po.total_amount || 0) - Number(po.amount_paid || 0),
          amount: 0,
        }));
        setAllocations(mapped);
      } else {
        setPayError(data.error || 'Failed to load purchase orders');
      }
    } catch {}
  }, [supplierId]);

  const submitPayment = async () => {
    setPayLoading(true);
    setPayError(null);
    try {
      if (!accountId) throw new Error('Please select an account');
      const hasAlloc = allocations.some(a => a.amount && a.amount > 0);
      if (!hasAlloc && (!amount || amount <= 0)) throw new Error('Payment amount must be greater than 0');
      const payload: any = {
        supplier_id: Number(supplierId),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        account_id: accountId,
        reference,
        notes,
      };
      if (hasAlloc) {
        payload.allocations = allocations.filter(a => a.amount && a.amount > 0).map(a => ({ purchase_order_id: a.purchase_order_id, amount: a.amount }));
      } else {
        payload.amount = amount;
      }
      const res = await fetch(API_CONFIG.getUrl(`/financial/suppliers/${supplierId}/pay`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      const raw = await res.text();
      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch {
        throw new Error(raw || `Unexpected non-JSON response (HTTP ${res.status})`);
      }
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      setShowPayModal(false);
      setPage(1);
    } catch (e: any) {
      setPayError(e.message || 'Failed to record payment');
    } finally {
      setPayLoading(false);
    }
  };
  const totalAllocated = allocations.reduce((s, a) => s + Number(a.amount || 0), 0);
  

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (query.trim()) params.append('q', query.trim());
        params.append('page', String(page));
        params.append('limit', String(limit));
        const url = API_CONFIG.getUrl(`/financial/suppliers/${supplierId}/ledger`) + (params.toString() ? `?${params.toString()}` : '');
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
        setSupplier(data.data.supplier);
        const fetchedEntries: LedgerEntry[] = data.data.entries || [];
        setEntries(fetchedEntries);
        if (data.data.aging) {
          setAging(data.data.aging);
        } else {
          // Fallback client-side aging from fetched entries
          const today = new Date();
          const buckets: Aging = { current: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, days_90_plus: 0, total_payable: 0 };
          for (const e of fetchedEntries) {
            const dt = new Date(e.date);
            const diffDays = Math.floor((+today - +dt) / (1000 * 60 * 60 * 24));
            const value = Number(e.credit || 0) - Number(e.debit || 0);
            if (diffDays <= 0) buckets.current += value;
            else if (diffDays <= 30) buckets.days_1_30 += value;
            else if (diffDays <= 60) buckets.days_31_60 += value;
            else if (diffDays <= 90) buckets.days_61_90 += value;
            else buckets.days_90_plus += value;
            buckets.total_payable += value;
          }
          setAging(buckets);
        }
        if (data.data.pagination) {
          setTotal(data.data.pagination.total);
          setTotalPages(data.data.pagination.total_pages);
        } else {
          setTotal((data.data.entries || []).length);
          setTotalPages(1);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load supplier ledger');
      } finally {
        setLoading(false);
      }
    };
    if (supplierId) load();
  }, [supplierId, startDate, endDate, query, page, limit]);

  const summary = useMemo(() => {
    const totalDebit = entries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
    const totalCredit = entries.reduce((s, e) => s + (Number(e.credit) || 0), 0);
    const balance = entries.length ? entries[entries.length - 1].running_balance : totalCredit - totalDebit;
    return { totalDebit, totalCredit, balance };
  }, [entries]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supplier Ledger</h1>
            <p className="text-gray-600">{supplier ? supplier.company_name : 'Loading supplier...'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openPayModal} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Make Payment</button>
            <button
              onClick={async () => {
                if (!tableRef.current) return;
                const canvas = await html2canvas(tableRef.current, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
                const pageWidth = pdf.internal.pageSize.getWidth();
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pageWidth * 0.95;
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                const xOffset = (pageWidth - pdfWidth) / 2;
                pdf.addImage(imgData, 'PNG', xOffset, 20, pdfWidth, pdfHeight);
                pdf.save(`supplier_ledger_${supplierId}.pdf`);
              }}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-900 text-sm"
            >
              Export PDF
            </button>
            <button
              onClick={async () => {
                // fetch all pages with current filters
                const all: LedgerEntry[] = [];
                let cur = 1;
                let pages = 1;
                do {
                  const params = new URLSearchParams();
                  if (startDate) params.append('start_date', startDate);
                  if (endDate) params.append('end_date', endDate);
                  if (query.trim()) params.append('q', query.trim());
                  params.append('page', String(cur));
                  params.append('limit', '200');
                  const url = API_CONFIG.getUrl(`/financial/suppliers/${supplierId}/ledger`) + `?${params.toString()}`;
                  const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                  const data = await res.json();
                  if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
                  all.push(...(data.data.entries || []));
                  pages = data.data.pagination?.total_pages || 1;
                  cur += 1;
                } while (cur <= pages);

                const headers = ['Date', 'Description', 'Reference Type', 'Reference ID', 'Debit', 'Credit', 'Running Balance'];
                const rows = all.map(e => [
                  new Date(e.date).toISOString().slice(0,10),
                  (e.description || '').replace(/\n|\r/g, ' ').trim(),
                  e.reference_type || '',
                  String(e.reference_id || ''),
                  String(e.debit || 0),
                  String(e.credit || 0),
                  String(e.running_balance || 0)
                ]);
                const csvEscape = (s: string) => (s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s);
                const metaRows: string[][] = [
                  ['Supplier ID', String((supplier && supplier.id) || supplierId || '')],
                  ['Company', String((supplier && supplier.company_name) || '')],
                  ['Contact Person', String((supplier && supplier.contact_person) || '')],
                  ['Email', String((supplier && supplier.email) || '')],
                  ['Phone', String((supplier && supplier.phone) || '')],
                  ['Tax PIN', String((supplier && supplier.tax_id) || '')],
                  ['Address', String((supplier && supplier.address) || '')],
                  ['Date Range', `${startDate || 'All'} to ${endDate || 'All'}`],
                  ['Search', query || ''],
                  ['Generated At', new Date().toISOString()],
                ];
                const csv = [
                  ...metaRows.map(r => r.map(v => csvEscape(String(v))).join(',')),
                  '',
                  headers.map(csvEscape).join(','),
                  ...rows.map(r => r.map(v => csvEscape(String(v))).join(','))
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `supplier_ledger_${supplierId}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
            >
              Export CSV
            </button>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <span className="text-gray-400">–</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <input
                type="text"
                placeholder="Search description or ref..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm w-56"
              />
              {(startDate || endDate || query) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); setQuery(''); }}
                  className="ml-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear
                </button>
              )}
            </div>
            <Link to="/suppliers" className="text-blue-600 hover:underline">Back to Suppliers</Link>
          </div>
        </div>

        {loading ? (
          <div className="p-6 bg-white border border-gray-200 rounded-lg">Loading...</div>
        ) : error ? (
          <div className="p-6 bg-white border border-red-200 rounded-lg text-red-700">{error}</div>
        ) : (
          <>
            <div ref={tableRef}>
            {/* Supplier Details */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Company</p>
                <p className="text-lg font-semibold text-gray-900">{supplier.company_name}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Contact</p>
                <p className="text-lg font-semibold text-gray-900">{supplier.contact_person || '-'}</p>
                <p className="text-sm text-gray-600">{supplier.email || '-'}</p>
                <p className="text-sm text-gray-600">{supplier.phone || '-'}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Tax / Address</p>
                <p className="text-sm text-gray-700">PIN: {supplier.tax_id || '-'}</p>
                <p className="text-sm text-gray-700 break-words">{supplier.address || '-'}</p>
              </div>
            </div> */}

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Debit</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalDebit)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Credit</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalCredit)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.balance)}</p>
              </div>
            </div>

            {/* Payment Modal */}
            {showPayModal && (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Record Supplier Payment</h3>
                    <button className="text-gray-500 hover:text-gray-800" onClick={() => setShowPayModal(false)}>✕</button>
                  </div>
                  {payError && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{payError}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Payment Date</label>
                      <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full border rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Payment Method</label>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border rounded px-2 py-1">
                        <option value="cash">Cash</option>
                        <option value="check">Check</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="credit_card">Credit Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Account</label>
                      <select value={accountId || 0} onChange={e => setAccountId(parseInt(e.target.value || '0'))} className="w-full border rounded px-2 py-1">
                        <option value={0}>Select account</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{`${a.account_code ? `${a.account_code} - ` : ''}${a.account_name || a.name || a.id}`}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Reference</label>
                      <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="w-full border rounded px-2 py-1" placeholder="Ref no." />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm text-gray-600 mb-1">Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded px-2 py-1" rows={2} />
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Supplier Invoices (from purchase orders)</h4>
                      <span className="text-xs text-gray-500">Enter amounts to allocate; leave all 0 to make a bulk payment</span>
                    </div>
                    <div className="overflow-x-auto border rounded">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Invoice</th>
                            <th className="px-3 py-2 text-left">PO</th>
                            <th className="px-3 py-2 text-left">Date</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-right">Total</th>
                            <th className="px-3 py-2 text-right">Paid</th>
                            <th className="px-3 py-2 text-right">Balance</th>
                            <th className="px-3 py-2 text-right">Pay Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allocations.length === 0 ? (
                            <tr><td colSpan={8} className="px-3 py-3 text-center text-gray-500">No purchase orders found for this supplier</td></tr>
                          ) : allocations.map((a, idx) => (
                            <tr key={a.purchase_order_id} className="border-t">
                              <td className="px-3 py-2">{a.invoice_number || '-'}</td>
                              <td className="px-3 py-2">{a.po_number || a.purchase_order_id}</td>
                              <td className="px-3 py-2">{a.order_date ? new Date(a.order_date).toLocaleDateString() : '-'}</td>
                              <td className="px-3 py-2">{a.status || '-'}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(a.total_amount)}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(a.amount_paid)}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(a.balance_remaining)}</td>
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  max={a.balance_remaining}
                                  step="0.01"
                                  value={a.amount || 0}
                                  onChange={e => {
                                    const v = parseFloat(e.target.value || '0');
                                    setAllocations(prev => prev.map((row, i) => i === idx ? { ...row, amount: isNaN(v) ? 0 : v } : row));
                                  }}
                                  className="w-32 border rounded px-2 py-1 text-right"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {!allocations.some(a => (a.amount || 0) > 0) && (
                    <div className="mt-4">
                      <label className="block text-sm text-gray-600 mb-1">Bulk Payment Amount</label>
                      <input type="number" min={0} step="0.01" value={amount || 0} onChange={e => setAmount(parseFloat(e.target.value || '0'))} className="w-48 border rounded px-2 py-1" />
                    </div>
                  )}
                  <div className="mt-6 flex items-center justify-end gap-2">
                    <div className="mr-auto text-sm text-gray-600">Allocated: <span className="font-semibold">{totalAllocated.toLocaleString(undefined, { style: 'currency', currency: 'KES' })}</span></div>
                    <button className="px-4 py-2 border rounded" onClick={() => setShowPayModal(false)}>Cancel</button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={payLoading || (!allocations.some(a => (a.amount || 0) > 0) && (!amount || amount <= 0)) || !accountId} onClick={submitPayment}>
                      {payLoading ? 'Saving...' : 'Save Payment'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            

            {/* Aging Balance */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Aging Balance</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-3 border border-gray-200 rounded">
                  <p className="text-xs text-gray-500">Current</p>
                  <p className="text-base font-semibold">{formatCurrency(aging.current)}</p>
                </div>
                <div className="p-3 border border-gray-200 rounded">
                  <p className="text-xs text-gray-500">1-30 Days</p>
                  <p className="text-base font-semibold">{formatCurrency(aging.days_1_30)}</p>
                </div>
                <div className="p-3 border border-gray-200 rounded">
                  <p className="text-xs text-gray-500">31-60 Days</p>
                  <p className="text-base font-semibold">{formatCurrency(aging.days_31_60)}</p>
                </div>
                <div className="p-3 border border-gray-200 rounded">
                  <p className="text-xs text-gray-500">61-90 Days</p>
                  <p className="text-base font-semibold">{formatCurrency(aging.days_61_90)}</p>
                </div>
                <div className="p-3 border border-gray-200 rounded">
                  <p className="text-xs text-gray-500">90+ Days</p>
                  <p className="text-base font-semibold">{formatCurrency(aging.days_90_plus)}</p>
                </div>
              </div>
              <div className="mt-3 text-right">
                <span className="text-sm text-gray-600 mr-2">Total Payable:</span>
                <span className="text-lg font-bold text-blue-700">{formatCurrency(aging.total_payable)}</span>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No ledger entries</td>
                      </tr>
                    ) : (
                      entries.map((e) => (
                        <tr key={e.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatDate(e.date)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{e.description}</td>
                          <td className={`px-4 py-2 text-sm text-right ${Number(e.debit) > 0 ? 'text-green-600 font-medium' : 'text-gray-900'}`}>{formatCurrency(Number(e.debit || 0))}</td>
                          <td className={`px-4 py-2 text-sm text-right ${Number(e.credit) > 0 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>{formatCurrency(Number(e.credit || 0))}</td>
                          <td className={`px-4 py-2 text-sm text-right font-semibold ${Number(e.running_balance) < 0 ? 'text-red-700' : Number(e.running_balance) > 0 ? 'text-blue-700' : 'text-gray-900'}`}>{formatCurrency(Number(e.running_balance || 0))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination controls */}
              <div className="flex items-center justify-between p-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages} • {total} entries
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={limit}
                    onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value) || 25); }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                  <button
                    className="px-3 py-1 border rounded disabled:opacity-50"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SupplierLedgerPage;

