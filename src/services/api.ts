import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig
} from 'axios';

// Enhanced type definitions
export type RequestConfig<T = any> = AxiosRequestConfig<T>;
export type Response<T = any, D = any> = AxiosResponse<T, D>;
export type ApiResponse<T = any> = {
  data: T;
  status: number;
  statusText: string;
  headers: any;
};

export interface ApiError extends Error {
  status: number;
  message: string;
  details?: any;
  code?: string;
  response?: any;
  config?: any;
  isAxiosError?: boolean;
  toJSON?: () => object;
  
  // Allow any other properties since we're extending Error
  [key: string]: any;
}

import { API_BASE_URL } from '../config/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // Increased timeout to 30 seconds for serverless functions
  withCredentials: false // Disable credentials for cross-origin requests
});

// Request interceptor for authentication and debugging
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add JWT token to requests if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log('Making request to:', {
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        method: config.method,
        hasToken: !!token
      });
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and automatic redirect
api.interceptors.response.use(
  (response) => {
    // Debug logging in development
    if (import.meta.env.DEV) {
      console.log('Response received:', {
        url: response.config.url,
        status: response.status
      });
    }
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const currentPath = window.location.pathname;
      
      console.error('Error response:', {
        status,
        data: error.response.data,
        url: error.config?.url
      });
      
      // Handle authentication errors (401 Unauthorized)
      if (status === 401) {
        console.warn('🔐 Authentication failed - token expired or invalid');
        
        // Only redirect if not already on login page (prevent redirect loop)
        if (currentPath !== '/login' && currentPath !== '/') {
          // Clear authentication data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Show user-friendly message
          const message = error.response.data?.message || 'Your session has expired. Please log in again.';
          console.warn(message);
          
          // Redirect to login page
          console.log('Redirecting to login page...');
          window.location.href = '/login';
        }
        
        return Promise.reject(new Error('Authentication required. Please log in.'));
      }
      
      // Handle forbidden errors (403 Forbidden)
      if (status === 403) {
        console.warn('🚫 Access forbidden - insufficient permissions');
        
        // Only redirect if not already on login page
        if (currentPath !== '/login' && currentPath !== '/') {
          const message = error.response.data?.message || error.response.data?.error || 'Access forbidden';
          console.warn(message);
          
          // If it's a token-related 403, clear auth and redirect
          if (message.toLowerCase().includes('token') || message.toLowerCase().includes('auth')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.log('Redirecting to login page due to token error...');
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(new Error('Access forbidden. You do not have permission to access this resource.'));
      }
      
      // Don't transform other errors, just pass them through
      return Promise.reject(error);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return Promise.reject(new Error('No response from server. Please check your internet connection.'));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      return Promise.reject(new Error('Failed to set up request'));
    }
  }
);

// Enhanced utility functions with better typing
export const get = async <T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> => {
  const response = await api.get<T>(url, config);
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  };
};

export const post = async <T, D = any>(url: string, data?: D, config?: RequestConfig<D>): Promise<ApiResponse<T>> => {
  const response = await api.post<T>(url, data, config);
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  };
};

export const put = async <T, D = any>(url: string, data?: D, config?: RequestConfig<D>): Promise<ApiResponse<T>> => {
  const response = await api.put<T>(url, data, config);
  return response;
};

export const patch = async <T, D = any>(url: string, data?: D, config?: RequestConfig<D>): Promise<ApiResponse<T>> => {
  const response = await api.patch<T>(url, data, config);
  return response;
};

export const del = async <T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> => {
  const response = await api.delete<T>(url, config);
  return response;
};

export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
};

export default api; 