import api from './api';

export interface ServiceCharge {
  id: number;
  client_id: number;
  service_type_id: number;
  price: number;
  service_type_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceChargeData {
  service_type_id: number;
  price: number;
}

const serviceChargeService = {
  getServiceCharges: async (clientId: number): Promise<ServiceCharge[]> => {
    try {
      const response = await api.get(`/clients/${clientId}/service-charges`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service charges:', error);
      throw error;
    }
  },

  createServiceCharge: async (clientId: number, data: CreateServiceChargeData): Promise<ServiceCharge> => {
    try {
      console.log('Creating service charge with data:', { clientId, data });
      const response = await api.post(`/clients/${clientId}/service-charges`, data);
      console.log('Service charge created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating service charge:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create service charge');
    }
  },

  updateServiceCharge: async (clientId: number, chargeId: number, data: CreateServiceChargeData): Promise<ServiceCharge> => {
    try {
      const response = await api.put(`/clients/${clientId}/service-charges/${chargeId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating service charge:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update service charge');
    }
  },

  deleteServiceCharge: async (clientId: number, chargeId: number): Promise<void> => {
    try {
      await api.delete(`/clients/${clientId}/service-charges/${chargeId}`);
    } catch (error: any) {
      console.error('Error deleting service charge:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to delete service charge');
    }
  }
};

export default serviceChargeService; 