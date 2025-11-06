import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePayment } from '../contexts/PaymentContext';

const NewPaymentPage = () => {
  const navigate = useNavigate();
  const {
    paymentData,
    loading,
    error,
    success,
    createdPayment,
    updateField,
    resetForm,
    submitPayment,
    clearError,
    clearSuccess
  } = usePayment();

  useEffect(() => {
    // Reset form when component mounts
    resetForm();
  }, [resetForm]);

  useEffect(() => {
    // Redirect to dashboard after successful payment
    if (success && createdPayment) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, createdPayment, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateField(name, value);
    // Clear errors when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const result = await submitPayment();

    if (result.success) {
      clearSuccess(); // This will be set by the context
    }
  };

  if (success && createdPayment) {
    return (
      <div className="container main-content">
        <div className="success" style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Payment Created Successfully!</h2>
          <p>Your payment has been submitted and is pending verification.</p>
          <p>Payment ID: {createdPayment.id}</p>
          <p>Redirecting to dashboard in a few seconds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '30px' }}>
        <h1>New International Payment</h1>
        <p>Fill in the details below to initiate an international payment</p>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <form className="payment-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="amount">Amount *</label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={paymentData.amount}
              onChange={handleInputChange}
              placeholder="Enter amount (e.g., 1000.50)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="currency">Currency *</label>
            <select
              id="currency"
              name="currency"
              value={paymentData.currency}
              onChange={handleInputChange}
              required
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="paymentProvider">Payment Provider *</label>
          <select
            id="paymentProvider"
            name="paymentProvider"
            value={paymentData.paymentProvider}
            onChange={handleInputChange}
            required
          >
            <option value="SWIFT">SWIFT</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="beneficiaryName">Beneficiary Name *</label>
            <input
              type="text"
              id="beneficiaryName"
              name="beneficiaryName"
              value={paymentData.beneficiaryName}
              onChange={handleInputChange}
              placeholder="Enter beneficiary's full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="beneficiaryAccountNumber">Beneficiary Account Number *</label>
            <input
              type="text"
              id="beneficiaryAccountNumber"
              name="beneficiaryAccountNumber"
              value={paymentData.beneficiaryAccountNumber}
              onChange={handleInputChange}
              placeholder="Enter beneficiary's account number"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="beneficiarySwiftCode">SWIFT/BIC Code *</label>
          <input
            type="text"
            id="beneficiarySwiftCode"
            name="beneficiarySwiftCode"
            value={paymentData.beneficiarySwiftCode}
            onChange={handleInputChange}
            placeholder="Enter SWIFT/BIC code (e.g., ABCDUS33XXX)"
            required
          />
        </div>

        <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
          <button
            type="submit"
            className="btn"
            disabled={loading}
          >
            {loading ? 'Creating Payment...' : 'Create Payment'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={resetForm}
            disabled={loading}
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPaymentPage;
