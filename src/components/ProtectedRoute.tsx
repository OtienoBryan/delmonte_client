import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication. If the user is not authenticated,
 * they will be redirected to the login page.
 * 
 * Usage:
 * <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Check if user is authenticated
    if (!user && !token) {
      console.warn('🔐 Unauthorized access attempt to:', location.pathname);
      console.warn('Redirecting to login page...');
    }
  }, [user, token, location]);

  // If no user and no token, redirect to login
  if (!user && !token) {
    // Save the attempted location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If token exists but user object doesn't, try to restore from localStorage
  if (!user && token) {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      // Token exists but no user data - invalid state, redirect to login
      localStorage.removeItem('token');
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;

