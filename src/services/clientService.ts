import api from './api';

export interface Client {
  id: number;
  name: string;
  company_name?: string;
  email: string;
  address?: string;
  contact?: string;
  tax_pin?: string;
  credit_limit?: string;
  payment_terms?: string;
  country_id?: number;
  countryId?: number;
  region_id?: number;
  route_id?: number;
  route_id_update?: number;
  status?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateClientData {
  name: string;
  account_number: string;
  email: string;
  phone?: string;
  address?: string;
}

export const clientService = {
  getClients: async (): Promise<Client[]> => {
    try {
      console.log('Attempting to fetch clients...');
      const response = await api.get<Client[]>('/clients?limit=10000');
      console.log('Clients fetched successfully:', response.data);
      return (response.data as any).data; // <-- fix: return the array
    } catch (error: any) {
      console.error('Error in getClients:', error);
      throw error; // Let the error propagate up
    }
  },

  // Add: Get inactive clients (status = 0)
  getInactiveClients: async (): Promise<Client[]> => {
    try {
      console.log('Attempting to fetch inactive clients...');
      const response = await api.get<{ data: Client[] }>('/clients?limit=10000');
      if (response.data && response.data.data) {
        const inactiveClients = response.data.data.filter((client: Client) => client.status === 0);
        console.log(`Found ${inactiveClients.length} inactive clients`);
        return inactiveClients;
      }
      return [];
    } catch (error: any) {
      console.error('Error in getInactiveClients:', error);
      throw error;
    }
  },

  getClient: async (id: number): Promise<Client> => {
    try {
      console.log('Fetching client:', id);
      const response = await api.get<Client>(`/clients/${id}`);
      console.log('Client fetched:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching client:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch client details');
    }
  },

  createClient: async (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> => {
    try {
      const response = await api.post<Client>('/clients', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to create client');
    }
  },

  updateClient: async (id: number, data: Partial<Client>): Promise<Client> => {
    try {
      const response = await api.put<Client>(`/clients/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to update client');
    }
  },

  deleteClient: async (id: number): Promise<void> => {
    try {
      await api.delete(`/clients/${id}`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to delete client');
    }
  },

  // Add: Get all clients with balances
  getClientsWithBalances: async (): Promise<any[]> => {
    try {
      const response = await api.get('/financial/receivables/aging');
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching clients with balances:', error);
      return [];
    }
  },

  // Fetch all invoices for a customer
  getCustomerInvoices: async (clientId: string | number) => {
    try {
      // Fetch from sales orders where my_status is 1, 2, or 3
      const response = await fetch(`/api/financial/sales-orders?client_id=${clientId}&status=1,2,3`);
      const data = await response.json();
      if (data.success) {
        return { success: true, data: data.data || [] };
      } else {
        return { success: false, data: [] };
      }
    } catch (error) {
      console.error('Error fetching customer invoices from sales orders:', error);
      return { success: false, data: [] };
    }
  },

  // Fetch customer ledger for a customer
  getCustomerLedger: async (customerId: string | number) => {
    // Updated to use client_ledger endpoint
    const response = await api.get(`/clients/${customerId}/history`);
    return response.data;
  },

  // Fetch all payments for a customer
  getCustomerPayments: async (clientId: string | number) => {
    const response = await api.get(`/clients/${clientId}/payments`);
    return response.data;
  },

  // Create a new payment for a customer
  createCustomerPayment: async (customerId: string | number, data: any) => {
    const response = await api.post(`/financial/receivables/payment`, { ...data, customer_id: customerId });
    return response.data;
  },

  // Fetch available payment accounts (cash/bank)
  getPaymentAccounts: async () => {
    const response = await api.get('/payroll/payment-accounts');
    return response.data;
  },

  // Fetch all client payments (optionally filter by status)
  getAllPayments: async (status?: string) => {
    let url = '/payments';
    if (status) url += `?status=${encodeURIComponent(status)}`;
    const response = await api.get(url);
    return response.data;
  },

  getClientHistory: async (id: number): Promise<any[]> => {
    try {
      const response = await api.get(`/clients/${id}/history`);
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching client history:', error);
      return [];
    }
  },

  // Get all client types (outlet categories)
  getClientTypes: async (): Promise<{ id: number; name: string }[]> => {
    try {
      const response = await api.get('/clients/types');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching client types:', error);
      return [];
    }
  },

  // Get all outlet accounts
  getOutletAccounts: async (): Promise<{ id: number; name: string }[]> => {
    try {
      const response = await api.get('/clients/outlet-accounts');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching outlet accounts:', error);
      return [];
    }
  }
}; 