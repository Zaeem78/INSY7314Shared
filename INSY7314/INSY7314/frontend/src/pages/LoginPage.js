import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    accountNumber: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  const { login, isLoggedIn, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!formData.accountNumber.trim()) {
      errors.accountNumber = 'Account number is required';
    } else if (!/^[0-9]{1,20}$/.test(formData.accountNumber)) {
      errors.accountNumber = 'Account number must be numeric and up to 20 digits';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await login(formData.username, formData.accountNumber, formData.password);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-form">
      <h2>Login to Your Account</h2>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={validationErrors.username ? 'error' : ''}
            placeholder="Enter your username"
          />
          {validationErrors.username && (
            <div className="error">{validationErrors.username}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="accountNumber">Account Number</label>
          <input
            type="text"
            id="accountNumber"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            className={validationErrors.accountNumber ? 'error' : ''}
            placeholder="Enter your account number"
          />
          {validationErrors.accountNumber && (
            <div className="error">{validationErrors.accountNumber}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={validationErrors.password ? 'error' : ''}
            placeholder="Enter your password"
          />
          {validationErrors.password && (
            <div className="error">{validationErrors.password}</div>
          )}
        </div>

        <button
          type="submit"
          className="btn"
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default LoginPage;
