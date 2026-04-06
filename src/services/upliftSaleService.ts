import { API_CONFIG } from '../config/api';
import { UpliftSale, UpliftSaleItem, OutletAccount, SalesRep, ApiResponse, PaginatedResponse } from '../types/financial';

export const upliftSaleService = {
  // Get all uplift sales with pagination and filters
  async getUpliftSales(params?: {
    page?: number;
    limit?: number;
    status?: string;
    clientId?: number;
    userId?: number;
    outletAccountId?: number;
    salesRepId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<PaginatedResponse<UpliftSale>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.clientId) queryParams.append('clientId', params.clientId.toString());
    if (params?.userId) queryParams.append('userId', params.userId.toString());
    if (params?.outletAccountId) queryParams.append('outletAccountId', params.outletAccountId.toString());
    if (params?.salesRepId) queryParams.append('salesRepId', params.salesRepId.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.search) queryParams.append('search', params.search);

    const url = API_CONFIG.getUrl('/uplift-sales') + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get a single uplift sale by ID
  async getUpliftSale(id: number): Promise<ApiResponse<UpliftSale>> {
    const url = API_CONFIG.getUrl(`/uplift-sales/${id}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Create a new uplift sale
  async createUpliftSale(data: {
    clientId: number;
    userId: number;
    totalAmount: number;
    status?: 'pending' | 'approved' | 'rejected' | 'completed';
  }): Promise<ApiResponse<UpliftSale>> {
    const url = API_CONFIG.getUrl('/uplift-sales');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Update an uplift sale
  async updateUpliftSale(id: number, data: {
    status?: 'pending' | 'approved' | 'rejected' | 'completed';
    totalAmount?: number;
  }): Promise<ApiResponse<UpliftSale>> {
    const url = API_CONFIG.getUrl(`/uplift-sales/${id}`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Delete an uplift sale
  async deleteUpliftSale(id: number): Promise<ApiResponse<void>> {
    const url = API_CONFIG.getUrl(`/uplift-sales/${id}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get uplift sales summary/statistics
  async getUpliftSalesSummary(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<ApiResponse<{
    totalSales: number;
    totalAmount: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    completedCount: number;
  }>> {
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.status) queryParams.append('status', params.status);

    const url = API_CONFIG.getUrl('/uplift-sales/summary') + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get uplift sale items by uplift sale ID
  async getUpliftSaleItems(upliftSaleId: number): Promise<ApiResponse<UpliftSaleItem[]>> {
    const url = API_CONFIG.getUrl(`/uplift-sales/${upliftSaleId}/items`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Create uplift sale item
  async createUpliftSaleItem(upliftSaleId: number, data: {
    productId: number;
    quantity: number;
    unitPrice: number;
  }): Promise<ApiResponse<UpliftSaleItem>> {
    const url = API_CONFIG.getUrl(`/uplift-sales/${upliftSaleId}/items`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Update uplift sale item
  async updateUpliftSaleItem(upliftSaleId: number, itemId: number, data: {
    quantity?: number;
    unitPrice?: number;
  }): Promise<ApiResponse<UpliftSaleItem>> {
    const url = API_CONFIG.getUrl(`/uplift-sales/${upliftSaleId}/items/${itemId}`);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Delete uplift sale item
  async deleteUpliftSaleItem(upliftSaleId: number, itemId: number): Promise<ApiResponse<void>> {
    const url = API_CONFIG.getUrl(`/uplift-sales/${upliftSaleId}/items/${itemId}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get outlet accounts
  async getOutletAccounts(): Promise<ApiResponse<OutletAccount[]>> {
    const url = API_CONFIG.getUrl('/uplift-sales/outlet-accounts');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get sales reps
  async getSalesReps(): Promise<ApiResponse<SalesRep[]>> {
    const url = API_CONFIG.getUrl('/uplift-sales/sales-reps');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};
