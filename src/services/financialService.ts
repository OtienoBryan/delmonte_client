import axios from 'axios';
import { 
  ChartOfAccount, 
  Supplier, 
  Customer, 
  Product, 
  DashboardStats,
  CreatePurchaseOrderForm,
  CreateSalesOrderForm,
  CreateReceiptForm,
  CreatePaymentForm,
  CreateJournalEntryForm,
  ApiResponse,
  PaginatedResponse,
  GeneralLedgerEntry,
  DeliveryNote,
  DeliveryNoteItem
} from '../types/financial';

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

// Chart of Accounts Service
export const chartOfAccountsService = {
  getAll: async (): Promise<ApiResponse<ChartOfAccount[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/accounts`);
    return response.data;
  },

  getAccountTypes: async (): Promise<ApiResponse<Array<{ id: number; name: string; color: string }>>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/accounts/types`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<ChartOfAccount>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/accounts/${id}`);
    return response.data;
  },

  create: async (account: Partial<ChartOfAccount>): Promise<ApiResponse<ChartOfAccount>> => {
    const response = await axios.post(`${API_BASE_URL}/financial/accounts`, account);
    return response.data;
  },

  update: async (id: number, account: Partial<ChartOfAccount>): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/financial/accounts/${id}`, account);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/financial/accounts/${id}`);
    return response.data;
  }
};

// Suppliers Service
export const suppliersService = {
  getAll: async (): Promise<ApiResponse<Supplier[]>> => {
    const response = await axios.get(`${API_BASE_URL}/suppliers`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Supplier>> => {
    const response = await axios.get(`${API_BASE_URL}/suppliers/${id}`);
    return response.data;
  },

  create: async (supplier: Partial<Supplier>): Promise<ApiResponse<Supplier>> => {
    const response = await axios.post(`${API_BASE_URL}/suppliers`, supplier);
    return response.data;
  },

  update: async (id: number, supplier: Partial<Supplier>): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/suppliers/${id}`, supplier);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/suppliers/${id}`);
    return response.data;
  }
};

// Stores Service
export const storesService = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    const response = await axios.get(`${API_BASE_URL}/stores`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/stores/${id}`);
    return response.data;
  },

  create: async (store: any): Promise<ApiResponse<any>> => {
    const response = await axios.post(`${API_BASE_URL}/stores`, store);
    return response.data;
  },

  update: async (id: number, store: any): Promise<ApiResponse<any>> => {
    const response = await axios.put(`${API_BASE_URL}/stores/${id}`, store);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/stores/${id}`);
    return response.data;
  }
};

// Customers Service
export const customersService = {
  getAll: async (): Promise<ApiResponse<Customer[]>> => {
    const response = await axios.get(`${API_BASE_URL}/clients?limit=10000`);
    return {
      success: true,
      data: response.data.data || response.data
    };
  },

  getById: async (id: number): Promise<ApiResponse<Customer>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/customers/${id}`);
    return response.data;
  },

  create: async (customer: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const response = await axios.post(`${API_BASE_URL}/financial/customers`, customer);
    return response.data;
  },

  update: async (id: number, customer: Partial<Customer>): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/financial/customers/${id}`, customer);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/financial/customers/${id}`);
    return response.data;
  }
};

// Products Service
export const productsService = {
  getAll: async (): Promise<ApiResponse<Product[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/products`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Product>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/products/${id}`);
    return response.data;
  },

  create: async (product: Partial<Product>): Promise<ApiResponse<Product>> => {
    const response = await axios.post(`${API_BASE_URL}/financial/products`, product);
    return response.data;
  },

  update: async (id: number, product: Partial<Product>): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/financial/products/${id}`, product);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/financial/products/${id}`);
    return response.data;
  },

  getLowStock: async (): Promise<ApiResponse<Product[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/products/low-stock`);
    return response.data;
  }
};

// Stock Take Items Service
export const stockTakeService = {
  getItems: async (stock_take_id: number) => {
    const response = await axios.get(`${API_BASE_URL}/financial/stock-take/${stock_take_id}/items`);
    return response.data;
  },
};

// Dashboard Service
export const dashboardService = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/dashboard/stats`);
    return response.data;
  },

  getAssets: async () => {
    const res = await axios.get(`${API_BASE_URL}/financial/assets`);
    return res.data;
  },

  getTotalAssets: async () => {
    const res = await axios.get(`${API_BASE_URL}/financial/assets`);
    if (res.data.success && Array.isArray(res.data.data)) {
      const total = res.data.data.reduce((sum: number, asset: any) => sum + Number(asset.purchase_value), 0);
      return total;
    }
    return 0;
  }
};

// Purchase Orders Service
export const purchaseOrdersService = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/purchase-orders`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/purchase-orders/${id}`);
    return response.data;
  },

  create: async (purchaseOrder: CreatePurchaseOrderForm): Promise<ApiResponse<any>> => {
    const response = await axios.post(`${API_BASE_URL}/financial/purchase-orders`, purchaseOrder);
    return response.data;
  },

  update: async (id: number, purchaseOrder: Partial<CreatePurchaseOrderForm>): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/financial/purchase-orders/${id}`, purchaseOrder);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/financial/purchase-orders/${id}`);
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<ApiResponse<any>> => {
    const response = await axios.patch(`${API_BASE_URL}/financial/purchase-orders/${id}/status`, { status });
    return response.data;
  },

  getWithReceipts: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/purchase-orders/${id}/with-receipts`);
    return response.data;
  },

  receiveItems: async (purchaseOrderId: number, data: {
    storeId: number;
    items: { product_id: number; received_quantity: number; unit_cost: number }[];
    notes?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await axios.post(`${API_BASE_URL}/financial/purchase-orders/${purchaseOrderId}/receive`, data);
    return response.data;
  }
};

// Sales Orders Service
export const salesOrdersService = {
  getAll: async (params?: { status?: string; client_id?: number }): Promise<ApiResponse<any[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/sales-orders`, { params });
    return response.data;
  },

  getAllIncludingDrafts: async (): Promise<ApiResponse<any[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/sales-orders-all`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/sales-orders/${id}`);
    return response.data;
  },

  create: async (salesOrder: CreateSalesOrderForm): Promise<ApiResponse<any>> => {
    console.log('=== SALES ORDERS SERVICE CREATE ===');
    console.log('API URL:', `${API_BASE_URL}/financial/sales-orders`);
    console.log('Request data:', JSON.stringify(salesOrder, null, 2));
    
    try {
      const response = await axios.post(`${API_BASE_URL}/financial/sales-orders`, salesOrder);
      console.log('=== API RESPONSE SUCCESS ===');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.log('=== API RESPONSE ERROR ===');
      console.log('Error:', error);
      if (error.response) {
        console.log('Error status:', error.response.status);
        console.log('Error data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  },

  update: async (id: number, salesOrder: Partial<CreateSalesOrderForm> & { my_status?: number }): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/financial/sales-orders/${id}`, salesOrder);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/financial/sales-orders/${id}`);
    return response.data;
  },

  assignRider: async (id: number, rider_id: number) => {
    const response = await axios.patch(`${API_BASE_URL}/financial/sales-orders/${id}`, { riderId: rider_id });
    return response.data;
  },
  receiveBackToStock: async (id: number) => {
    const response = await axios.post(`${API_BASE_URL}/financial/sales-orders/${id}/receive-back`);
    return response.data;
  },

  convertToInvoice: async (id: number, invoiceData: any): Promise<ApiResponse<any>> => {
    console.log('=== CONVERTING TO INVOICE ===');
    console.log('Order ID:', id);
    console.log('Invoice data:', JSON.stringify(invoiceData, null, 2));
    
    try {
      const response = await axios.post(`${API_BASE_URL}/financial/sales-orders/${id}/convert-to-invoice`, invoiceData);
      console.log('=== CONVERT TO INVOICE SUCCESS ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.log('=== CONVERT TO INVOICE ERROR ===');
      console.log('Error:', error);
      if (error.response) {
        console.log('Error status:', error.response.status);
        console.log('Error data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }
};

// Sales Order Items Service
export const salesOrderItemsService = {
  getBySalesOrderId: async (salesOrderId: number) => {
    const response = await axios.get(`${API_BASE_URL}/financial/sales-orders/${salesOrderId}/items`);
    return response.data;
  }
};

// Invoice Service
export const invoiceService = {
  getById: async (invoiceId: number): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/invoices/${invoiceId}`);
    return response.data;
  }
};

// My Assets Service
export const myAssetsService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    asset_type?: string;
    location?: string;
  }): Promise<PaginatedResponse<any[]>> => {
    const response = await axios.get(`${API_BASE_URL}/my-assets`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/my-assets/${id}`);
    return response.data;
  },

  create: async (asset: any): Promise<ApiResponse<any>> => {
    const headers = asset instanceof FormData 
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };
    
    const response = await axios.post(`${API_BASE_URL}/my-assets`, asset, { headers });
    return response.data;
  },

  update: async (id: number, asset: any): Promise<ApiResponse<any>> => {
    const response = await axios.put(`${API_BASE_URL}/my-assets/${id}`, asset);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/my-assets/${id}`);
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/my-assets/stats/overview`);
    return response.data;
  },

  bulkCreate: async (data: {
    supplier_id: number;
    purchase_date: string;
    notes?: string;
    assets: Array<{
      asset_name: string;
      asset_type: string;
      price: number;
      quantity: number;
    }>;
  }): Promise<ApiResponse<any>> => {
    const response = await axios.post(`${API_BASE_URL}/my-assets/bulk-create`, data);
    return response.data;
  }
};

// Asset Purchase Orders Service
export const assetPurchaseOrdersService = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    const response = await axios.get(`${API_BASE_URL}/asset-purchase-orders`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/asset-purchase-orders/${id}`);
    return response.data;
  },

  create: async (data: {
    supplier_id: number;
    order_date: string;
    expected_delivery_date?: string;
    notes?: string;
    assets: Array<{
      asset_id: number;
      quantity: number;
      unit_price: number;
      tax_type?: string;
    }>;
  }): Promise<ApiResponse<any>> => {
    const response = await axios.post(`${API_BASE_URL}/asset-purchase-orders`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<ApiResponse<any>> => {
    const response = await axios.patch(`${API_BASE_URL}/asset-purchase-orders/${id}/status`, { status });
    return response.data;
  },

  receiveAssets: async (assetPurchaseOrderId: number, data: {
    location: string;
    notes?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await axios.post(`${API_BASE_URL}/asset-purchase-orders/${assetPurchaseOrderId}/receive`, data);
    return response.data;
  }
};

// Faulty Products Service
export const faultyProductsService = {
  getAllReports: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    store_id?: number;
  }): Promise<PaginatedResponse<any[]>> => {
    const response = await axios.get(`${API_BASE_URL}/faulty-products`, { params });
    return response.data;
  },

  getReportById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/faulty-products/${id}`);
    return response.data;
  },

  createReport: async (report: any): Promise<ApiResponse<any>> => {
    const response = await axios.post(`${API_BASE_URL}/faulty-products`, report);
    return response.data;
  },

  updateReportStatus: async (id: number, status: any): Promise<ApiResponse<any>> => {
    const response = await axios.put(`${API_BASE_URL}/faulty-products/${id}/status`, status);
    return response.data;
  },

  deleteReport: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/faulty-products/${id}`);
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/faulty-products/stats/overview`);
    return response.data;
  }
};

// Receipts Service
export const receiptsService = {
  postReceipt: async (formData: FormData): Promise<ApiResponse<any>> => {
    const response = await axios.post(`${API_BASE_URL}/receipts`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    supplier_id?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<PaginatedResponse<any[]>> => {
    const response = await axios.get(`${API_BASE_URL}/receipts`, { params });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/receipts/${id}`);
    return response.data;
  },

  getByInvoice: async (invoiceId: number): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/receipts/invoice/${invoiceId}`);
    return response.data;
  },

  // OPTIMIZED: Get amounts paid for multiple invoices in a single request
  getBulkAmountsPaid: async (invoiceIds: number[]): Promise<ApiResponse<{[key: number]: number}>> => {
    const response = await axios.post(`${API_BASE_URL}/financial/receipts/bulk-amounts-paid`, {
      invoice_ids: invoiceIds
    });
    return response.data;
  },

  download: async (id: number): Promise<Blob> => {
    const response = await axios.get(`${API_BASE_URL}/receipts/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/receipts/${id}`);
    return response.data;
  }
};

// Payments Service
export const paymentsService = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/payments`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/payments/${id}`);
    return response.data;
  },

  create: async (payment: CreatePaymentForm): Promise<ApiResponse<any>> => {
    const response = await axios.post(`${API_BASE_URL}/financial/payments`, payment);
    return response.data;
  },

  update: async (id: number, payment: Partial<CreatePaymentForm>): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/financial/payments/${id}`, payment);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/financial/payments/${id}`);
    return response.data;
  }
};

// Journal Entries Service
export const journalEntriesService = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/journal-entries`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/journal-entries/${id}`);
    return response.data;
  },

  create: async (journalEntry: CreateJournalEntryForm): Promise<ApiResponse<any>> => {
    const response = await axios.post(`${API_BASE_URL}/financial/journal-entries`, journalEntry);
    return response.data;
  },

  update: async (id: number, journalEntry: Partial<CreateJournalEntryForm>): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/financial/journal-entries/${id}`, journalEntry);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/financial/journal-entries/${id}`);
    return response.data;
  },

  post: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.patch(`${API_BASE_URL}/financial/journal-entries/${id}/post`);
    return response.data;
  },

  getByAccount: async (accountId: number): Promise<ApiResponse<any[]>> => {
    console.log('Calling API for account ID:', accountId);
    console.log('API URL:', `${API_BASE_URL}/financial/journal-entries?account_id=${accountId}`);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/financial/journal-entries?account_id=${accountId}`);
      console.log('API response received:', response);
      return response.data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  getByAccountCode: async (accountCode: string): Promise<ApiResponse<any[]>> => {
    console.log('Calling API for account code:', accountCode);
    console.log('API URL:', `${API_BASE_URL}/financial/journal-entries?account_code=${accountCode}`);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/financial/journal-entries?account_code=${accountCode}`);
      console.log('API response received:', response);
      return response.data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }
}; 

export const generalLedgerService = {
  getEntries: async (): Promise<ApiResponse<GeneralLedgerEntry[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/general-ledger`);
    return response.data;
  }
}; 

export const inventoryTransactionsService = {
  getAll: async (params: any = {}): Promise<ApiResponse<any[]> & { pagination?: { totalPages: number; page: number; limit: number; total: number } }> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, String(value));
    });
    const response = await axios.get(`${API_BASE_URL}/financial/inventory-transactions?${query.toString()}`);
    return response.data;
  }
}; 

export const inventoryAsOfService = {
  getAll: async (params: { date: string, store_id?: number|string }): Promise<ApiResponse<any[]>> => {
    const query = new URLSearchParams();
    query.append('date', params.date);
    if (params.store_id) query.append('store_id', String(params.store_id));
    const response = await axios.get(`${API_BASE_URL}/financial/inventory-as-of?${query.toString()}`);
    return response.data;
  }
}; 

export const stockTransferService = {
  transfer: async (data: {
    from_store_id: string | number;
    to_store_id: string | number;
    transfer_date: string;
    staff_id: number;
    reference?: string;
    notes?: string;
    items: { product_id: string | number; quantity: number }[];
  }): Promise<ApiResponse<any>> => {
    const response = await axios.post(`${API_BASE_URL}/financial/stock-transfer`, data);
    return response.data;
  },
  getHistory: async (params: any = {}): Promise<ApiResponse<any[]> & { pagination?: { totalPages: number; page: number; limit: number; total: number } }> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, String(value));
    });
    const response = await axios.get(`${API_BASE_URL}/financial/transfer-history?${query.toString()}`);
    return response.data;
  }
};

// Categories Service
export const categoriesService = {
  getAll: async (): Promise<ApiResponse<{ id: number; name: string }[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/categories`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<{ id: number; name: string }>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/categories/${id}`);
    return response.data;
  },

  create: async (category: { name: string }): Promise<ApiResponse<{ id: number; name: string }>> => {
    const response = await axios.post(`${API_BASE_URL}/financial/categories`, category);
    return response.data;
  },

  update: async (id: number, category: { name: string }): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/financial/categories/${id}`, category);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/financial/categories/${id}`);
    return response.data;
  }
};

// Delivery Notes Service
export const deliveryNotesService = {
  getAll: async (): Promise<ApiResponse<DeliveryNote[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/delivery-notes`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<DeliveryNote>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/delivery-notes/${id}`);
    return response.data;
  },

  create: async (deliveryNote: Partial<DeliveryNote>): Promise<ApiResponse<DeliveryNote>> => {
    const response = await axios.post(`${API_BASE_URL}/financial/delivery-notes`, deliveryNote);
    return response.data;
  },

  update: async (id: number, deliveryNote: Partial<DeliveryNote>): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/financial/delivery-notes/${id}`, deliveryNote);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/financial/delivery-notes/${id}`);
    return response.data;
  },

  assignRider: async (id: number, riderId: number): Promise<ApiResponse<void>> => {
    const response = await axios.patch(`${API_BASE_URL}/financial/delivery-notes/${id}/assign-rider`, { 
      rider_id: riderId 
    });
    return response.data;
  },

  markAsDelivered: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.patch(`${API_BASE_URL}/financial/delivery-notes/${id}/mark-delivered`);
    return response.data;
  }
};

// Delivery Note Items Service
export const deliveryNoteItemsService = {
  getByDeliveryNoteId: async (deliveryNoteId: number): Promise<ApiResponse<DeliveryNoteItem[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/delivery-notes/${deliveryNoteId}/items`);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<DeliveryNoteItem>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/delivery-note-items/${id}`);
    return response.data;
  },

  create: async (item: Partial<DeliveryNoteItem>): Promise<ApiResponse<DeliveryNoteItem>> => {
    const response = await axios.post(`${API_BASE_URL}/financial/delivery-note-items`, item);
    return response.data;
  },

  update: async (id: number, item: Partial<DeliveryNoteItem>): Promise<ApiResponse<void>> => {
    const response = await axios.put(`${API_BASE_URL}/financial/delivery-note-items/${id}`, item);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`${API_BASE_URL}/financial/delivery-note-items/${id}`);
    return response.data;
  }
};

// Returns Service
export interface Return {
  id: number;
  so_number: string;
  client_id: number;
  order_date: string;
  salesrep?: number;
  client_name?: string;
  client_email?: string;
  client_contact?: string;
  region_name?: string;
  outlet_account_name?: string;
  salesrep_name?: string;
}

export interface ReturnItem {
  id: number;
  sales_order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  return_reason?: string;
  product_code?: string;
  unit_of_measure?: string;
}

export const returnsService = {
  getAll: async (params?: { 
    client_id?: number;
    region_id?: string | number;
    outlet_account_id?: string | number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<Return[]>> => {
    const query = new URLSearchParams();
    if (params?.client_id) {
      query.append('client_id', String(params.client_id));
    }
    if (params?.region_id) {
      query.append('region_id', String(params.region_id));
    }
    if (params?.outlet_account_id) {
      query.append('outlet_account_id', String(params.outlet_account_id));
    }
    if (params?.start_date) {
      query.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      query.append('end_date', params.end_date);
    }
    const url = query.toString() 
      ? `${API_BASE_URL}/financial/returns?${query.toString()}`
      : `${API_BASE_URL}/financial/returns`;
    const response = await axios.get(url);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Return>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/returns/${id}`);
    return response.data;
  },

  getItems: async (id: number): Promise<ApiResponse<ReturnItem[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/returns/${id}/items`);
    return response.data;
  }
};

// Non Supplies Service
export interface NonSupply {
  id: number;
  so_number: string;
  client_id: number;
  order_date: string;
  salesrep?: number;
  client_name?: string;
  client_email?: string;
  client_contact?: string;
  region_name?: string;
  outlet_account_name?: string;
  salesrep_name?: string;
}

export interface NonSupplyItem {
  id: number;
  sales_order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  non_supply_reason?: string;
  product_code?: string;
  unit_of_measure?: string;
}

export const nonSuppliesService = {
  getAll: async (params?: { 
    client_id?: number;
    region_id?: string | number;
    outlet_account_id?: string | number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<NonSupply[]>> => {
    const query = new URLSearchParams();
    if (params?.client_id) {
      query.append('client_id', String(params.client_id));
    }
    if (params?.region_id) {
      query.append('region_id', String(params.region_id));
    }
    if (params?.outlet_account_id) {
      query.append('outlet_account_id', String(params.outlet_account_id));
    }
    if (params?.start_date) {
      query.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      query.append('end_date', params.end_date);
    }
    const url = query.toString() 
      ? `${API_BASE_URL}/financial/non-supplies?${query.toString()}`
      : `${API_BASE_URL}/financial/non-supplies`;
    const response = await axios.get(url);
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<NonSupply>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/non-supplies/${id}`);
    return response.data;
  },

  getItems: async (id: number): Promise<ApiResponse<NonSupplyItem[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/non-supplies/${id}/items`);
    return response.data;
  },

  getItemsSummary: async (params?: { 
    client_id?: number;
    region_id?: string | number;
    outlet_account_id?: string | number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<NonSupplyItemSummary[]>> => {
    const query = new URLSearchParams();
    if (params?.client_id) {
      query.append('client_id', String(params.client_id));
    }
    if (params?.region_id) {
      query.append('region_id', String(params.region_id));
    }
    if (params?.outlet_account_id) {
      query.append('outlet_account_id', String(params.outlet_account_id));
    }
    if (params?.start_date) {
      query.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      query.append('end_date', params.end_date);
    }
    const url = query.toString() 
      ? `${API_BASE_URL}/financial/non-supplies/items/summary?${query.toString()}`
      : `${API_BASE_URL}/financial/non-supplies/items/summary`;
    const response = await axios.get(url);
    return response.data;
  }
};

export interface NonSupplyItemSummary {
  id: number;
  sales_order_id: number;
  product_id: number;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_of_measure?: string;
  non_supply_reason?: string;
  so_number: string;
  order_date: string;
  client_id: number;
  outlet_name: string;
  outlet_contact?: string;
  region_name?: string;
  outlet_account_name?: string;
  salesrep_name?: string;
}