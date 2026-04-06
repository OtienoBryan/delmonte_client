import axios from 'axios';

export interface PriceComplianceReport {
  id: number;
  rep_id: number;
  outlet_id: number;
  outlet_name: string;
  product_id: number;
  product_name: string;
  rrp: number;
  shelf_price: number;
  comment: string;
  price_correct: string;
  promotion: string;
  date: string;
  appoint_id: number;
  outletName?: string;
  salesRepName?: string;
}

export interface PriceComplianceReportFilters {
  startDate?: string;
  endDate?: string;
  currentDate?: string;
  outlet?: string;
  salesRep?: string;
  product?: string;
  priceCorrect?: string;
  promotion?: string;
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PriceComplianceReportResponse {
  success: boolean;
  data: PriceComplianceReport[];
  pagination: PaginationInfo;
}

const API_BASE_URL = '/api';

export const priceComplianceReportService = {
  getAll: async (filters?: PriceComplianceReportFilters & { page?: number; limit?: number }): Promise<PriceComplianceReportResponse> => {
    try {
      const params = new URLSearchParams();
      
      // Add provided filters
      if (filters?.currentDate) params.append('currentDate', filters.currentDate);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.outlet) params.append('outlet', filters.outlet);
      if (filters?.salesRep) params.append('salesRep', filters.salesRep);
      if (filters?.product) params.append('product', filters.product);
      if (filters?.priceCorrect) params.append('priceCorrect', filters.priceCorrect);
      if (filters?.promotion) params.append('promotion', filters.promotion);
      if (filters?.search) params.append('search', filters.search);
      
      // Add pagination parameters
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await axios.get(`${API_BASE_URL}/price-compliance-reports?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching price compliance reports:', error);
      throw error;
    }
  },

  getOutlets: async (): Promise<{ id: number; name: string }[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/price-compliance-reports/outlets`, {
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
      const response = await axios.get(`${API_BASE_URL}/price-compliance-reports/sales-reps`, {
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

  exportToCSV: async (filters?: PriceComplianceReportFilters): Promise<void> => {
    try {
      const params = new URLSearchParams();
      
      // Add provided filters
      if (filters?.currentDate) params.append('currentDate', filters.currentDate);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.outlet) params.append('outlet', filters.outlet);
      if (filters?.salesRep) params.append('salesRep', filters.salesRep);
      if (filters?.product) params.append('product', filters.product);
      if (filters?.priceCorrect) params.append('priceCorrect', filters.priceCorrect);
      if (filters?.promotion) params.append('promotion', filters.promotion);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await axios.get(`${API_BASE_URL}/price-compliance-reports/export?${params.toString()}`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `price-compliance-reports-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting price compliance reports:', error);
      throw error;
    }
  },
};
