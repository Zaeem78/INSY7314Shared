import axios from 'axios';
import { getCookie } from './cookies';

// Create axios instance with base config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add CSRF token to all requests
api.interceptors.request.use(
  (config) => {
    // Skip CSRF for GET/HEAD/OPTIONS requests
    if (['get', 'head', 'options'].includes(config.method.toLowerCase())) {
      return config;
    }

    // Get CSRF token from cookie
    const csrfToken = getCookie('XSRF-TOKEN');
    
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject({
        message: 'Network Error: Please check your internet connection',
        isNetworkError: true,
      });
    }

    const { status, data } = error.response;

    // Handle specific status codes
    switch (status) {
      case 401: // Unauthorized
        // Clear user session and redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?sessionExpired=true';
        }
        break;

      case 403: // Forbidden
        // Handle insufficient permissions
        console.error('Forbidden:', data.message || 'You do not have permission to access this resource');
        break;

      case 404: // Not Found
        console.error('Resource not found:', data.message || 'The requested resource was not found');
        break;

      case 429: // Too Many Requests
        console.error('Rate limited:', data.message || 'Too many requests, please try again later');
        break;

      case 500: // Internal Server Error
        console.error('Server Error:', data.message || 'An unexpected error occurred');
        break;

      default:
        console.error('Request failed with status:', status, data);
    }

    return Promise.reject({
      status,
      message: data?.message || 'An error occurred',
      ...data,
    });
  }
);

// Helper function to handle file uploads
const uploadFile = async (url, file, data = {}, onUploadProgress) => {
  const formData = new FormData();
  
  // Append file
  if (file) {
    formData.append('file', file);
  }

  // Append other data
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });

  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
};

export { api, uploadFile };
export default api;
