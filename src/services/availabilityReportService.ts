import axios from 'axios';

export interface AvailabilityReport {
  id: number;
  reportId: number;
  productName: string;
  quantity: number;
  comment: string;
  createdAt: string;
  clientId: number;
  userId: number;
  productId: number;
  clientName?: string;
  countryName?: string;
  salesRepName?: string;
  categoryId?: number;
  categoryName?: string;
  categoryOrder?: number;
}

export interface AvailabilityReportFilters {
  outlet?: string;
  comment?: string;
  country?: string;
  salesRep?: string;
  productSku?: string;
  startDate?: string;
  endDate?: string;
}

export interface AvailabilityReportResponse {
  reports: AvailabilityReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

import { API_BASE_URL } from '../config/api';

export const availabilityReportService = {
  async getAvailabilityReports(
    filters: AvailabilityReportFilters = {},
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<AvailabilityReportResponse> {
    const params = new URLSearchParams();
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });
    
    // Add pagination
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    // Add search
    if (search) {
      params.append('search', search);
    }
    
    const response = await axios.get(`${API_BASE_URL}/availability-reports?${params}`);
    return response.data;
  },

  async getAvailabilityCountries(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/availability-countries`);
    return response.data;
  },

  async getAvailabilitySalesReps(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/availability-sales-reps`);
    return response.data;
  },

  async getAvailabilitySkus(): Promise<string[]> {
    const response = await axios.get(`${API_BASE_URL}/availability-reports/skus`);
    return response.data;
  },

  async exportAvailabilityReports(
    filters: AvailabilityReportFilters = {},
    search?: string
  ): Promise<Blob> {
    const params = new URLSearchParams();
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });
    
    // Add search
    if (search) {
      params.append('search', search);
    }
    
    const response = await axios.get(`${API_BASE_URL}/availability-reports/export?${params}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}; 