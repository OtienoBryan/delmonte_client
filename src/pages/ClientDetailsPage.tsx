import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService, Client } from '../services/clientService';
import { Building2, FileText } from 'lucide-react';
import PaymentModal from '../components/Clients/PaymentModal';
import { creditNoteService } from '../services/creditNoteService';

const ClientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [unconfirmedPayments, setUnconfirmedPayments] = useState<any[]>([]);
  const [unconfirmedPaymentsLoading, setUnconfirmedPaymentsLoading] = useState(false);
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [creditNotesLoading, setCreditNotesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payments' | 'creditNotes' | 'history'>('overview');

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const numericId = Number(id);
      const [clientData, invoicesRes, paymentsRes] = await Promise.all([
        clientService.getClient(numericId),
        clientService.getCustomerInvoices(numericId),
        clientService.getCustomerPayments(numericId)
      ]);
      setClient(clientData);
      setInvoices(invoicesRes.success ? invoicesRes.data : []);
      setPayments(paymentsRes.success ? paymentsRes.data : []);
      console.log('Fetched sales orders (invoices):', invoicesRes.success ? invoicesRes.data : []);
      console.log('Fetched payments:', paymentsRes.success ? paymentsRes.data : []);
    } catch (error: any) {
      console.error('Error fetching client, invoices, or payments:', error);
      if (error?.response?.status === 404) {
        setError('Client not found (404)');
      } else {
        setError(error?.message || error?.response?.data?.message || 'Failed to load client data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!id) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await clientService.getClientHistory(Number(id));
      setHistory(data);
    } catch (err: any) {
      setHistoryError('Failed to fetch client history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchUnconfirmedPayments = async () => {
    if (!id) return;
    setUnconfirmedPaymentsLoading(true);
    try {
      const response = await fetch(`/api/financial/receipts?status=in pay`);
      const data = await response.json();
      if (data.success) {
        // Filter receipts for this specific client
        const clientReceipts = data.data.filter((receipt: any) => receipt.client_id === Number(id));
        setUnconfirmedPayments(clientReceipts);
      } else {
        setUnconfirmedPayments([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch unconfirmed payments:', err);
      setUnconfirmedPayments([]);
    } finally {
      setUnconfirmedPaymentsLoading(false);
    }
  };

  const fetchCreditNotes = async () => {
    if (!id) return;
    setCreditNotesLoading(true);
    try {
      const response = await creditNoteService.getCustomerCreditNotes(Number(id));
      if (response.success) {
        setCreditNotes(response.data);
      } else {
        setCreditNotes([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch credit notes:', err);
      setCreditNotes([]);
    } finally {
      setCreditNotesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchHistory();
    fetchUnconfirmedPayments();
    fetchCreditNotes();
  }, [id]);

  const formatKES = (n: number) => Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'KES' });
  const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString() : '');

  const totals = useMemo(() => {
    // Calculate total from sales orders (my_status 1, 2, 3)
    const totalInvoicedViaSalesOrders = invoices.reduce((s: number, order: any) => {
      // Calculate total from items if total_amount is not available
      const orderTotal = order.total_amount || 
        (order.items && order.items.reduce((sum: number, item: any) => sum + Number(item.total_price || 0), 0)) || 0;
      return s + Number(orderTotal);
    }, 0);
    
    const totalInvoicedViaHistory = history.reduce((s, e) => s + Number(e.debit || 0), 0);
    const totalInvoiced = totalInvoicedViaSalesOrders > 0 ? totalInvoicedViaSalesOrders : totalInvoicedViaHistory;
    const totalPaid = payments.filter((p: any) => p.status === 'confirmed').reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const outstanding = Math.max(0, totalInvoiced - totalPaid);
    const currentBalance = client && (client as any).balance != null ? Number((client as any).balance) : outstanding;
    return { totalInvoiced, totalPaid, outstanding, currentBalance };
  }, [invoices, payments, history, client]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/dashboard/clients')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Client not found</p>
          <button
            onClick={() => navigate('/dashboard/clients')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name || (client as any).company_name}</h1>
            <div className="text-sm text-gray-600">{client.address || '-'}</div>
            <div className="text-sm text-gray-600">{(client as any).email || ''} {(client as any).contact ? `• ${(client as any).contact}` : ''}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">
            Balance: <span className="font-semibold">{formatKES(totals.currentBalance)}</span>
          </div>
          <button onClick={() => navigate(`/customers/${client.id}/ledger`)} className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-black text-sm">View Ledger</button>
          {/* <button onClick={() => navigate(`/customers/${client.id}/payments`)} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Payments</button>
           */}
          <button onClick={() => navigate(`/create-credit-note?customerId=${client.id}`)} className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm flex items-center">
            <FileText className="w-4 h-4 mr-2" /> Credit Note
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-4" aria-label="Tabs">
          {[
            { key: 'overview', label: 'Overview', count: undefined },
            { key: 'invoices', label: 'Sales Orders', count: invoices.length },
            { key: 'payments', label: 'Payments', count: payments.length },
            { key: 'creditNotes', label: 'Credit Notes', count: creditNotes.length },
            { key: 'history', label: 'History', count: history.length },
          ].map((tab: any) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-2 px-3 border-b-2 text-sm font-medium ${activeTab === tab.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'}`}
            >
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>{tab.count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500">Total Invoiced</div>
                <div className="text-xl font-bold">{formatKES(totals.totalInvoiced)}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500">Total Paid</div>
                <div className="text-xl font-bold text-green-700">{formatKES(totals.totalPaid)}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500">Outstanding</div>
                <div className="text-xl font-bold text-red-700">{formatKES(totals.outstanding)}</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Recent Sales Orders</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.slice(0, 5).map((order: any) => {
                      const orderTotal = order.total_amount || 
                        (order.items && order.items.reduce((sum: number, item: any) => sum + Number(item.total_price || 0), 0)) || 0;
                      const statusText = order.my_status === 1 ? 'Approved' : order.my_status === 2 ? 'Assigned' : order.my_status === 3 ? 'In Transit' : 'Unknown';
                      return (
                        <tr 
                          key={order.id} 
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => navigate(`/sales-orders/${order.id}`)}
                        >
                          <td className="px-4 py-2 text-sm text-gray-900">{order.order_number || order.id}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{formatDate(order.created_at)}</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">{formatKES(Number(orderTotal))}</td>
                          <td className="px-4 py-2 text-sm">{statusText}</td>
                        </tr>
                      );
                    })}
                    {invoices.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-3 text-center text-gray-500">No sales orders</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Client Info</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <div><span className="text-gray-500">Name:</span> {client.name || (client as any).company_name}</div>
                <div><span className="text-gray-500">Email:</span> {(client as any).email || '-'}</div>
                <div><span className="text-gray-500">Phone:</span> {(client as any).contact || '-'}</div>
                <div><span className="text-gray-500">Address:</span> {client.address || '-'}</div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    setSelectedInvoice(null); // Clear any previously selected invoice
                    setIsPaymentModalOpen(true);
                  }} 
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm hidden"
                >
                  Record General Payment
                </button>
                <button onClick={() => navigate(`/customers/${client.id}/ledger`)} className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-black text-sm">View Ledger</button>
                <button onClick={() => navigate(`/create-credit-note?customerId=${client.id}`)} className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm flex items-center"><FileText className="w-4 h-4 mr-1"/>Create Credit Note</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Orders Tab */}
      {activeTab === 'invoices' && (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">No sales orders found</td>
                </tr>
              ) : (
                invoices.map((order: any) => {
                  const orderTotal = order.total_amount || 
                    (order.items && order.items.reduce((sum: number, item: any) => sum + Number(item.total_price || 0), 0)) || 0;
                  const statusText = order.my_status === 1 ? 'Approved' : order.my_status === 2 ? 'Assigned' : order.my_status === 3 ? 'In Transit' : 'Unknown';
                  const paid = payments
                    .filter((p: any) => p.invoice_id === order.id && p.status === 'confirmed')
                    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                  const balance = Number(orderTotal) - paid;
                  return (
                    <tr 
                      key={order.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={(e) => {
                        // Don't navigate if clicking on action buttons
                        if ((e.target as HTMLElement).closest('button')) {
                          return;
                        }
                        navigate(`/sales-orders/${order.id}`);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.order_number || order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(order.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {orderTotal > 0 ? formatKES(Number(orderTotal)) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{statusText}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-700 font-semibold">
                        {paid > 0 ? formatKES(paid) : '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${balance === 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatKES(balance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(order);
                              setIsPaymentModalOpen(true);
                            }}
                          >
                            Record Payment
                          </button>
                          <button
                            className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/create-credit-note?customerId=${client.id}&invoiceId=${order.id}`);
                            }}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Credit Note
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Credit Notes Tab */}
      {activeTab === 'creditNotes' && (
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 p-4">Credit Notes</h2>
          <div className="p-4">
            <button onClick={() => navigate(`/create-credit-note?customerId=${client.id}`)} className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm flex items-center"><FileText className="w-4 h-4 mr-2" />Create Credit Note</button>
          </div>
        </div>
        {creditNotesLoading ? (
          <div className="p-4 text-gray-600">Loading credit notes...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Note #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {creditNotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No credit notes found</td>
                  </tr>
                ) : (
                  creditNotes.map((creditNote: any) => (
                    <tr key={creditNote.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{creditNote.credit_note_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {creditNote.credit_note_date ? new Date(creditNote.credit_note_date).toLocaleDateString() : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {creditNote.original_invoice_id ? `INV-${creditNote.original_invoice_id}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{creditNote.reason || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-orange-700">
                        {creditNote.total_amount ? Number(creditNote.total_amount).toLocaleString(undefined, { style: 'currency', currency: 'KES' }) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          creditNote.status === 'active' ? 'bg-green-100 text-green-800' :
                          creditNote.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {creditNote.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                          onClick={() => navigate(`/credit-notes/${creditNote.id}`)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Unconfirmed Payments</h2>
          <button 
            onClick={() => {
              setSelectedInvoice(null); // Clear any previously selected invoice
              setIsPaymentModalOpen(true);
            }} 
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Record General Payment
          </button>
        </div>
        {unconfirmedPaymentsLoading ? (
          <div className="p-4 text-gray-600">Loading unconfirmed payments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unconfirmedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">No unconfirmed payments found</td>
                  </tr>
                ) : (
                  unconfirmedPayments.map((payment: any) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.receipt_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.receipt_date ? new Date(payment.receipt_date).toLocaleDateString() : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.payment_method}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.reference || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.invoice_number ? `INV-${payment.invoice_number}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-700">
                        {payment.amount ? Number(payment.amount).toLocaleString(undefined, { style: 'currency', currency: 'KES' }) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.notes || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/financial/receivables/confirm-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ receipt_id: payment.id }),
                              });
                              const data = await response.json();
                              if (data.success) {
                                // Refresh all data
                                fetchData();
                                fetchHistory();
                                fetchUnconfirmedPayments();
                              } else {
                                alert('Failed to confirm payment: ' + (data.error || 'Unknown error'));
                              }
                            } catch (err: any) {
                              alert('Error confirming payment: ' + err.message);
                            }
                          }}
                        >
                          Confirm Payment
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}
      {/* History Tab */}
      {activeTab === 'history' && (
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <div className="p-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Client History</h2></div>
        {historyLoading ? (
          <div className="p-4 text-gray-600">Loading history...</div>
        ) : historyError ? (
          <div className="p-4 text-red-600">{historyError}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference ID</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Running Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No history found</td>
                  </tr>
                ) : (
                  history.map((entry: any) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date ? new Date(entry.date).toLocaleDateString() : ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.reference_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.reference_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{Number(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{Number(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{Number(entry.running_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={selectedInvoice}
        clientId={client.id}
        onSuccess={() => {
          fetchData();
          fetchHistory();
          fetchUnconfirmedPayments();
        }}
      />
    </div>
  );
};

export default ClientDetailsPage; 