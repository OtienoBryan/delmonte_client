import api from './api';

export interface RequestData {
  id?: number;
  userId: number;
  userName: string;
  serviceTypeId: number;
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  myStatus?: number;
  teamId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Request {
  id: string;
  client_id: string;
  client_name: string;
  service_type_id: string;
  service_type_name: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  latitude: number;
  longitude: number;
  // ... other fields
}

export const requestService = {
  createRequest: async (data: RequestData): Promise<any> => {
    try {
      console.log('Creating request with data:', JSON.stringify(data, null, 2));
      const response = await api.post<any>('/requests', data);
      console.log('Request created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },

  getRequests: async (filters?: { status?: string; myStatus?: number }): Promise<RequestData[]> => {
    try {
      console.log('Fetching requests with filters:', filters);
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.myStatus !== undefined) params.append('myStatus', filters.myStatus.toString());
      
      const response = await api.get<RequestData[]>(`/requests${params.toString() ? `?${params.toString()}` : ''}`);
      console.log('Requests fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },

  updateRequest: async (requestId: string, data: Partial<RequestData>): Promise<any> => {
    try {
      console.log('Updating request:', requestId, 'with data:', JSON.stringify(data, null, 2));
      const response = await api.patch<any>(`/requests/${requestId}`, data);
      console.log('Request updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },

  getInTransitRequests: async (): Promise<Request[]> => {
    try {
      console.log('Fetching in-transit requests...'); // Debug log
      const response = await api.get<Request[]>('/requests/in-transit');
      console.log('API Response:', response.data); // Debug log
      return response.data;
    } catch (error: any) {
      console.error('Error in getInTransitRequests:', error); // Debug log
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch in-transit requests');
    }
  }
}; 