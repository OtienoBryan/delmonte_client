import api from './api';

export interface AssetAssignment {
  id: number;
  asset_id: number;
  staff_id: number;
  assigned_date: string;
  assigned_by: number;
  comment: string | null;
  status: 'active' | 'returned' | 'lost' | 'damaged';
  returned_date: string | null;
  created_at: string;
  updated_at: string;
  // Additional fields for display
  asset_name?: string;
  asset_code?: string;
  staff_name?: string;
  staff_role?: string;
  assigned_by_name?: string;
}

export interface CreateAssetAssignmentData {
  asset_id: number;
  staff_id: number;
  assigned_date: string;
  comment?: string;
}

export interface UpdateAssetAssignmentData {
  status?: 'active' | 'returned' | 'lost' | 'damaged';
  returned_date?: string;
  comment?: string;
}

export const assetAssignmentService = {
  // Get all asset assignments
  getAll: async (): Promise<{ success: boolean; data: AssetAssignment[] }> => {
    try {
      const response = await api.get('/asset-assignments');
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error('Error fetching asset assignments:', error);
      return { success: false, data: [] };
    }
  },

  // Get asset assignments by asset ID
  getByAssetId: async (assetId: number): Promise<{ success: boolean; data: AssetAssignment[] }> => {
    try {
      const response = await api.get(`/asset-assignments/asset/${assetId}`);
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error('Error fetching asset assignments by asset ID:', error);
      return { success: false, data: [] };
    }
  },

  // Get asset assignments by staff ID
  getByStaffId: async (staffId: number): Promise<{ success: boolean; data: AssetAssignment[] }> => {
    try {
      const response = await api.get(`/asset-assignments/staff/${staffId}`);
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error('Error fetching asset assignments by staff ID:', error);
      return { success: false, data: [] };
    }
  },

  // Create new asset assignment
  create: async (data: CreateAssetAssignmentData): Promise<{ success: boolean; data: AssetAssignment }> => {
    try {
      const response = await api.post('/asset-assignments', data);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error creating asset assignment:', error);
      throw error;
    }
  },

  // Update asset assignment
  update: async (id: number, data: UpdateAssetAssignmentData): Promise<{ success: boolean; data: AssetAssignment }> => {
    try {
      const response = await api.put(`/asset-assignments/${id}`, data);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error updating asset assignment:', error);
      throw error;
    }
  },

  // Delete asset assignment
  delete: async (id: number): Promise<{ success: boolean }> => {
    try {
      await api.delete(`/asset-assignments/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting asset assignment:', error);
      throw error;
    }
  },

  // Return asset (change status to returned)
  returnAsset: async (id: number, returnedDate: string, comment?: string): Promise<{ success: boolean; data: AssetAssignment }> => {
    try {
      const response = await api.put(`/asset-assignments/${id}/return`, {
        returned_date: returnedDate,
        comment: comment || 'Asset returned'
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error returning asset:', error);
      throw error;
    }
  }
};
