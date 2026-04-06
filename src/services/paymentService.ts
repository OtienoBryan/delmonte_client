import api from './api';

export interface PaymentData {
  policyId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
}

export interface RefundData {
  reason: string;
}

export const paymentService = {
  getPayments: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/payments');
    return response.data;
  },

  makePayment: async (data: PaymentData): Promise<any> => {
    const response = await api.post<any>('/payments', data);
    return response.data;
  },

  getPaymentDetails: async (paymentId: string): Promise<any> => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  },

  refundPayment: async (paymentId: string, data: RefundData): Promise<any> => {
    const response = await api.post(`/payments/${paymentId}/refund`, data);
    return response.data;
  }
};
