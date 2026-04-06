import axios from 'axios';

export interface PromotionsReport {
  id: number;
  user_name: string;
  user_id: string;
  admin_id: string;
  outlet_id: string;
  appoint_id: string;
  product: string;
  activation_type: 'Price off' | 'Sampling' | 'BOGO';
  qty_samples_given: number;
  qty_before: number;
  qty_after: number;
  comment: string;
  created_at: string;
  outletName?: string;
  salesRepName?: string;
}

export interface PromotionsReportFilters {
  startDate?: string;
  endDate?: string;
  currentDate?: string;
  outlet?: string;
  salesRep?: string;
  activationType?: string;
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PromotionsReportResponse {
  success: boolean;
  data: PromotionsReport[];
  pagination: PaginationInfo;
}

const API_BASE_URL = '/api';

export const promotionsReportService = {
  getAll: async (filters?: PromotionsReportFilters & { page?: number; limit?: number }): Promise<PromotionsReportResponse> => {
    const params = new URLSearchParams();

    if (filters?.currentDate) params.append('currentDate', filters.currentDate);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.outlet) params.append('outlet', filters.outlet);
    if (filters?.salesRep) params.append('salesRep', filters.salesRep);
    if (filters?.activationType) params.append('activationType', filters.activationType);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await axios.get(`${API_BASE_URL}/promotions-reports?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    return response.data;
  },

  getOutlets: async (): Promise<{ id: number; name: string }[]> => {
    const response = await axios.get(`${API_BASE_URL}/promotions-reports/outlets`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data.data || response.data;
  },

  getSalesReps: async (): Promise<{ id: number; name: string }[]> => {
    const response = await axios.get(`${API_BASE_URL}/promotions-reports/sales-reps`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data.data || response.data;
  }
};
