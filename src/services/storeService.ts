import api from './api';
import { 
  Store, 
  StoreInventory, 
  StoreInventorySummary, 
  InventoryReceipt,
  ApiResponse 
} from '../types/financial';

export interface StockSummaryData {
  stores: Store[];
  products: {
    id: number;
    product_name: string;
    product_code: string;
    category?: string;
    reorder_level?: number;
    store_quantities: { [storeId: number]: number };
  }[];
}

export const storeService = {
  // Get all stores
  getAllStores: async (): Promise<ApiResponse<Store[]>> => {
    const response = await api.get('/financial/stores');
    return response.data;
  },

  // Get store by ID
  getStoreById: async (id: number): Promise<ApiResponse<Store>> => {
    const response = await api.get(`/financial/stores/${id}`);
    return response.data;
  },

  // Get store inventory
  getStoreInventory: async (storeId: number): Promise<ApiResponse<StoreInventory[]>> => {
    const response = await api.get(`/financial/stores/${storeId}/inventory`);
    return response.data;
  },

  // Get all stores inventory
  getAllStoresInventory: async (): Promise<ApiResponse<StoreInventory[]>> => {
    const response = await api.get('/financial/stores-inventory');
    return response.data;
  },

  // Get inventory summary by store
  getInventorySummaryByStore: async (): Promise<ApiResponse<StoreInventorySummary[]>> => {
    const response = await api.get('/financial/inventory-summary');
    return response.data;
  },

  // Get stock summary for all products across all stores
  getStockSummary: async (): Promise<ApiResponse<StockSummaryData>> => {
    const response = await api.get('/financial/stock-summary');
    return response.data;
  },

  // Get in-transit products
  getInTransitProducts: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/financial/inventory/in-transit');
    return response.data;
  },

  // Update stock quantity
  updateStockQuantity: async (data: {
    store_id: number;
    product_id: number;
    new_quantity: number;
    reason?: string;
    staff_id?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/financial/stores/update-stock-quantity', data);
    return response.data;
  }
}; 