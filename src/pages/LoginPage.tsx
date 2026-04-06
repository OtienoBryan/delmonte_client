import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import axios from 'axios';
import Popup from '../components/Popup';

import { API_BASE_URL } from '../config/api';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Login attempt with username:', username);
      console.log('API base URL:', import.meta.env.VITE_API_URL);
      
      const response = await api.post('/auth/login', { username, password });
      console.log('Login response received:', { 
        status: response.status,
        hasToken: !!response.data.token,
        hasUser: !!response.data.user,
        data: response.data
      });

      if (response.data.token) {
        console.log('Login successful, setting auth token');
        setShowSuccessPopup(true);
        // Delay navigation to show success message
        setTimeout(() => {
          login(response.data.token, response.data.user);
          if (response.data.user.role === 'sales') {
            navigate('/sales-dashboard', { replace: true });
          } else if (response.data.user.role === 'leader') {
            navigate('/team-leader-dashboard', { replace: true });
          } else if (response.data.user.role === 'hr') {
            navigate('/hr-dashboard', { replace: true });
          } else if (response.data.user.role === 'stock') {
            navigate('/inventory-staff-dashboard', { replace: true });
          } else if (response.data.user.role === 'executive') {
            navigate('/executive-dashboard', { replace: true });
          } else {
            const from = (location.state as any)?.from?.pathname || '/';
            // Prevent redirecting to '/' (FinancialDashboard) for sales role
            if (response.data.user.role === 'sales' && (!from || from === '/')) {
              navigate('/sales-dashboard', { replace: true });
            } else {
              navigate(from, { replace: true });
            }
          }
        }, 1500); // Show success message for 1.5 seconds
      } else {
        console.error('Login response missing token');
        setError('Invalid response from server');
        setShowErrorPopup(true);
      }
          } catch (error) {
        console.error('Login error:', error);
        if (axios.isAxiosError(error)) {
          console.error('Axios error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            isAxiosError: axios.isAxiosError(error),
            errorType: typeof error,
            errorConstructor: error.constructor.name,
            config: {
              url: error.config?.url,
              baseURL: error.config?.baseURL,
              headers: error.config?.headers
            }
          });
          // Handle different HTTP status codes for authentication errors
          if (error.response?.status === 401 || error.response?.status === 403) {
            setError('Incorrect credentials. Please check your username and password.');
            setShowErrorPopup(true);
          } else if (error.response?.status === 400) {
            // Check if the error message contains credential-related text
            const errorMessage = error.response?.data?.message || '';
            if (errorMessage.toLowerCase().includes('invalid') || 
                errorMessage.toLowerCase().includes('credentials') ||
                errorMessage.toLowerCase().includes('username') ||
                errorMessage.toLowerCase().includes('password')) {
              setError('Incorrect credentials. Please check your username and password.');
            } else {
              setError(errorMessage || 'Invalid request. Please check your input.');
            }
            setShowErrorPopup(true);
          } else if (error.response?.data?.message) {
            setError(error.response.data.message);
            setShowErrorPopup(true);
          } else if (!error.response) {
            setError('No response from server. Please check your connection.');
            setShowErrorPopup(true);
          } else {
            setError('An unexpected error occurred');
            setShowErrorPopup(true);
          }
        } else {
          console.error('Non-Axios error:', error);
          setError('An unexpected error occurred');
          setShowErrorPopup(true);
        }
      } finally {
        setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="bg-white py-5 px-4 shadow sm:rounded-lg sm:px-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/kcc.png" 
              alt="KCC Logo" 
              className="h-32 object-contain"
            />
          </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-xs font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-2.5 py-1.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-3.5 w-3.5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-900">
                    Remember me
                  </label>
                </div>
                <div className="text-xs">
                  <a href="#" className="font-medium text-red-600 hover:text-red-500">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-1.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF3131] hover:bg-[#FF3131]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Error Popup */}
      <Popup
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        title="Login Error"
        message={error}
        type="error"
      />
      
      {/* Success Popup */}
      <Popup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Login Successful"
        message="Welcome back! Redirecting to your dashboard..."
        type="success"
      />
    </div>
  );
};

export default LoginPage;