import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      // Call logout API endpoint to log the activity
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          // Don't block logout if API call fails
          console.error('Error calling logout API:', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  },

  getCurrentUser: async (): Promise<any> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    const response = await api.post<AuthResponse>('/auth/refresh', { token });
    return response.data;
  }
};
