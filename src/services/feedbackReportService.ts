import axios from 'axios';

export interface FeedbackReport {
  id: number;
  reportId: number;
  outlet: string;
  country: string;
  salesRep: string;
  comment: string;
  createdAt: string;
}

export interface FeedbackReportFilters {
  startDate?: string;
  endDate?: string;
  currentDate?: string;
  page?: number;
  limit?: number;
  outlet?: string;
  salesRep?: string;
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FeedbackReportResponse {
  data: FeedbackReport[];
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

export interface Outlet {
  id: number;
  name: string;
}

const API_BASE_URL = '/api';

export const feedbackReportService = {
  getAll: async (filters?: FeedbackReportFilters): Promise<FeedbackReportResponse> => {
    try {
      const params = new URLSearchParams();
      
      // If no filters provided, default to current date
      if (!filters || Object.keys(filters).length === 0) {
        const today = new Date().toISOString().split('T')[0];
        params.append('currentDate', today);
      } else {
        // Add provided filters
        if (filters.currentDate) params.append('currentDate', filters.currentDate);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.outlet) params.append('outlet', filters.outlet);
        if (filters.salesRep) params.append('salesRep', filters.salesRep);
        if (filters.search) params.append('search', filters.search);
      }
      
      // Add pagination parameters
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await axios.get(`${API_BASE_URL}/feedback-reports?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback reports:', error);
      throw error;
    }
  },

  getCountries: async (): Promise<Country[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/feedback-countries`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  },

  getSalesReps: async (): Promise<SalesRep[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/feedback-sales-reps`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching sales reps:', error);
      throw error;
    }
  },

  getOutlets: async (): Promise<Outlet[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/feedback-outlets`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching outlets:', error);
      throw error;
    }
  },

  exportToCSV: async (filters?: FeedbackReportFilters): Promise<void> => {
    try {
      const params = new URLSearchParams();
      
      // Add provided filters
      if (filters?.currentDate) params.append('currentDate', filters.currentDate);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.outlet) params.append('outlet', filters.outlet);
      if (filters?.salesRep) params.append('salesRep', filters.salesRep);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await axios.get(`${API_BASE_URL}/feedback-reports/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `feedback-reports-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting feedback reports:', error);
      throw error;
    }
  },
}; 