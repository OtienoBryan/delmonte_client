import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clientService } from '../services/clientService';

const CustomerPaymentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    amount: '',
    reference: '',
    invoice_id: '',
    status: 'completed',
    payment_date: new Date().toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await clientService.getCustomerPayments(id);
        setPayments(res.success ? res.data : []);
      } catch (err: any) {
        setError('Failed to fetch customer payments');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [id]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.amount || isNaN(Number(form.amount))) {
      setFormError('Amount is required and must be a number');
      return;
    }
    setSubmitting(true);
    try {
      await clientService.createCustomerPayment(id!, {
        amount: Number(form.amount),
        reference: form.reference,
        invoice_id: form.invoice_id || null,
        status: form.status,
        payment_date: form.payment_date,
      });
      setForm({ amount: '', reference: '', invoice_id: '', status: 'completed', payment_date: new Date().toISOString().slice(0, 10) });
      // Refresh payments
      const res = await clientService.getCustomerPayments(id!);
      setPayments(res.success ? res.data : []);
    } catch (err: any) {
      setFormError('Failed to create payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customer Payments</h1>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Back</button>
      </div>
      {/* Payment Entry Form */}
      <form onSubmit={handleFormSubmit} className="mb-8 bg-gray-50 p-4 rounded shadow flex flex-col md:flex-row gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
          <input type="number" name="amount" value={form.amount} onChange={handleFormChange} required min="0" step="0.01" className="px-3 py-2 border border-gray-300 rounded w-32" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Reference</label>
          <input type="text" name="reference" value={form.reference} onChange={handleFormChange} className="px-3 py-2 border border-gray-300 rounded w-32" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Invoice ID</label>
          <input type="text" name="invoice_id" value={form.invoice_id} onChange={handleFormChange} className="px-3 py-2 border border-gray-300 rounded w-32" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select name="status" value={form.status} onChange={handleFormChange} className="px-3 py-2 border border-gray-300 rounded w-32">
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Payment Date</label>
          <input type="date" name="payment_date" value={form.payment_date} onChange={handleFormChange} className="px-3 py-2 border border-gray-300 rounded w-40" />
        </div>
        <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{submitting ? 'Saving...' : 'Add Payment'}</button>
        {formError && <div className="text-red-600 text-sm ml-2">{formError}</div>}
      </form>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">No payments found</td>
              </tr>
            ) : (
              payments.map((p: any, idx: number) => (
                <tr key={p.id || idx}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{p.date ? new Date(p.date).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm text-green-600 font-semibold">{p.amount != null ? Number(p.amount).toLocaleString(undefined, { style: 'currency', currency: 'KES' }) : '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{p.reference || '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-700 underline">
                    {p.invoice_id ? (
                      <Link to={`/sales-orders/${p.invoice_id}`}>{p.invoice_id}</Link>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{p.status || '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{p.created_at ? new Date(p.created_at).toLocaleString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerPaymentsPage; 