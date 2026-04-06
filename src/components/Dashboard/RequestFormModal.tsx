import React, { useState, useEffect } from 'react';
import { branchService } from '../../services/branchService';
import { serviceTypeService } from '../../services/serviceTypeService';

interface RequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const RequestFormModal: React.FC<RequestFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    branch_id: '',
    service_type_id: '',
    pickup_location: '',
    dropoff_location: '',
    pickup_date: '',
    pickup_time: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch branches and service types in parallel
      const [branchesData, serviceTypesData] = await Promise.all([
        branchService.getBranches(),
        serviceTypeService.getServiceTypes()
      ]);

      if (!branchesData || !serviceTypesData) {
        throw new Error('Failed to fetch data');
      }

      setBranches(branchesData);
      setServiceTypes(serviceTypesData);

      // If we have initialData, set the form data
      if (initialData) {
        setFormData({
          branch_id: initialData.branch_id,
          service_type_id: initialData.service_type_id,
          pickup_location: initialData.pickup_location,
          dropoff_location: initialData.dropoff_location,
          pickup_date: initialData.pickup_date,
          pickup_time: initialData.pickup_time
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // ... rest of the component ...
};

export default RequestFormModal;