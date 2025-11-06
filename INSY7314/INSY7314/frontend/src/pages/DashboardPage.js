import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

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
      let errorMessage = 'Failed to fetch payments';

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

  if (loading) {
    return (
      <div className="container main-content">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Dashboard</h1>
        <Link to="/new-payment" className="btn">
          New Payment
        </Link>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <h3>Welcome back, {user?.fullName}!</h3>
          <p>Your account number: {user?.accountNumber}</p>
          <p>Ready to make international payments?</p>
        </div>

        <div className="card">
          <h3>Quick Stats</h3>
          <p>Total Payments: {payments.length}</p>
          <p>Pending: {payments.filter(p => p.status === 'PENDING').length}</p>
          <p>Submitted: {payments.filter(p => p.status === 'SUBMITTED').length}</p>
        </div>
      </div>

      <div className="card">
        <h3>Recent Payments</h3>
        {payments.length === 0 ? (
          <p>No payments found. <Link to="/new-payment">Create your first payment</Link></p>
        ) : (
          <div className="payments-list">
            {payments.slice(0, 5).map(payment => (
              <div key={payment.id} className="payment-item">
                <div className="payment-info">
                  <div className="payment-amount">
                    {payment.amount} {payment.currency}
                  </div>
                  <div className="payment-beneficiary">
                    To: {payment.beneficiaryName}
                  </div>
                  <div className="payment-date">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="payment-status">
                  {getStatusBadge(payment.status)}
                </div>
              </div>
            ))}
            {payments.length > 5 && (
              <p style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link to="/payment-history">View all payments</Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
