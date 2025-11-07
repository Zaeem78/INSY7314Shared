import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as securityUtils from '../utils/security';
import { getCookie, setCookie, removeCookie } from '../utils/cookies';
import api from '../utils/api';

// Create security context
const SecurityContext = createContext();

// Custom hook to use security context
export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

// Security provider component
export const SecurityProvider = ({ children }) => {
  const [csrfToken, setCsrfToken] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [securityConfig, setSecurityConfig] = useState({
    cspEnabled: true,
    xssProtection: true,
    clickjackingProtection: true,
    contentTypeOptions: true,
    hstsEnabled: process.env.NODE_ENV === 'production',
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Initialize security features
  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        // Fetch CSRF token from the server
        await fetchCsrfToken();
        
        // Set up security headers
        setupSecurityHeaders();
        
        // Set up global error handling
        setupErrorHandling();
        
        // Protect against clickjacking
        if (securityConfig.clickjackingProtection) {
          document.addEventListener('DOMContentLoaded', () => {
            if (window !== window.top) {
              window.top.location = window.location;
            }
          });
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize security:', error);
      }
    };

    initializeSecurity();

    // Clean up event listeners
    return () => {
      // Any cleanup if needed
    };
  }, []);

  // Set up security headers
  const setupSecurityHeaders = () => {
    if (securityConfig.cspEnabled) {
      const meta = document.createElement('meta');
      meta.httpEquiv = "Content-Security-Policy";
      meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';";
      document.head.appendChild(meta);
    }

    if (securityConfig.xssProtection) {
      const metaXSS = document.createElement('meta');
      metaXSS.httpEquiv = "X-XSS-Protection";
      metaXSS.content = "1; mode=block";
      document.head.appendChild(metaXSS);
    }

    if (securityConfig.contentTypeOptions) {
      const metaCTO = document.createElement('meta');
      metaCTO.httpEquiv = "X-Content-Type-Options";
      metaCTO.content = "nosniff";
      document.head.appendChild(metaCTO);
    }

    if (securityConfig.clickjackingProtection) {
      const metaFrameOptions = document.createElement('meta');
      metaFrameOptions.httpEquiv = "X-Frame-Options";
      metaFrameOptions.content = "DENY";
      document.head.appendChild(metaFrameOptions);
    }

    if (securityConfig.hstsEnabled && window.location.protocol === 'https:') {
      const metaHSTS = document.createElement('meta');
      metaHSTS.httpEquiv = "Strict-Transport-Security";
      metaHSTS.content = "max-age=31536000; includeSubDomains";
      document.head.appendChild(metaHSTS);
    }
  };

  // Set up global error handling
  const setupErrorHandling = () => {
    // Global error handler
    window.onerror = (message, source, lineno, colno, error) => {
      console.error('Global error:', { message, source, lineno, colno, error });
      // Log to error tracking service
      logError({
        type: 'global',
        message: message.toString(),
        source,
        lineno,
        colno,
        stack: error?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
      return false; // Don't suppress default error handling
    };

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled rejection:', event.reason);
      logError({
        type: 'unhandled_rejection',
        message: event.reason?.message || 'Unknown error',
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    });
  };

  // Log security-related errors
  const logError = async (errorData) => {
    try {
      await api.post('/api/logs/error', {
        ...errorData,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      });
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  };

  // Fetch CSRF token from the server
  const fetchCsrfToken = async () => {
    try {
      // Check if we already have a valid token
      const existingToken = getCookie('XSRF-TOKEN');
      
      if (existingToken) {
        setCsrfToken(existingToken);
        return existingToken;
      }

      // Fetch new token from the server
      const response = await api.get('/api/csrf-token');
      const { token } = response.data;
      
      // Store the token in a secure, HTTP-only cookie
      setCookie('XSRF-TOKEN', token, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 24 * 60 * 60 // 24 hours
      });
      
      setCsrfToken(token);
      return token;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      throw error;
    }
  };

  // Sanitize user input
  const sanitizeInput = (input, options = {}) => {
    return securityUtils.sanitizeAndValidate(input, options);
  };

  // Validate password strength
  const validatePassword = (password) => {
    return securityUtils.validatePassword(password);
  };

  // Check if the current route requires authentication
  const requiresAuth = (path) => {
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
    return !publicPaths.some(publicPath => path.startsWith(publicPath));
  };

  // Check if the current route is accessible based on user role
  const isRouteAccessible = (requiredRoles = []) => {
    // Get user role from your auth context or state
    const userRole = 'user'; // Replace with actual user role
    
    if (requiredRoles.length === 0) return true;
    if (!userRole) return false;
    
    return requiredRoles.includes(userRole);
  };

  // Secure navigation
  const secureNavigate = (path, options = {}) => {
    const { requireAuth = true, requiredRoles = [] } = options;
    
    if (requireAuth && !isAuthenticated()) {
      // Redirect to login with a return URL
      navigate(`/login?returnTo=${encodeURIComponent(path)}`);
      return false;
    }
    
    if (requiredRoles.length > 0 && !isRouteAccessible(requiredRoles)) {
      // Redirect to not authorized page
      navigate('/unauthorized');
      return false;
    }
    
    // Sanitize the path to prevent XSS
    const sanitizedPath = securityUtils.sanitizeUrl(path) || '/';
    navigate(sanitizedPath);
    return true;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    // Implement your authentication check here
    // For example, check for a valid JWT token
    const token = localStorage.getItem('authToken');
    return !!token;
  };

  // Secure logout
  const secureLogout = async () => {
    try {
      // Call logout API
      await api.post('/api/auth/logout');
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Clear session storage
      sessionStorage.clear();
      
      // Clear cookies
      removeCookie('XSRF-TOKEN');
      
      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, clear client-side auth state
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.clear();
      removeCookie('XSRF-TOKEN');
      navigate('/login');
    }
  };

  // Secure API request
  const secureRequest = async (method, url, data = {}, options = {}) => {
    try {
      const response = await api({
        method,
        url,
        data,
        ...options,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': csrfToken,
          ...options.headers,
        },
      });
      
      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        // Handle unauthorized (token expired, etc.)
        await secureLogout();
        navigate(`/login?sessionExpired=true&returnTo=${encodeURIComponent(location.pathname)}`);
      } else if (error.response?.status === 403) {
        // Handle forbidden (insufficient permissions)
        navigate('/unauthorized');
      }
      
      throw error;
    }
  };

  // Security context value
  const value = {
    isInitialized,
    csrfToken,
    securityConfig,
    sanitizeInput,
    validatePassword,
    isAuthenticated,
    secureNavigate,
    secureLogout,
    secureRequest,
    logError,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export default SecurityContext;
