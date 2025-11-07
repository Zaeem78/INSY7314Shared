import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { SecurityProvider, useSecurity } from './contexts/SecurityContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

// Lazy load components for better performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const NewPaymentPage = lazy(() => import('./pages/NewPaymentPage'));
const PaymentHistoryPage = lazy(() => import('./pages/PaymentHistoryPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Custom PrivateRoute component with security checks
const PrivateRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, isRouteAccessible } = useSecurity();
  
  if (!isAuthenticated()) {
    // Redirect to login page with return URL
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }
  
  if (roles.length > 0 && !isRouteAccessible(roles)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// Main App Content
const AppContent = () => {
  return (
    <div className="App">
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner fullPage />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            
            {/* Protected routes */}
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
            
            {/* Error pages */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Default and 404 routes */}
            <Route path="/" element={
              <PrivateRoute>
                <Navigate to="/dashboard" replace />
              </PrivateRoute>
            } />
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

// Main App component with all providers
const App = () => {
  // Set security headers on initial load
  React.useEffect(() => {
    // Set security-related meta tags
    const setSecurityMetaTags = () => {
      // Add security headers via meta tags (as a fallback)
      const securityMetaTags = [
        { httpEquiv: 'Content-Security-Policy', content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'" },
        { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
        { httpEquiv: 'X-Frame-Options', content: 'DENY' },
        { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
        { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
        { httpEquiv: 'Permissions-Policy', content: 'camera=(), microphone=(), geolocation=()' },
      ];

      // Add meta tags if they don't exist
      securityMetaTags.forEach(tag => {
        if (!document.querySelector(`meta[http-equiv="${tag.httpEquiv}"]`)) {
          const meta = document.createElement('meta');
          meta.httpEquiv = tag.httpEquiv;
          meta.content = tag.content;
          document.head.appendChild(meta);
        }
      });

      // Set secure cookie attributes
      document.cookie = `secure-cookie=1; Secure; SameSite=Strict; Path=/`;
    };

    setSecurityMetaTags();
  }, []);

  return (
    <Router>
      <SecurityProvider>
        <AuthProvider>
          <PaymentProvider>
            <AppContent />
          </PaymentProvider>
        </AuthProvider>
      </SecurityProvider>
    </Router>
  );
};

export default App;
