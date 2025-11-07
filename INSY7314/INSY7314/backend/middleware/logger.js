const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;
const path = require('path');
const fs = require('fs');
const util = require('util');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  // Add metadata if present
  if (Object.keys(meta).length > 0) {
    log += ' ' + util.inspect(meta, { depth: null, colors: true });
  }
  
  return log;
});

// Create logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    json()
  ),
  transports: [
    // Write all logs with level 'error' and below to error.log
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Write all logs to combined.log
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ],
  exceptionHandlers: [
    new transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exitOnError: false
});

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      consoleFormat
    ),
    level: 'debug'
  }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  // Skip health check and static file requests
  if (req.path === '/api/health' || req.path.startsWith('/static/')) {
    return next();
  }

  const start = Date.now();
  const { method, originalUrl, ip, headers } = req;
  
  // Log request start
  logger.info('Request started', {
    method,
    url: originalUrl,
    ip,
    userAgent: headers['user-agent'],
    referrer: headers.referer || '',
    body: method !== 'GET' ? req.body : {},
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  });

  // Log response when it's finished
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - start;
    
    // Log the response
    logger.info('Request completed', {
      method,
      url: originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 0,
      timestamp: new Date().toISOString()
    });
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      ...err
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
      user: req.user ? req.user.id : 'anonymous'
    },
    timestamp: new Date().toISOString()
  });
  
  next(err);
};

// Security event logger
const securityLogger = {
  auth: {
    success: (userId, metadata = {}) => {
      logger.info('Authentication success', {
        event: 'auth_success',
        userId,
        ...metadata,
        timestamp: new Date().toISOString()
      });
    },
    failure: (reason, metadata = {}) => {
      logger.warn('Authentication failure', {
        event: 'auth_failure',
        reason,
        ...metadata,
        timestamp: new Date().toISOString()
      });
    },
    passwordReset: (userId, metadata = {}) => {
      logger.info('Password reset', {
        event: 'password_reset',
        userId,
        ...metadata,
        timestamp: new Date().toISOString()
      });
    }
  },
  access: {
    denied: (userId, resource, action, metadata = {}) => {
      logger.warn('Access denied', {
        event: 'access_denied',
        userId: userId || 'anonymous',
        resource,
        action,
        ...metadata,
        timestamp: new Date().toISOString()
      });
    },
    granted: (userId, resource, action, metadata = {}) => {
      logger.info('Access granted', {
        event: 'access_granted',
        userId,
        resource,
        action,
        ...metadata,
        timestamp: new Date().toISOString()
      });
    }
  },
  security: {
    suspicious: (event, metadata = {}) => {
      logger.warn('Suspicious activity detected', {
        event: `security_${event}`,
        ...metadata,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { 
    promise, 
    reason: reason instanceof Error ? reason.stack : reason,
    timestamp: new Date().toISOString()
  });
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { 
    error: error.stack || error,
    timestamp: new Date().toISOString()
  });  
  // In production, you might want to gracefully shut down here
  // process.exit(1);
});

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  securityLogger
};
