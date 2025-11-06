import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/dashboard" className="navbar-brand">
          International Payment System
        </Link>
        <div className="navbar-links">
          {isLoggedIn ? (
            <>
              <span>Welcome, {user?.fullName}</span>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/new-payment">New Payment</Link>
              <Link to="/payment-history">Payment History</Link>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
