import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PaymentProvider } from './contexts/PaymentContext';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import DashboardPage from './pages/DashboardPage';
import NewPaymentPage from './pages/NewPaymentPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PaymentProvider>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              } />
              <Route path="/new-payment" element={
                <PrivateRoute>
                  <NewPaymentPage />
                </PrivateRoute>
              } />
              <Route path="/payment-history" element={
                <PrivateRoute>
                  <PaymentHistoryPage />
                </PrivateRoute>
              } />
              <Route path="/" element={<LoginPage />} />
            </Routes>
          </div>
        </PaymentProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
