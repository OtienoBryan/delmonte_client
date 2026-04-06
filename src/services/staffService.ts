import api from './api';
import { AxiosError } from 'axios';

export interface Staff {
  id: number;
  name: string;
  photo_url: string;
  position: string;
  designation?: string;
  empl_no: string;
  id_no: number;
  role: string;
  employment_type?: string;
  gender?: string;
  business_email?: string;
  department_email?: string;
  phone_number?: string;
  salary?: number | null;
  status: number;  // 1 for active, 0 for deactivated
  department?: string;
  department_id?: number;
  department_name?: string;
  department_description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffData {
  name: string;
  photo_url: string;
  empl_no: string;
  id_no: number;
  role: string;
  designation?: string;
  employment_type?: string;
  gender?: string;
  business_email?: string;
  department_email?: string;
  phone_number?: string;
  salary?: number | null;
  department?: string;
  department_id?: number;
  // Extended fields
  manager_id?: number | null;
  offer_date?: string | null;
  start_date?: string | null;
  date_of_birth?: string | null;
  marital_status?: string | null;
  nationality?: string | null;
  address?: string | null;
  nhif_number?: string | null;
  nssf_number?: string | null;
  kra_pin?: string | null;
  passport_number?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  account_number?: string | null;
  account_name?: string | null;
  swift_code?: string | null;
  benefits?: string[] | null;
  beneficiaries?: Array<{
    name: string;
    relationship: string;
    contact: string;
    entry_order: number;
  }>;
  emergency_contacts?: Array<{
    name: string;
    relationship: string;
    contact: string;
    entry_order: number;
  }>;
  family?: Array<{
    name: string;
    relationship: string;
    contact: string;
    entry_order: number;
  }>;
  education?: Array<{
    institution: string;
    qualification: string;
    year_of_completion?: string | null;
    entry_order: number;
  }>;
  work_experience?: Array<{
    organization: string;
    designation: string;
    from_date?: string | null;
    to_date?: string | null;
    reason_for_leaving?: string | null;
    entry_order: number;
  }>;
  references?: Array<{
    name: string;
    position?: string | null;
    company?: string | null;
    phone?: string | null;
    email?: string | null;
    entry_order: number;
  }>;
}

export const staffService = {
  getStaffList: async (): Promise<Staff[]> => {
    try {
      console.log('Making API request to fetch staff list...');
      const response = await api.get('/staff');
      console.log('API Response:', response);
      return response.data;
    } catch (error) {
      console.error('Error in staffService.getStaffList:', error);
      if (error instanceof AxiosError) {
        if (error.response) {
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
          console.error('Error response headers:', error.response.headers);
        } else if (error.request) {
          console.error('Error request:', error.request);
        } else {
          console.error('Error message:', error.message);
        }
      }
      throw error;
    }
  },

  getStaffById: async (staffId: number): Promise<any> => {
    try {
      console.log('Fetching staff by ID:', staffId);
      const response = await api.get(`/staff/${staffId}`);
      console.log('Staff data response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in staffService.getStaffById:', error);
      throw error;
    }
  },

  uploadPhoto: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  },

  createStaff: async (staffData: CreateStaffData): Promise<Staff> => {
    try {
      const response = await api.post('/staff', staffData);
      return response.data;
    } catch (error) {
      console.error('Error in staffService.createStaff:', error);
      throw error;
    }
  },

  updateStaffStatus: async (staffId: number, status: number): Promise<Staff> => {
    try {
      console.log('Updating staff status:', { staffId, status });
      const response = await api.patch(`/staff/${staffId}/status`, { status });
      console.log('Status update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating staff status:', error);
      throw error;
    }
  },

  updateStaff: async (staffId: number, staffData: Partial<CreateStaffData>): Promise<Staff> => {
    try {
      console.log('Updating staff:', staffId, staffData);
      const response = await api.put(`/staff/${staffId}`, staffData);
      console.log('Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in staffService.updateStaff:', error);
      throw error;
    }
  },

  getExpiringContracts: async () => {
    try {
      const response = await api.get('/staff/contracts/expiring');
      return response.data;
    } catch (error) {
      console.error('Error fetching expiring contracts:', error);
      throw error;
    }
  },

  getDepartments: async () => {
    try {
      const response = await api.get('/my-departments');
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }
};