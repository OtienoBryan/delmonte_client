import axios from 'axios';

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

export interface CreditNoteItem {
  product_id: number;
  product?: any;
  invoice_id: number; // Required for credit note items
  quantity: number;
  unit_price: number;
  total_price: number;
  condition?: 'good' | 'damaged'; // Condition of the item
  return_store_id?: number | null; // Store ID where item should be returned
  original_quantity?: number; // Original quantity from invoice
  credited_quantity?: number; // Already credited quantity
  remaining_quantity?: number; // Remaining quantity available for credit
}

export interface CreateCreditNoteForm {
  customer_id: number;
  credit_note_date: string;
  reason?: string;
  original_invoice_ids?: number[]; // Support multiple invoices
  original_invoice_id?: number; // Keep for backward compatibility
  items: CreditNoteItem[];
  scenario_type?: 'faulty_no_stock' | 'faulty_with_stock'; // Scenario type
  damage_store_id?: number | null; // Store ID for scenario 2 (required for faulty_with_stock)
}

export interface CreditNote {
  id: number;
  credit_note_number: string;
  customer_id: number;
  customer_name?: string;
  customer_code?: string;
  credit_note_date: string;
  original_invoice_id?: number;
  original_invoice_number?: string;
  reason?: string;
  scenario_type?: 'faulty_no_stock' | 'faulty_with_stock';
  damage_store_id?: number | null;
  damage_store_name?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  my_status?: number;
  received_by?: number;
  received_at?: string;
  staff_name?: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  items?: CreditNoteItem[];
}

export interface CustomerInvoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  credited_amount: number;
  remaining_amount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export const creditNoteService = {
  // Get all credit notes
  getAll: async (): Promise<ApiResponse<CreditNote[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/credit-notes`);
    return response.data;
  },

  // Get credit note by ID
  getById: async (id: number): Promise<ApiResponse<CreditNote>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/credit-notes/${id}`);
    return response.data;
  },

  // Create a new credit note
  create: async (creditNote: CreateCreditNoteForm): Promise<ApiResponse<CreditNote>> => {
    const response = await axios.post(`${API_BASE_URL}/financial/credit-notes`, creditNote);
    return response.data;
  },

  // Get customer invoices for credit note creation
  getCustomerInvoices: async (customerId: number): Promise<ApiResponse<CustomerInvoice[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/customers/${customerId}/invoices-for-credit`);
    return response.data;
  },

  // Get credit notes for a specific customer
  getCustomerCreditNotes: async (customerId: number): Promise<ApiResponse<CreditNote[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/customers/${customerId}/credit-notes`);
    return response.data;
  },

  // Get invoice items with credited quantities
  getInvoiceItemsWithCreditedQuantities: async (invoiceId: number): Promise<ApiResponse<any[]>> => {
    const response = await axios.get(`${API_BASE_URL}/financial/invoices/${invoiceId}/items-with-credited`);
    return response.data;
  }
}; 