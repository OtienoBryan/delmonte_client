import axios from 'axios';
import { Merchandise, MerchandiseCategory, MerchandiseStock, MerchandiseStockReceipt, MerchandiseLedger, ApiResponse, PaginatedResponse, MerchandiseAssignment, CreateMerchandiseAssignment } from '../types/financial';
import { API_BASE_URL } from '../config/api';

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Merchandise Categories Service
export const merchandiseCategoriesService = {
  getAll: async (): Promise<ApiResponse<MerchandiseCategory[]>> => {
    const response = await axios.get(`${API_BASE_URL}/merchandise/categories`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<MerchandiseCategory>> => {
    const response = await axios.get(`${API_BASE_URL}/merchandise/categories/${id}`);
    return response.data;
  },

  create: async (category: Partial<MerchandiseCategory>): Promise<ApiResponse<MerchandiseCategory>> => {
    const response = await axios.post(`${API_BASE_URL}/merchandise/categories`, category);
    return response.data;
  },

  update: async (id: number, category: Partial<MerchandiseCategory>): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/merchandise/categories/${id}`, category);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/merchandise/categories/${id}`);
    return response.data;
  }
};

// Merchandise Service
export const merchandiseService = {
  getAll: async (page = 1, limit = 10, search = '', categoryId?: number): Promise<PaginatedResponse<Merchandise>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(categoryId && { category_id: categoryId.toString() })
    });
    const response = await axios.get(`${API_BASE_URL}/merchandise?${params}`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Merchandise>> => {
    const response = await axios.get(`${API_BASE_URL}/merchandise/${id}`);
    return response.data;
  },

  create: async (merchandise: Partial<Merchandise>): Promise<ApiResponse<Merchandise>> => {
    const response = await axios.post(`${API_BASE_URL}/merchandise`, merchandise);
    return response.data;
  },

  update: async (id: number, merchandise: Partial<Merchandise>): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/merchandise/${id}`, merchandise);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/merchandise/${id}`);
    return response.data;
  },

  // Stock operations
  addStock: async (stockData: Partial<MerchandiseStock>): Promise<ApiResponse<MerchandiseStock>> => {
    const response = await axios.post(`${API_BASE_URL}/merchandise/stock`, stockData);
    return response.data;
  },

  addBulkStock: async (receiptData: MerchandiseStockReceipt): Promise<ApiResponse<MerchandiseStock[]>> => {
    const response = await axios.post(`${API_BASE_URL}/merchandise/stock/bulk`, receiptData);
    return response.data;
  },

  getStockHistory: async (merchandiseId?: number): Promise<ApiResponse<MerchandiseStock[]>> => {
    const params = merchandiseId ? `?merchandise_id=${merchandiseId}` : '';
    const response = await axios.get(`${API_BASE_URL}/merchandise/stock${params}`);
    return response.data;
  },

  getCurrentStock: async (merchandiseId?: number, storeId?: number): Promise<ApiResponse<{ merchandise_id: number; store_id: number; quantity: number; merchandise_name: string; store_name: string }[]>> => {
    const params = new URLSearchParams();
    if (merchandiseId) params.append('merchandise_id', merchandiseId.toString());
    if (storeId) params.append('store_id', storeId.toString());
    const response = await axios.get(`${API_BASE_URL}/merchandise/stock/current?${params}`);
    return response.data;
  },

  getLedger: async (merchandiseId?: number, storeId?: number): Promise<ApiResponse<MerchandiseLedger[]>> => {
    const params = new URLSearchParams();
    if (merchandiseId) params.append('merchandise_id', merchandiseId.toString());
    if (storeId) params.append('store_id', storeId.toString());
    const response = await axios.get(`${API_BASE_URL}/merchandise/ledger?${params}`);
    return response.data;
  },

  // Merchandise Assignment methods
  getAssignments: async (): Promise<ApiResponse<MerchandiseAssignment[]>> => {
    const response = await axios.get(`${API_BASE_URL}/merchandise/assignments`);
    return response.data;
  },

  createAssignment: async (assignment: CreateMerchandiseAssignment): Promise<ApiResponse<MerchandiseAssignment>> => {
    const response = await axios.post(`${API_BASE_URL}/merchandise/assignments`, assignment);
    return response.data;
  },

  updateAssignment: async (id: number, assignment: Partial<CreateMerchandiseAssignment>): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/merchandise/assignments/${id}`, assignment);
    return response.data;
  },

  deleteAssignment: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/merchandise/assignments/${id}`);
    return response.data;
  }
};
