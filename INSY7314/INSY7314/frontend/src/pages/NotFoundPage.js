import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-6xl font-extrabold text-blue-600 sm:text-7xl">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
          Page not found
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Go back home
          </Link>
          <a
            href="mailto:support@paymentsystem.com"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Contact support
          </a>
        </div>
        
        <div className="mt-12">
          <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">
            Popular Pages
          </h3>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { name: 'Dashboard', href: '/dashboard' },
              { name: 'New Payment', href: '/new-payment' },
              { name: 'Payment History', href: '/payment-history' },
              { name: 'Help Center', href: '/help' },
            ].map((item) => (
              <li key={item.name} className="text-base">
                <Link
                  to={item.href}
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                >
                  {item.name} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500">
            Can't find what you're looking for?{' '}
            <a
              href="mailto:support@paymentsystem.com"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              Let us know
            </a>{' '}
            and we'll help you out.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
