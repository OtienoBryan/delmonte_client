import axios from 'axios';

export interface VisibilityReport {
  id: number;
  reportId: number;
  outlet: string;
  country: string;
  salesRep: string;
  comment: string;
  imageUrl: string;
  createdAt: string;
  clientId?: number;
  userId?: number;
}

export interface VisibilityReportFilters {
  startDate?: string;
  endDate?: string;
  currentDate?: string;
  page?: number;
  limit?: number;
  country?: string;
  salesRep?: string;
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VisibilityReportResponse {
  data: VisibilityReport[];
  pagination: PaginationInfo;
}

export interface Country {
  id: number;
  name: string;
}

export interface SalesRep {
  id: number;
  name: string;
}

const API_BASE_URL = '/api';

export const visibilityReportService = {
  getAll: async (p0: { page: number; limit: number; startDate?: string; endDate?: string; currentDate?: string; country?: string; salesRep?: string; search?: string; }): Promise<VisibilityReportResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/visibility-reports`);
      return response.data;
    } catch (error) {
      console.error('Error fetching visibility reports:', error);
      throw error;
    }
  },

  getCountries: async (): Promise<Country[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/countries`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  },

  getSalesReps: async (): Promise<SalesRep[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sales-reps?status=1`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching sales reps:', error);
      throw error;
    }
  },

  exportToCSV: async (filters?: VisibilityReportFilters): Promise<void> => {
    try {
      const params = new URLSearchParams();
      
      // Add provided filters
      if (filters?.currentDate) params.append('currentDate', filters.currentDate);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.country) params.append('country', filters.country);
      if (filters?.salesRep) params.append('salesRep', filters.salesRep);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await axios.get(`${API_BASE_URL}/visibility-reports/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `visibility-reports-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting visibility reports:', error);
      throw error;
    }
  },
}; 