import api from './api';

export interface Branch {
  id: string;
  client_id: string;
  name: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBranchData {
  name: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
}

export const getBranches = async (clientId: string): Promise<Branch[]> => {
  try {
    const response = await api.get<Branch[]>(`/clients/${clientId}/branches`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to fetch branches');
  }
};

export const getBranch = async (clientId: string, branchId: string): Promise<Branch> => {
  try {
    const response = await api.get<Branch>(`/clients/${clientId}/branches/${branchId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to fetch branch details');
  }
};

export const createBranch = async (clientId: string, data: CreateBranchData): Promise<Branch> => {
  try {
    const response = await api.post<Branch>(`/clients/${clientId}/branches`, data);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to create branch');
  }
};

export const updateBranch = async (clientId: string, branchId: string, data: Partial<Branch>): Promise<Branch> => {
  try {
    const response = await api.put<Branch>(`/clients/${clientId}/branches/${branchId}`, data);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to update branch');
  }
};

export const deleteBranch = async (clientId: string, branchId: string): Promise<void> => {
  try {
    await api.delete(`/clients/${clientId}/branches/${branchId}`);
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to delete branch');
  }
}; 