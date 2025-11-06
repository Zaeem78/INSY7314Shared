import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div>Loading...</div>
      </div>
    );
  }

  return isLoggedIn ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
