const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const path = require('path');
const { csp, handleCSPViolation } = require('./middleware/csp');
const { errorHandler } = require('./middleware/error');
const { logger } = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Initialize express app
const app = express();

// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // We'll handle CSP separately
  crossOriginEmbedderPolicy: false, // Required for some frontend frameworks
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 15552000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'same-origin' },
  xssFilter: true
}));

// Implement CORS
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token']
}));

// Trust first proxy (if behind a reverse proxy like Nginx)
app.set('trust proxy', 1);

// Limit requests from same API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: { 
    status: 'error',
    message: 'Too many requests from this IP, please try again in 15 minutes!'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Body parser, reading data from body into req.body
app.use(express.json({ 
  limit: '10kb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON payload');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10kb',
  parameterLimit: 100
}));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize({
  onSanitize: ({ req, key }) => {
    logger.warn(`NoSQL injection attempt detected in ${req.originalUrl}: ${key}`);
  }
}));

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'sort', 'page', 'limit', 'fields', 'status', 'userId', 'currency', 'amount'
  ]
}));

// Content Security Policy
app.use(csp());

// CSP Violation Reporting
app.post('/api/security/csp-violation', express.json({ type: 'application/csp-report' }), handleCSPViolation);

// Request logging
app.use((req, res, next) => {
  // Skip logging for health checks and static files
  if (req.path === '/health' || req.path.startsWith('/static/')) {
    return next();
  }
  
  const start = Date.now();
  const { method, originalUrl, ip, body, query, params } = req;
  
  // Log request details (excluding sensitive data)
  logger.info(`[${new Date().toISOString()}] ${method} ${originalUrl}`, {
    ip,
    method,
    url: originalUrl,
    query,
    params,
    body: method === 'POST' || method === 'PUT' ? 
      { ...body, password: body.password ? '***' : undefined } : undefined,
    userAgent: req.get('user-agent')
  });
  
  // Log response details when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[${new Date().toISOString()}] ${method} ${originalUrl} ${res.statusCode} ${duration}ms`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length')
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build'), {
    maxAge: '1y',
    setHeaders: (res, path) => {
      // Cache static assets for 1 year
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  
  // Handle SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'));
  });
}

// Handle unhandled routes
app.all('*', (req, res, next) => {
  const error = new Error(`Can't find ${req.originalUrl} on this server!`);
  error.statusCode = 404;
  error.status = 'fail';
  
  // Log 404 errors
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    referrer: req.get('referer')
  });
  
  next(error);
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // Set default status code and status if not set
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Log the error
  logger.error(`${err.statusCode} - ${err.message}`, {
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      name: err.name,
      code: err.code
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: req.body,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }
  });
  
  // Only send error details in development
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production error response
    if (err.isOperational) {
      // Operational, trusted error: send message to client
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // Programming or other unknown error: don't leak error details
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!'
      });
    }
  }
});

module.exports = app;
