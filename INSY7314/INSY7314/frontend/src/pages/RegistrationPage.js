import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    accountNumber: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

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

    // Clear general error when user starts typing
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    const errors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (!/^[a-zA-Z\s\-']{2,100}$/.test(formData.fullName)) {
      errors.fullName = 'Full name can only contain letters, spaces, hyphens, and apostrophes';
    }

    // ID number validation
    if (!formData.idNumber.trim()) {
      errors.idNumber = 'ID number is required';
    } else if (!/^[a-zA-Z0-9]{5,20}$/.test(formData.idNumber)) {
      errors.idNumber = 'ID number must be alphanumeric and 5-20 characters';
    }

    // Account number validation
    if (!formData.accountNumber.trim()) {
      errors.accountNumber = 'Account number is required';
    } else if (!/^[0-9]{1,20}$/.test(formData.accountNumber)) {
      errors.accountNumber = 'Account number must be numeric and up to 20 digits';
    }

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      errors.username = 'Username must be alphanumeric with underscores, 3-20 characters';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('/auth/register', {
        fullName: formData.fullName.trim(),
        idNumber: formData.idNumber.trim(),
        accountNumber: formData.accountNumber.trim(),
        username: formData.username.trim(),
        password: formData.password
      });

      // Auto-login after successful registration
      const loginResult = await login(formData.username.trim(), formData.accountNumber.trim(), formData.password);

      if (loginResult.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError('Registration successful, but login failed. Please try logging in manually.');
      }
    } catch (error) {
      let errorMessage = 'Registration failed';

      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-form">
        <div className="success">
          <h2>Registration Successful!</h2>
          <p>You have been successfully registered and logged in. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2>Create Your Account</h2>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={validationErrors.fullName ? 'error' : ''}
            placeholder="Enter your full name"
          />
          {validationErrors.fullName && (
            <div className="error">{validationErrors.fullName}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="idNumber">ID Number</label>
          <input
            type="text"
            id="idNumber"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            className={validationErrors.idNumber ? 'error' : ''}
            placeholder="Enter your ID number"
          />
          {validationErrors.idNumber && (
            <div className="error">{validationErrors.idNumber}</div>
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
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={validationErrors.username ? 'error' : ''}
            placeholder="Choose a username"
          />
          {validationErrors.username && (
            <div className="error">{validationErrors.username}</div>
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
            placeholder="Create a password"
          />
          {validationErrors.password && (
            <div className="error">{validationErrors.password}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={validationErrors.confirmPassword ? 'error' : ''}
            placeholder="Confirm your password"
          />
          {validationErrors.confirmPassword && (
            <div className="error">{validationErrors.confirmPassword}</div>
          )}
        </div>

        <button
          type="submit"
          className="btn"
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default RegistrationPage;
