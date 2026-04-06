import api from './api';

export interface Rider {
  id: number;
  name: string;
  contact: string;
  id_number: string;
  company_id?: number;
  company_name?: string;
}

export interface RiderCompany {
  id: number;
  name: string;
}

export const riderService = {
  getRiders: async (): Promise<Rider[]> => {
    const response = await api.get('/riders');
    // If your API nests data under .data, adjust as needed:
    return response.data.data || response.data;
  },
  
  getCompanies: async (): Promise<RiderCompany[]> => {
    const response = await api.get('/riders/companies');
    return response.data.data || response.data;
  }
}; 