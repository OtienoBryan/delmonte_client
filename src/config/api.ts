// Centralized API Configuration
export const API_CONFIG = {
  // Get API URL from environment variable with proper validation
  getBaseUrl: (): string => {
    const url = import.meta.env.VITE_API_URL;
    if (!url) {
      // Check if we're in production (Vercel deployment)
      if (import.meta.env.PROD) {
        console.warn('VITE_API_URL not set in production, using relative path: /api');
        return '/api';
      }
      // Default to localhost:5000 for development
      console.warn('VITE_API_URL not set, using default: http://localhost:5000/api');
      return 'http://localhost:5000/api';
    }
    // For production, use the environment variable as-is
    return url;
  },
  
  // Get socket URL (API URL without /api)
  getSocketUrl: (): string => {
    const baseUrl = API_CONFIG.getBaseUrl();
    // For relative URLs like '/api', return the root '/'
    if (baseUrl.startsWith('/')) {
      return baseUrl.replace('/api', '') || '/';
    }
    return baseUrl.replace('/api', '');
  },
  
  // Get full URL for a specific endpoint
  getUrl: (endpoint: string): string => {
    const baseUrl = API_CONFIG.getBaseUrl();
    return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }
};

// Export commonly used URLs
export const API_BASE_URL = API_CONFIG.getBaseUrl();
export const SOCKET_URL = API_CONFIG.getSocketUrl();

// Log configuration for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('API Configuration:', {
    baseUrl: API_BASE_URL,
    socketUrl: SOCKET_URL,
    envUrl: import.meta.env.VITE_API_URL
  });
}
