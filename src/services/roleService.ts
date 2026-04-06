import api from './api';

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error) {
      console.error('Error in roleService.getRoles:', error);
      throw error;
    }
  }
}; 