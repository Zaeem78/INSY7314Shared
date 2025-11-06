import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const PaymentHistoryPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const { token } = useAuth();

  useEffect(() => {
    fetchPayments();
  }, [token]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/payments', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPayments(response.data);
    } catch (error) {
      let errorMessage = 'Failed to fetch payment history';

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

  const getStatusBadge = (status) => {
    const statusColors = {
      'PENDING': 'badge-pending',
      'VERIFIED': 'badge-verified',
      'SUBMITTED': 'badge-submitted',
      'FAILED': 'badge-failed'
    };

    return (
      <span className={`status-badge ${statusColors[status] || 'badge-default'}`}>
        {status}
      </span>
    );
  };

  const filteredPayments = filter === 'ALL'
    ? payments
    : payments.filter(payment => payment.status === filter);

  if (loading) {
    return (
      <div className="container main-content">
        <div className="loading">Loading payment history...</div>
      </div>
    );
  }

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '30px' }}>
        <h1>Payment History</h1>
        <p>View all your payment transactions</p>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="statusFilter" style={{ marginRight: '10px' }}>
          Filter by Status:
        </label>
        <select
          id="statusFilter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">All Payments</option>
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="card">
          <p>No payments found matching the selected filter.</p>
        </div>
      ) : (
        <div className="payments-history">
          {filteredPayments.map(payment => (
            <div key={payment.id} className="card payment-history-item">
              <div className="payment-history-header">
                <div className="payment-history-amount">
                  <strong>{payment.amount} {payment.currency}</strong>
                </div>
                <div className="payment-history-status">
                  {getStatusBadge(payment.status)}
                </div>
              </div>

              <div className="payment-history-details">
                <div className="detail-row">
                  <span className="detail-label">Beneficiary:</span>
                  <span className="detail-value">{payment.beneficiaryName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Account:</span>
                  <span className="detail-value">{payment.beneficiaryAccountNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">SWIFT Code:</span>
                  <span className="detail-value">{payment.beneficiarySwiftCode}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Provider:</span>
                  <span className="detail-value">{payment.paymentProvider}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">
                    {new Date(payment.createdAt).toLocaleString()}
                  </span>
                </div>
                {payment.status === 'FAILED' && (
                  <div className="detail-row">
                    <span className="detail-label">Error:</span>
                    <span className="detail-value error">Payment processing failed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryPage;
