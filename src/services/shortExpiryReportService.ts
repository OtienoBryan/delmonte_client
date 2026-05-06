import axios from 'axios';

export interface ShortExpiryReport {
  id: number;
  productId: number;
  product_name: string;
  quantity: number;
  batch_number: string;
  expiry_date: string;
  createdAt: string;
  rep_id: number;
  appoint_id: number;
  outlet_id: number;
  outletName?: string;
  regionName?: string;
  outletTypeName?: string;
  outletAccountName?: string;
  salesRepName?: string;
  comment?: string;
  productSku?: string | null;
}

export interface ShortExpiryReportFilters {
  startDate?: string;
  endDate?: string;
  currentDate?: string;
  outlet?: string;
  salesRep?: string;
  productName?: string;
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ShortExpiryReportResponse {
  success: boolean;
  data: ShortExpiryReport[];
  pagination: PaginationInfo;
}

const API_BASE_URL = '/api';

export const shortExpiryReportService = {
  getAll: async (filters?: ShortExpiryReportFilters & { page?: number; limit?: number }): Promise<ShortExpiryReportResponse> => {
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
        if (filters.productName) params.append('productName', filters.productName);
        if (filters.search) params.append('search', filters.search);
      }
      
      // Add pagination parameters
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await axios.get(`${API_BASE_URL}/short-expiry-reports?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching short expiry reports:', error);
      throw error;
    }
  },

  getOutlets: async (): Promise<{ id: number; name: string }[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/short-expiry-reports/outlets`, {
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

  getSalesReps: async (): Promise<{ id: number; name: string }[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/short-expiry-reports/sales-reps`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching sales reps:', error);
      throw error;
    }
  },

  exportToCSV: async (filters?: ShortExpiryReportFilters): Promise<void> => {
    try {
      const params = new URLSearchParams();
      
      // Add provided filters
      if (filters?.currentDate) params.append('currentDate', filters.currentDate);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.outlet) params.append('outlet', filters.outlet);
      if (filters?.salesRep) params.append('salesRep', filters.salesRep);
      if (filters?.productName) params.append('productName', filters.productName);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await axios.get(`${API_BASE_URL}/short-expiry-reports/export?${params.toString()}`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `short-expiry-reports-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting short expiry reports:', error);
      throw error;
    }
  },
};
