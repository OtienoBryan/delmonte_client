import api from './api';

export interface PolicyData {
  policyType: string;
  premium: number;
  startDate: string;
  endDate: string;
  riskScore: number;
}

export interface UpdatePolicyData {
  status?: string;
  notes?: string;
}

export interface CancelPolicyData {
  reason: string;
}

export const policyService = {
  getPolicies: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/policies');
    return response.data;
  },

  buyPolicy: async (data: PolicyData): Promise<any> => {
    const response = await api.post<any>('/policies/buy', data);
    return response.data;
  },

  getPolicyDetails: async (policyId: string): Promise<any> => {
    const response = await api.get(`/policies/${policyId}`);
    return response.data;
  },

  updatePolicy: async (policyId: string, data: UpdatePolicyData): Promise<any> => {
    const response = await api.patch<any>(`/policies/${policyId}`, data);
    return response.data;
  },

  cancelPolicy: async (policyId: string, data: CancelPolicyData): Promise<any> => {
    const response = await api.delete<any>(`/policies/${policyId}`, {
      params: { reason: data.reason }
    });
    return response.data;
  }
};
