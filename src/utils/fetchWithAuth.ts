/**
 * Authenticated Fetch Utility
 * 
 * A wrapper around fetch that automatically includes the JWT token
 * and handles authentication errors
 */

export interface FetchWithAuthOptions extends RequestInit {
  // All standard fetch options
}

/**
 * Fetch wrapper that automatically includes JWT token in Authorization header
 * and redirects to login on 401 Unauthorized
 */
export const fetchWithAuth = async (
  url: string, 
  options: FetchWithAuthOptions = {}
): Promise<Response> => {
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Prepare headers
  const headers = new Headers(options.headers || {});
  
  // Add Authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Add Content-Type if not already set and body is provided (but not for FormData)
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Make the fetch request
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Handle authentication errors
  if (response.status === 401) {
    // Token expired or invalid
    console.warn('Authentication failed - redirecting to login');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = '/login';
    
    throw new Error('Authentication required. Please log in.');
  }
  
  return response;
};

/**
 * GET request with authentication
 */
export const getWithAuth = async (url: string, options: FetchWithAuthOptions = {}) => {
  return fetchWithAuth(url, {
    ...options,
    method: 'GET'
  });
};

/**
 * POST request with authentication
 */
export const postWithAuth = async (
  url: string, 
  data?: any, 
  options: FetchWithAuthOptions = {}
) => {
  return fetchWithAuth(url, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  });
};

/**
 * PUT request with authentication
 */
export const putWithAuth = async (
  url: string, 
  data?: any, 
  options: FetchWithAuthOptions = {}
) => {
  return fetchWithAuth(url, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
  });
};

/**
 * DELETE request with authentication
 */
export const deleteWithAuth = async (url: string, options: FetchWithAuthOptions = {}) => {
  return fetchWithAuth(url, {
    ...options,
    method: 'DELETE'
  });
};

/**
 * PATCH request with authentication
 */
export const patchWithAuth = async (
  url: string, 
  data?: any, 
  options: FetchWithAuthOptions = {}
) => {
  return fetchWithAuth(url, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined
  });
};

export default fetchWithAuth;

