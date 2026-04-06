import React, { useEffect, useState } from 'react';
import { deliveryNotesService, deliveryNoteItemsService } from '../services/financialService';
import { DeliveryNote, DeliveryNoteItem } from '../types/financial';
import { Link, useSearchParams } from 'react-router-dom';
import { riderService, Rider } from '../services/riderService';

const statusOptions = [
  'all',
  'draft',
  'prepared',
  'delivered',
  'cancelled'
];

const progressOptions = [
  { value: 'all', label: 'All' },
  { value: 0, label: 'Draft' },
  { value: 1, label: 'Prepared' },
  { value: 2, label: 'In Transit' },
  { value: 3, label: 'Delivered' },
  { value: 4, label: 'Cancelled' }
];

const DeliveryNotePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('all');
  const [progress, setProgress] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deliveryNoteItems, setDeliveryNoteItems] = useState<DeliveryNoteItem[]>([]);
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState<DeliveryNote | null>(null);
  // Assign Rider modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningDeliveryNote, setAssigningDeliveryNote] = useState<DeliveryNote | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeliveryNotes();
    // eslint-disable-next-line
  }, [status, progress, orderId]);

  const fetchDeliveryNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await deliveryNotesService.getAll();
      let data: DeliveryNote[] = res.data || [];
      
      // Filter by orderId if provided
      if (orderId) {
        data = data.filter((dn) => dn.sales_order_id === Number(orderId));
      }
      
      if (status !== 'all') {
        data = data.filter((dn) => dn.status === status);
      }
      if (progress !== 'all') {
        data = data.filter((dn) => dn.my_status === Number(progress));
      }
      setDeliveryNotes(data);
    } catch (err: any) {
      setError('Failed to fetch delivery notes');
    } finally {
      setLoading(false);
    }
  };

  const openDeliveryNoteItemsModal = async (deliveryNote: DeliveryNote) => {
    setSelectedDeliveryNote(deliveryNote);
    setModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    try {
      console.log('Fetching delivery note items for delivery note ID:', deliveryNote.id);
      const res = await deliveryNoteItemsService.getByDeliveryNoteId(deliveryNote.id);
      console.log('API response:', res);
      if (res.success && res.data) {
        console.log('Delivery note items found:', res.data);
        setDeliveryNoteItems(res.data);
      } else {
        console.log('No delivery note items found or error:', res.error);
        setDeliveryNoteItems([]);
        setModalError(res.error || 'Failed to fetch delivery note items');
      }
    } catch (err) {
      console.error('Error fetching delivery note items:', err);
      setDeliveryNoteItems([]);
      setModalError('Failed to fetch delivery note items');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setDeliveryNoteItems([]);
    setSelectedDeliveryNote(null);
    setModalError(null);
  };

  // Assign Rider modal logic
  const openAssignRiderModal = async (deliveryNote: DeliveryNote) => {
    setAssigningDeliveryNote(deliveryNote);
    setAssignModalOpen(true);
    setAssignError(null);
    setSelectedRider(null);
    try {
      const ridersList = await riderService.getRiders();
      setRiders(ridersList);
      if (ridersList.length === 0) {
        setAssignError('No riders found. Please add riders.');
      }
    } catch (err) {
      setRiders([]);
      setAssignError('Failed to fetch riders');
    }
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setAssigningDeliveryNote(null);
    setSelectedRider(null);
    setAssignError(null);
  };

  const handleAssignRider = async () => {
    if (!assigningDeliveryNote || !selectedRider) return;
    setAssignLoading(true);
    setAssignError(null);
    try {
      await deliveryNotesService.assignRider(assigningDeliveryNote.id, selectedRider);
      closeAssignModal();
      fetchDeliveryNotes();
    } catch (err) {
      setAssignError('Failed to assign rider');
    } finally {
      setAssignLoading(false);
    }
  };

  // Handler for marking delivery note as delivered
  const handleMarkAsDelivered = async (deliveryNote: DeliveryNote) => {
    if (!window.confirm(`Are you sure you want to mark delivery note #${deliveryNote.dn_number} as delivered?`)) return;
    try {
      const res = await deliveryNotesService.markAsDelivered(deliveryNote.id);
      if (res.success) {
        alert('Delivery note and sales order marked as delivered successfully.');
        fetchDeliveryNotes();
      } else {
        alert(res.error || 'Failed to mark delivery note as delivered.');
      }
    } catch (err) {
      alert('Failed to mark delivery note as delivered.');
    }
  };

  const number_format = (amount: number) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Map my_status to human-readable label
  const getProgressStatus = (my_status?: number) => {
    switch (my_status) {
      case 0:
        return 'Draft';
      case 1:
        return 'Prepared';
      case 2:
        return 'In Transit';
      case 3:
        return 'Delivered';
      case 4:
        return 'Cancelled';
      default:
        return '-';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b mb-6">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery Notes</h1>
            <p className="text-gray-600 mt-1">
              {orderId ? `View delivery notes for Sales Order #${orderId}` : 'View all delivery notes and their status'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {orderId && (
              <Link
                to="/inventory-sales"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 font-medium"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Sales Orders
              </Link>
            )}
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Status:</label>
            <select
              id="status-filter"
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
              ))}
            </select>
            <label htmlFor="progress-filter" className="text-sm font-medium text-gray-700 ml-4">Progress:</label>
            <select
              id="progress-filter"
              value={progress}
              onChange={e => setProgress(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {progressOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="max-w-8xl mx-auto bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center">{error}</div>
        ) : deliveryNotes.length === 0 ? (
          <div className="text-gray-500 text-center">
            {orderId ? `No delivery notes found for Sales Order #${orderId}.` : 'No delivery notes found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">DN #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rider</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveryNotes.map((deliveryNote) => (
                  <tr key={deliveryNote.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDeliveryNoteItemsModal(deliveryNote)}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{deliveryNote.dn_number}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{deliveryNote.customer_name || deliveryNote.customer?.company_name || deliveryNote.customer_id}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{deliveryNote.delivery_date}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 capitalize">{deliveryNote.status}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{getProgressStatus(deliveryNote.my_status)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{deliveryNote.rider_name ? `${deliveryNote.rider_name} (${deliveryNote.rider_contact})` : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(deliveryNote.total_amount || 0)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{deliveryNote.notes || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <Link
                        to={`/delivery-notes/${deliveryNote.id}`}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs mr-2"
                        onClick={e => e.stopPropagation()}
                      >
                        View Details
                      </Link>
                      {deliveryNote.my_status === 1 && (
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                          onClick={e => { e.stopPropagation(); openAssignRiderModal(deliveryNote); }}
                        >
                          Assign Rider
                        </button>
                      )}
                      {deliveryNote.my_status === 2 && (
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs ml-2"
                          onClick={e => { e.stopPropagation(); handleMarkAsDelivered(deliveryNote); }}
                        >
                          Mark Delivered
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delivery Note Items Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
            <button onClick={closeModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            <h2 className="text-xl font-bold mb-4">Delivery Note Items for {selectedDeliveryNote?.dn_number}</h2>
            {modalLoading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : modalError ? (
              <div className="text-red-600 text-center">{modalError}</div>
            ) : deliveryNoteItems.length === 0 ? (
              <div className="text-gray-500 text-center">
                No items found for this delivery note.
                <br />
                <small className="text-xs">Debug: Delivery Note ID {selectedDeliveryNote?.id}</small>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Net Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Delivered Qty</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deliveryNoteItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.product?.product_name || item.product_id}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.quantity}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(item.unit_price)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(item.tax_amount || 0)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(item.net_price || 0)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{number_format(item.total_price || 0)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.delivered_quantity || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Rider Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button onClick={closeAssignModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            <h2 className="text-xl font-bold mb-4">Assign Rider to Delivery Note {assigningDeliveryNote?.dn_number}</h2>
            {assignError && <div className="text-red-600 mb-2">{assignError}</div>}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Rider</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={selectedRider ?? ''}
                onChange={e => setSelectedRider(Number(e.target.value))}
                disabled={riders.length === 0}
              >
                <option value="">-- Select Rider --</option>
                {riders.map(rider => (
                  <option key={rider.id} value={rider.id}>{rider.name} ({rider.contact})</option>
                ))}
              </select>
              {riders.length === 0 && (
                <div className="text-xs text-red-500 mt-2">No riders available. Please add riders.</div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeAssignModal}
                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                disabled={assignLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRider}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                disabled={assignLoading || !selectedRider}
              >
                {assignLoading ? 'Assigning...' : 'Assign Rider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryNotePage; 