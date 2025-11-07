const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const hpp = require('hpp');
const cors = require('cors');
const { csp, handleCSPViolation } = require('./csp');

// Security headers middleware
const securityHeaders = (app) => {
  // Apply CSP middleware first
  app.use(csp());
  
  // Security middleware with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable default CSP as we're using our own
      crossOriginEmbedderPolicy: { policy: 'require-corp' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-site' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true
    })
  );
  
  // Additional security headers
  app.use((req, res, next) => {
    // Set X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Set X-XSS-Protection for older browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Set X-Frame-Options for older browsers
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Set Referrer-Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Set Permissions-Policy
    const permissionsPolicy = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'fullscreen=()',
      'payment=()',
      'sync-xhr=()',
      'autoplay=()',
      'gyroscope=()',
      'magnetometer=()',
      'midi=()',
      'picture-in-picture=()',
      'usb=()',
      'wake-lock=()',
      'screen-wake-lock=()',
      'web-share=()',
      'gamepad=()',
      'speaker=()',
      'vibrate=()',
      'notifications=()',
      'push=()',
      'hid=()',
      'idle-detection=()',
      'clipboard-read=()',
      'clipboard-write=()',
      'window-placement=()',
      'display-capture=()'
    ];
    
    res.setHeader('Permissions-Policy', permissionsPolicy.join(', '));
    
    // Set X-Permitted-Cross-Domain-Policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    
    // Set X-DNS-Prefetch-Control
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    
    // Set X-Download-Options for IE8+
    res.setHeader('X-Download-Options', 'noopen');
    
    // Set X-Download-Options for IE8+
    res.setHeader('X-Download-Options', 'noopen');
    
    // Set X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Set Expect-CT (Certificate Transparency)
    res.setHeader('Expect-CT', 'enforce, max-age=30');
    
    // Set Feature-Policy (legacy, replaced by Permissions-Policy)
    res.setHeader('Feature-Policy', [
      "camera 'none'",
      "microphone 'none'",
      "geolocation 'none'"
    ].join('; '));
    
    next();
  });
  
  // Add CSP violation reporting endpoint
  app.post('/api/security/csp-violation', express.json({ type: 'application/csp-report' }), handleCSPViolation);

  // Enable CORS with specific options
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 86400 // 24 hours
  }));

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    },
    skip: (req) => {
      // Skip rate limiting for health checks and static files
      return req.path === '/api/health' || 
             req.path.startsWith('/static/') ||
             req.path === '/favicon.ico';
    }
  });

  // Apply rate limiting to all API routes
  app.use('/api', apiLimiter);

  // Additional rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.'
  });

  app.use(['/api/auth/login', '/api/auth/register'], authLimiter);

  // Protect against HTTP Parameter Pollution attacks
  app.use(hpp());

  // Enable CSRF protection
  const csrfProtection = csrf({
    cookie: {
      key: '_csrf',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 3600 // 1 hour
    },
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
  });

  // Apply CSRF protection to all routes except API endpoints
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    return csrfProtection(req, res, next);
  });

  // Add CSRF token to all responses
  app.use((req, res, next) => {
    if (req.csrfToken) {
      res.cookie('XSRF-TOKEN', req.csrfToken(), {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false, // Needs to be accessible by client-side JavaScript
        sameSite: 'strict'
      });
    }
    next();
  });
};

module.exports = securityHeaders;
