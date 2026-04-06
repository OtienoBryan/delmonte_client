import axios from 'axios';

export interface SosReport {
  id: number;
  rep_id: number;
  appoint_id: number;
  outlet_id: number;
  brand_id: number;
  brand_name: string;
  brand_facings: number;
  total_facings: number;
  sos: number;
  outlet_target: number;
  comment: string;
  date: string;
  outletName?: string;
  repName?: string;
  outletAccountName?: string;
}

export interface SosReportFilters {
  startDate?: string;
  endDate?: string;
  currentDate?: string;
  outlet?: string;
  rep?: string;
  brand?: string;
   outletAccount?: string;
   targetStatus?: string;
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SosReportResponse {
  success: boolean;
  data: SosReport[];
  pagination: PaginationInfo;
}

const API_BASE_URL = '/api';

export const sosReportService = {
  getAll: async (
    filters?: SosReportFilters & { page?: number; limit?: number },
  ): Promise<SosReportResponse> => {
    const params = new URLSearchParams();

    if (filters?.currentDate) params.append('currentDate', filters.currentDate);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.outlet) params.append('outlet', filters.outlet);
    if (filters?.rep) params.append('rep', filters.rep);
    if (filters?.brand) params.append('brand', filters.brand);
    if (filters?.outletAccount) params.append('outletAccount', filters.outletAccount);
    if (filters?.targetStatus) params.append('targetStatus', filters.targetStatus);
    if (filters?.search) params.append('search', filters.search);

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await axios.get(
      `${API_BASE_URL}/sos-reports?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      },
    );

    return response.data;
  },

  getOutlets: async (): Promise<{ id: number; name: string }[]> => {
    const response = await axios.get(`${API_BASE_URL}/sos-reports/outlets`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data.data || response.data;
  },

  getReps: async (): Promise<{ id: number; name: string }[]> => {
    const response = await axios.get(`${API_BASE_URL}/sos-reports/reps`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data.data || response.data;
  },

  getOutletAccounts: async (): Promise<{ id: number; name: string }[]> => {
    const response = await axios.get(`${API_BASE_URL}/sos-reports/outlet-accounts`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data.data || response.data;
  },

  exportToCSV: async (filters?: SosReportFilters): Promise<void> => {
    const params = new URLSearchParams();

    if (filters?.currentDate) params.append('currentDate', filters.currentDate);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.outlet) params.append('outlet', filters.outlet);
    if (filters?.rep) params.append('rep', filters.rep);
    if (filters?.brand) params.append('brand', filters.brand);
    if (filters?.outletAccount) params.append('outletAccount', filters.outletAccount);
    if (filters?.targetStatus) params.append('targetStatus', filters.targetStatus);
    if (filters?.search) params.append('search', filters.search);

    const response = await axios.get(
      `${API_BASE_URL}/sos-reports/export?${params.toString()}`,
      {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      },
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `sos-reports-${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

