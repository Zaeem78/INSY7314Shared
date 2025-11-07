const { createHash } = require('crypto');
const { logger } = require('../utils/logger');

// Generate a nonce for inline scripts
const generateNonce = () => {
  return createHash('sha256')
    .update(Math.random().toString())
    .digest('base64')
    .replace(/[^a-zA-Z0-9]/g, '');
};

// Default CSP directives
const defaultDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    (req, res) => `'nonce-${res.locals.nonce || generateNonce()}'`,
    "'strict-dynamic'"
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'"
  ],
  imgSrc: [
    "'self'",
    'data:',
    'blob:',
    'https:'
  ],
  fontSrc: [
    "'self'",
    'data:',
    'https:'
  ],
  connectSrc: [
    "'self'",
    'http://localhost:3001',
    'ws://localhost:3001'
  ],
  frameSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameAncestors: ["'self'"],
  formAction: ["'self'"],
  baseUri: ["'self'"],
  reportUri: '/api/security/csp-violation'
};

// Generate CSP header value
const generateCSP = (directives) => {
  return Object.entries(directives)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const values = value.map(v => typeof v === 'function' ? v() : v);
        return `${key} ${values.join(' ')}`;
      }
      return '';
    })
    .filter(Boolean)
    .join('; ');
};

// CSP middleware
const csp = (customDirectives = {}) => {
  return (req, res, next) => {
    try {
      // Generate a new nonce for each request
      const nonce = generateNonce();
      res.locals.nonce = nonce;

      // Merge default directives with custom ones
      const directives = { ...defaultDirectives, ...customDirectives };
      
      // Generate CSP header
      const cspHeader = generateCSP(directives);
      
      // Set security headers
      res.setHeader('Content-Security-Policy', cspHeader);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

      next();
    } catch (error) {
      logger.error('Error setting CSP headers:', error);
      next();
    }
  };
};

// CSP violation report endpoint
const handleCSPViolation = (req, res) => {
  try {
    if (req.body) {
      const violation = req.body['csp-report'];
      if (violation) {
        logger.warn('CSP Violation:', {
          documentUri: violation['document-uri'],
          violatedDirective: violation['violated-directive'],
          blockedUri: violation['blocked-uri'],
          sourceFile: violation['source-file'],
          lineNumber: violation['line-number'],
          columnNumber: violation['column-number'],
          referrer: req.get('referer'),
          userAgent: req.get('user-agent'),
          ip: req.ip
        });
      }
    }
  } catch (error) {
    logger.error('Error processing CSP violation report:', error);
  }
  res.status(204).end();
};

module.exports = {
  csp,
  generateNonce,
  handleCSPViolation,
  defaultDirectives,
  generateCSP
};
