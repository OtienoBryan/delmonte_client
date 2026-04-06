import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const WARNING_TIMEOUT = 9 * 60 * 1000; // 9 minutes (1 minute warning)

const AutoLogout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef<boolean>(false);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    warningShownRef.current = false;
    
    if (user) {
      // Set warning timeout
      warningTimeoutRef.current = setTimeout(() => {
        warningShownRef.current = true;
        const shouldContinue = window.confirm(
          'You will be logged out in 1 minute due to inactivity. Click OK to stay logged in.'
        );
        if (shouldContinue) {
          resetTimer(); // Reset timer if user clicks OK
        }
      }, WARNING_TIMEOUT);
      
      // Set logout timeout
      timeoutRef.current = setTimeout(() => {
        logout();
        navigate('/login');
        alert('You have been logged out due to inactivity.');
      }, INACTIVITY_TIMEOUT);
    }
  };

  const handleUserActivity = () => {
    resetTimer();
  };

  useEffect(() => {
    if (!user) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      warningShownRef.current = false;
      return;
    }

    // Set up activity listeners
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Start the timer
    resetTimer();

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [user, logout, navigate]);

  // Reset timer when user changes
  useEffect(() => {
    if (user) {
      resetTimer();
    }
  }, [user]);

  return null; // This component doesn't render anything
};

export default AutoLogout; 