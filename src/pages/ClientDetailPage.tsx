import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService, Client } from '../services/clientService';
import { Branch, getBranches, deleteBranch } from '../services/branchService';
import serviceChargeService from '../services/serviceChargeService';
import { Building2, Plus, Pencil, Trash2, Truck } from 'lucide-react';
import BranchModal from '../components/Clients/BranchModal';
import ServiceChargeModal from '../components/Clients/ServiceChargeModal';

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isServiceChargeModalOpen, setIsServiceChargeModalOpen] = useState(false);
  const [editingServiceCharge, setEditingServiceCharge] = useState<ServiceCharge | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [clientData, branchesData, serviceChargesData] = await Promise.all([
        clientService.getClient(id),
        getBranches(id),
        serviceChargeService.getServiceCharges(Number(id))
      ]);
      setClient(clientData);
      setBranches(branchesData);
      setServiceCharges(serviceChargesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddBranch = () => {
    setSelectedBranch(null);
    setIsBranchModalOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsBranchModalOpen(true);
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await deleteBranch(id, branchId);
        setBranches(branches.filter(b => b.id !== branchId));
      } catch (err: any) {
        setError(err.message || 'Failed to delete branch');
      }
    }
  };

  const handleAddServiceCharge = () => {
    setEditingServiceCharge(null);
    setIsServiceChargeModalOpen(true);
  };

  const handleEditServiceCharge = (charge: ServiceCharge) => {
    setEditingServiceCharge(charge);
    setIsServiceChargeModalOpen(true);
  };

  const handleDeleteServiceCharge = async (chargeId: number) => {
    if (window.confirm('Are you sure you want to delete this service charge?')) {
      try {
        await serviceChargeService.deleteServiceCharge(Number(id), chargeId);
        setServiceCharges(serviceCharges.filter(charge => charge.id !== chargeId));
      } catch (error) {
        console.error('Error deleting service charge:', error);
      }
    }
  };

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
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error</p>
          <p>{error}</p>
          <button
            onClick={() => navigate('/dashboard/clients-list')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
          <p className="text-lg font-semibold">Client not found</p>
          <button
            onClick={() => navigate('/dashboard/clients-list')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <button
            onClick={() => navigate('/dashboard/clients-list')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            Back to Clients
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{client.name}</h1>
          <p className="mt-2 text-sm text-gray-700">
            Account Number: {client.account_number}
          </p>
        </div>
      </div>

      {/* Branches Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Branches</h2>
          <button
            onClick={handleAddBranch}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </button>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {branches.map(branch => (
            <li key={branch.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                  <p className="text-sm text-gray-500">{branch.address}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditBranch(branch)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBranch(branch.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
          {branches.length === 0 && (
            <li className="px-6 py-4 text-center text-sm text-gray-500">
              No branches found
            </li>
          )}
        </ul>
      </div>

      {/* Service Charges Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Service Charges</h2>
          <button
            onClick={handleAddServiceCharge}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service Charge
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serviceCharges.map((charge) => (
                <tr key={charge.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {charge.service_type_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Number(charge.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditServiceCharge(charge)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteServiceCharge(charge.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch Modal */}
      {isBranchModalOpen && (
        <BranchModal
          isOpen={isBranchModalOpen}
          onClose={() => setIsBranchModalOpen(false)}
          clientId={id}
          branch={selectedBranch}
          onSuccess={(branch) => {
            if (selectedBranch) {
              setBranches(branches.map(b => b.id === branch.id ? branch : b));
            } else {
              setBranches([...branches, branch]);
            }
            setIsBranchModalOpen(false);
          }}
        />
      )}

      {/* Service Charge Modal */}
      {isServiceChargeModalOpen && (
        <ServiceChargeModal
          isOpen={isServiceChargeModalOpen}
          onClose={() => setIsServiceChargeModalOpen(false)}
          clientId={id}
          editingCharge={editingServiceCharge}
          onSuccess={fetchData}
        />
      )}

      <button
        onClick={() => navigate(`/dashboard/clients/${id}/service-requests`)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <Truck className="h-4 w-4 mr-2" />
        Service Requests
      </button>
    </div>
  );
};

export default ClientDetailPage;