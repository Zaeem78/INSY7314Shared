import React, { createContext, useContext, useReducer } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const PaymentContext = createContext();

// Payment reducer
const paymentReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        paymentData: {
          ...state.paymentData,
          [action.field]: action.value
        }
      };
    case 'RESET_FORM':
      return {
        ...state,
        paymentData: {
          amount: '',
          currency: 'USD',
          paymentProvider: 'SWIFT',
          beneficiaryAccountNumber: '',
          beneficiarySwiftCode: '',
          beneficiaryName: ''
        },
        loading: false,
        error: null,
        success: false
      };
    case 'SUBMIT_START':
      return {
        ...state,
        loading: true,
        error: null,
        success: false
      };
    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        success: true,
        createdPayment: action.payload
      };
    case 'SUBMIT_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
        success: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'CLEAR_SUCCESS':
      return {
        ...state,
        success: false,
        createdPayment: null
      };
    default:
      return state;
  }
};

const initialState = {
  paymentData: {
    amount: '',
    currency: 'USD',
    paymentProvider: 'SWIFT',
    beneficiaryAccountNumber: '',
    beneficiarySwiftCode: '',
    beneficiaryName: ''
  },
  loading: false,
  error: null,
  success: false,
  createdPayment: null
};

export const PaymentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(paymentReducer, initialState);
  const { token } = useAuth();

  const updateField = (field, value) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  const submitPayment = async () => {
    dispatch({ type: 'SUBMIT_START' });

    try {
      const response = await axios.post('/payments', state.paymentData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      dispatch({
        type: 'SUBMIT_SUCCESS',
        payload: response.data
      });

      return { success: true, payment: response.data };
    } catch (error) {
      let errorMessage = 'Payment submission failed';

      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      dispatch({
        type: 'SUBMIT_FAILURE',
        payload: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const clearSuccess = () => {
    dispatch({ type: 'CLEAR_SUCCESS' });
  };

  const value = {
    ...state,
    updateField,
    resetForm,
    submitPayment,
    clearError,
    clearSuccess
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};
