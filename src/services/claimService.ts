import api from './api';

export interface ClaimData {
  policyId: string;
  amount: number;
  description: string;
  documents?: any[];
}

export interface UpdateClaimData {
  notes?: string;
}

export interface ApproveClaimData {
  amount: number;
  notes?: string;
}

export interface RejectClaimData {
  reason: string;
}

export const claimService = {
  getClaims: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/claims');
    return response.data;
  },

  fileClaim: async (data: ClaimData): Promise<any> => {
    const response = await api.post<any>('/claims', data);
    return response.data;
  },

  getClaimDetails: async (claimId: string): Promise<any> => {
    const response = await api.get<any>(`/claims/${claimId}`);
    return response.data;
  },

  updateClaim: async (claimId: string, data: UpdateClaimData): Promise<any> => {
    const response = await api.patch<any>(`/claims/${claimId}`, data);
    return response.data;
  },

  approveClaim: async (claimId: string, data: ApproveClaimData): Promise<any> => {
    const response = await api.post<any>(`/claims/${claimId}/approve`, data);
    return response.data;
  },

  rejectClaim: async (claimId: string, data: RejectClaimData): Promise<any> => {
    const response = await api.post<any>(`/claims/${claimId}/reject`, data);
    return response.data;
  }
};
