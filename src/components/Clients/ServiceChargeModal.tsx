import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import serviceChargeService from '../../services/serviceChargeService';
import { serviceTypeService, ServiceType } from '../../services/serviceTypeService';

interface ServiceChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  editingCharge: ServiceCharge | null;
  onSuccess: () => void;
}

const ServiceChargeModal: React.FC<ServiceChargeModalProps> = ({
  isOpen,
  onClose,
  clientId,
  editingCharge,
  onSuccess
}) => {
  const [formData, setFormData] = useState<{
    service_type_id: string;
    price: string;
  }>({
    service_type_id: editingCharge?.service_type_id.toString() || '',
    price: editingCharge?.price.toString() || ''
  });
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const types = await serviceTypeService.getServiceTypes();
        setServiceTypes(types);
      } catch (error) {
        console.error('Error fetching service types:', error);
        setError('Failed to load service types');
      }
    };

    if (isOpen) {
      fetchServiceTypes();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate form data
      if (!formData.service_type_id || !formData.price) {
        throw new Error('Please fill in all fields');
      }

      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price');
      }

      const data = {
        service_type_id: Number(formData.service_type_id),
        price: price
      };

      console.log('Submitting service charge data:', data);

      if (editingCharge) {
        await serviceChargeService.updateServiceCharge(clientId, editingCharge.id, data);
      } else {
        await serviceChargeService.createServiceCharge(clientId, data);
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error submitting service charge:', error);
      // Display the specific error message from the server
      setError(error.response?.data?.message || error.message || 'Failed to save service charge');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {editingCharge ? 'Edit Service Charge' : 'Add Service Charge'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Service Type
            </label>
            <select
              value={formData.service_type_id}
              onChange={(e) => setFormData({ ...formData, service_type_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select a service type</option>
              {serviceTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingCharge ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceChargeModal; 