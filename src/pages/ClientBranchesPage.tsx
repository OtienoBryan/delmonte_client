import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService, Client } from '../services/clientService';
import { Branch, getBranches, deleteBranch } from '../services/branchService';
import BranchModal from '../components/Clients/BranchModal';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';

const ClientBranchesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | undefined>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientData = await clientService.getClient(id);
        setClient(clientData);
        const branchesData = await getBranches(id);
        setBranches(branchesData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddBranch = () => {
    setSelectedBranch(undefined);
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

  const handleBranchSuccess = async () => {
    try {
      const branchesData = await getBranches(id);
      setBranches(branchesData);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh branches');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!client) {
    return <div>Client not found</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <button
            onClick={() => navigate('/dashboard/clients-list')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Clients
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{client.name}</h1>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={handleAddBranch}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Branches
            </h3>
          </div>
          <div className="border-t border-gray-200">
            {branches.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No branches found
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {branches.map((branch) => (
                  <li key={branch.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                        <p className="text-sm text-gray-500">{branch.address}</p>
                        <p className="text-sm text-gray-500">
                          {branch.contact_phone && `Phone: ${branch.contact_phone}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {branch.contact_email && `Email: ${branch.contact_email}`}
                        </p>
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
              </ul>
            )}
          </div>
        </div>
      </div>

      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onSuccess={handleBranchSuccess}
        clientId={id}
        branch={selectedBranch}
      />
    </div>
  );
};

export default ClientBranchesPage; 