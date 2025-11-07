const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// Load environment variables first
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import app and other dependencies after env is loaded
const app = require('./app');
const { sequelize } = require('./config/database');
const { logger } = require('./utils/logger');
const { errorLogger, errorHandler } = require('./middleware/error');

// Constants
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'
  ]
}));

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API Routes
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Serve React app in production
if (isProduction) {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'), {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  });
}

// 404 handler for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found',
    code: 404
  });
});

// 404 handler for all other routes (non-API)
if (!isProduction) {
  app.use((req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Not Found',
      code: 404
    });
  });
}

// Error handling middleware (must be last)
app.use(errorLogger);
app.use(errorHandler);

// Start the server
const startServer = async () => {
  try {
    // Test database connection and sync models
    await sequelize.authenticate();
    logger.info('✅ Database connection has been established successfully.');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    logger.info('🔄 Database synchronized');
    
    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`🌐 Access the server at: http://localhost:${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
      
      if (isProduction) {
        logger.info('🔒 Running in PRODUCTION mode');
      } else {
        logger.warn('⚠️  Running in DEVELOPMENT mode - HTTPS is not enabled');
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
      logger.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
      logger.error(err.name, err.message);
      process.exit(1);
    });

    // Handle SIGTERM for graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        logger.info('💥 Process terminated!');
      });
    });

  } catch (error) {
    logger.error('Unable to start the server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

module.exports = { app };
