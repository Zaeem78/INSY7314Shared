import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    this.logErrorToService(error, errorInfo);
    
    // Update state with error info
    this.setState({
      error: error,
      errorInfo: errorInfo,
      hasError: true
    });
  }

  logErrorToService(error, errorInfo) {
    // In a real app, you would send the error to an error reporting service
    console.error('Error caught by error boundary:', error, errorInfo);
    
    // Example: Send error to your error tracking service
    if (window.analytics) {
      window.analytics.track('error', {
        error: error.toString(),
        info: errorInfo.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We're sorry, but an unexpected error has occurred. Our team has been notified.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="text-left bg-gray-50 p-4 rounded mb-6 overflow-auto max-h-64">
                  <h3 className="font-semibold mb-2">Error Details:</h3>
                  <pre className="text-xs text-red-600 whitespace-pre-wrap">
                    {this.state.error && this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleReload}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Reload Page
                </button>
                <a
                  href="/"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-center"
                >
                  Return Home
                </a>
              </div>
              
              <p className="mt-6 text-sm text-gray-500">
                If the problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default ErrorBoundary;
