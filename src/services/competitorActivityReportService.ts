import axios from 'axios';

export interface CompetitorActivityReport {
  id: number;
  outlet: string;
  outlet_id: number;
  merchandiser: number;
  competing_product: string;
  mechanism: string;
  product_id: number;
  zuri_product: string;
  image_name?: string;
  date: string;
  reportId: number | null;
  competitor_company?: string;
  outletName?: string;
  regionName?: string;
  outletTypeName?: string;
  outletAccountName?: string;
  merchandiserName?: string;
}

export interface CompetitorActivityReportFilters {
  startDate?: string;
  endDate?: string;
  currentDate?: string;
  outlet?: string;
  merchandiser?: string;
  competingProduct?: string;
  zuriProduct?: string;
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CompetitorActivityReportResponse {
  success: boolean;
  data: CompetitorActivityReport[];
  pagination: PaginationInfo;
}

const API_BASE_URL = '/api';

export const competitorActivityReportService = {
  getAll: async (filters?: CompetitorActivityReportFilters & { page?: number; limit?: number }): Promise<CompetitorActivityReportResponse> => {
    try {
      const params = new URLSearchParams();
      
      // Add provided filters
      if (filters?.currentDate) params.append('currentDate', filters.currentDate);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.outlet) params.append('outlet', filters.outlet);
      if (filters?.merchandiser) params.append('merchandiser', filters.merchandiser);
      if (filters?.competingProduct) params.append('competingProduct', filters.competingProduct);
      if (filters?.zuriProduct) params.append('zuriProduct', filters.zuriProduct);
      if (filters?.search) params.append('search', filters.search);
      
      // Add pagination parameters
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await axios.get(`${API_BASE_URL}/competitor-activity-reports?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching competitor activity reports:', error);
      throw error;
    }
  },

  getOutlets: async (): Promise<{ id: number; name: string }[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitor-activity-reports/outlets`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching outlets:', error);
      throw error;
    }
  },

  getMerchandisers: async (): Promise<{ id: number; name: string }[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/competitor-activity-reports/merchandisers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching merchandisers:', error);
      throw error;
    }
  },

  exportToCSV: async (filters?: CompetitorActivityReportFilters): Promise<void> => {
    try {
      const params = new URLSearchParams();
      
      // Add provided filters
      if (filters?.currentDate) params.append('currentDate', filters.currentDate);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.outlet) params.append('outlet', filters.outlet);
      if (filters?.merchandiser) params.append('merchandiser', filters.merchandiser);
      if (filters?.competingProduct) params.append('competingProduct', filters.competingProduct);
      if (filters?.zuriProduct) params.append('zuriProduct', filters.zuriProduct);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await axios.get(`${API_BASE_URL}/competitor-activity-reports/export?${params.toString()}`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `competitor-activity-reports-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting competitor activity reports:', error);
      throw error;
    }
  },
};
