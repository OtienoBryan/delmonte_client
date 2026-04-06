import React, { useState, useEffect } from 'react';
import { X, Eye, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clientService } from '../services/clientService';
import EditClientModal from './EditClientModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface InactiveClient {
  id: number;
  name: string;
  company_name?: string;
  email: string;
  address?: string;
  contact?: string;
  tax_pin?: string;
  credit_limit?: string;
  payment_terms?: string;
  country_id?: number;
  countryId?: number;
  region_id?: number;
  route_id?: number;
  route_id_update?: number;
  country_name?: string;
  region_name?: string;
  route_name?: string;
  client_type_name?: string;
  balance?: number;
  status?: number;
  created_at: string;
  updated_at: string;
}

interface InactiveClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InactiveClientsModal: React.FC<InactiveClientsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<InactiveClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<InactiveClient | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingClient, setDeletingClient] = useState<InactiveClient | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchInactiveClients();
    }
  }, [isOpen]);

  const fetchInactiveClients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the clientService to fetch inactive clients
      const inactiveClients = await clientService.getInactiveClients();
      setClients(inactiveClients);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inactive clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewClient = (clientId: number) => {
    navigate(`/dashboard/clients/${clientId}`);
    onClose();
  };

  const handleEditClient = (client: InactiveClient) => {
    setEditingClient(client);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    // Refresh the inactive clients list
    fetchInactiveClients();
  };

  const handleDeleteClient = (client: InactiveClient) => {
    setDeletingClient(client);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClient) return;

    try {
      await clientService.deleteClient(deletingClient.id);
      // Refresh the inactive clients list
      fetchInactiveClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <h3 className="text-xl font-semibold text-gray-900">
              Inactive Clients (Status: 0)
            </h3>
            <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {clients.length} clients
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading inactive clients...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                <p className="text-lg font-semibold">Error</p>
                <p>{error}</p>
              </div>
              <button
                onClick={fetchInactiveClients}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                <p className="text-lg font-semibold">No Inactive Clients</p>
                <p className="text-sm">All clients are currently active.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit Limit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Terms
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {client.name || client.company_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {client.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {client.email || 'No email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {client.address || 'No address'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          <div>{client.country_name || '-'}</div>
                          <div className="text-xs">{client.region_name || '-'}</div>
                          <div className="text-xs">{client.route_name || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {client.client_type_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                        {client.credit_limit !== undefined && client.credit_limit !== null && !isNaN(Number(client.credit_limit))
                          ? Number(client.credit_limit).toLocaleString(undefined, { style: 'currency', currency: 'KES' })
                          : 'KES 0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-semibold">
                        {client.payment_terms || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                        {client.balance !== undefined && client.balance !== null && !isNaN(Number(client.balance))
                          ? Number(client.balance).toLocaleString(undefined, { style: 'currency', currency: 'KES' })
                          : 'KES 0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Inactive
                          </span>
                          <button
                            onClick={async () => {
                              try {
                                await clientService.updateClient(client.id, { status: 1 });
                                // Refresh the list
                                fetchInactiveClients();
                              } catch (error) {
                                console.error('Failed to update status:', error);
                              }
                            }}
                            className="text-xs text-green-600 hover:text-green-800 underline cursor-pointer"
                          >
                            Activate Client
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditClient(client)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleViewClient(client.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {clients.length} inactive client{clients.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Edit Client Modal */}
      <EditClientModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingClient(null);
        }}
        client={editingClient}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingClient(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Client"
        message="This will permanently remove the client from the system."
        itemName={deletingClient?.name || deletingClient?.company_name || 'this client'}
      />
    </div>
  );
};

export default InactiveClientsModal;
