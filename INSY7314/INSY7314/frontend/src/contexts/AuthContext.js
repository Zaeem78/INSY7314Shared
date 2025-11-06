import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// Set up axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
axios.defaults.withCredentials = true;

const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoggedIn: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoggedIn: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        isLoggedIn: false,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  isLoggedIn: false,
  user: null,
  token: null,
  loading: false,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { token, user: userData }
        });
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (username, accountNumber, password) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await axios.post('/auth/login', {
        username,
        accountNumber,
        password
      });

      const { token, user } = response.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user }
      });

      return { success: true };
    } catch (error) {
      let errorMessage = 'Login failed';

      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
