import axios from 'axios';

export interface BrandSosTarget {
  id: number;
  outlet_account_id: number;
  brand_id: number;
  target_percentage: number;
  brand_name?: string;
  outlet_account_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BrandSosTargetFilters {
  outlet_account_id?: number;
  brand_id?: number;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BrandSosTargetResponse {
  success: boolean;
  data: BrandSosTarget[];
  pagination: PaginationInfo;
}

const API_BASE_URL = '/api/brand-sos-targets';

export const brandSosTargetService = {
  /**
   * Get all brand SOS targets with optional filters
   */
  getAll: async (filters?: BrandSosTargetFilters): Promise<BrandSosTargetResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.outlet_account_id) {
      params.append('outlet_account_id', filters.outlet_account_id.toString());
    }
    if (filters?.brand_id) {
      params.append('brand_id', filters.brand_id.toString());
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    
    const response = await axios.get(`${API_BASE_URL}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.data;
  },

  /**
   * Get brand SOS targets for a specific outlet account
   */
  getByOutletAccount: async (outletAccountId: number): Promise<{ success: boolean; data: BrandSosTarget[] }> => {
    const response = await axios.get(`${API_BASE_URL}/outlet-account/${outletAccountId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.data;
  },

  /**
   * Create or update a brand SOS target
   */
  setTarget: async (outlet_account_id: number, brand_id: number, target_percentage: number): Promise<{ success: boolean; data: BrandSosTarget; message: string }> => {
    const response = await axios.post(API_BASE_URL, {
      outlet_account_id,
      brand_id,
      target_percentage
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.data;
  },

  /**
   * Delete a brand SOS target
   */
  deleteTarget: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`${API_BASE_URL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.data;
  }
};
