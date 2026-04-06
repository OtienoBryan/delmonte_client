import axios from 'axios';

export interface MyVisibilityReport {
  id: number;
  reportId: number;
  outletName?: string;
  companyName?: string;
  country?: string;
  salesRep?: string;
  comment: string;
  imageUrl: string;
  createdAt: string;
  clientId: number;
  userId: number;
  photoType?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface MyVisibilityReportResponse {
  success: boolean;
  data: MyVisibilityReport[];
  pagination: PaginationInfo;
}

export interface FilterOptions {
  outlets: string[];
  countries: string[];
  salesReps: string[];
  photoTypes: string[];
}

export interface GetReportsParams {
  page?: number;
  limit?: number;
  search?: string;
  outlet?: string;
  country?: string;
  salesRep?: string;
  photoType?: string;
  startDate?: string;
  endDate?: string;
}

const API_BASE_URL = '/api';

export const myVisibilityReportService = {
  getAll: async (params: GetReportsParams = {}): Promise<MyVisibilityReportResponse> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.outlet) queryParams.append('outlet', params.outlet);
      if (params.country) queryParams.append('country', params.country);
      if (params.salesRep) queryParams.append('salesRep', params.salesRep);
      if (params.photoType) queryParams.append('photoType', params.photoType);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const url = `${API_BASE_URL}/my-visibility-reports${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching my visibility reports:', error);
      throw error;
    }
  },

  getFilterOptions: async (): Promise<FilterOptions> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/my-visibility-reports/filter-options`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  },
}; 