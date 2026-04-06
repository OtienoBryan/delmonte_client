import api from './api';

export interface ServiceType {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const serviceTypeService = {
  getServiceTypes: async (): Promise<ServiceType[]> => {
    try {
      const response = await api.get('/service-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching service types:', error);
      throw error;
    }
  },
}; 