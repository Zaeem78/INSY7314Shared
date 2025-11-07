const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../middleware/logger');

// Password hashing configuration
const SALT_ROUNDS = 12;
const PASSWORD_MIN_LENGTH = 12;

// Generate a secure random token
const generateSecureToken = (length = 64) => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(Math.ceil(length / 2), (err, buffer) => {
      if (err) {
        logger.error('Error generating secure token', { error: err });
        return reject(err);
      }
      resolve(buffer.toString('hex').slice(0, length));
    });
  });
};

// Hash a password
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error('Error hashing password', { error });
    throw new Error('Failed to hash password');
  }
};

// Verify a password against a hash
const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Error verifying password', { error });
    throw new Error('Failed to verify password');
  }
};

// Validate password strength
const validatePasswordStrength = (password) => {
  const requirements = {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password),
    noSequentialChars: !/(\w)\1{2,}/.test(password),
    noCommonPatterns: !/(password|123|qwerty|admin|welcome|letmein)/i.test(password)
  };

  const isValid = Object.values(requirements).every(Boolean);
  
  if (!isValid) {
    const failedRequirements = Object.entries(requirements)
      .filter(([_, met]) => !met)
      .map(([req]) => {
        switch (req) {
          case 'minLength': return `be at least ${PASSWORD_MIN_LENGTH} characters long`;
          case 'hasUppercase': return 'contain at least one uppercase letter';
          case 'hasLowercase': return 'contain at least one lowercase letter';
          case 'hasNumber': return 'contain at least one number';
          case 'hasSpecialChar': return 'contain at least one special character';
          case 'noSequentialChars': return 'not contain sequential characters';
          case 'noCommonPatterns': return 'not contain common patterns';
          default: return '';
        }
      });

    return {
      isValid: false,
      message: `Password must: ${failedRequirements.join(', ')}.`
    };
  }

  return { isValid: true };
};

// Generate a secure session ID
const generateSessionId = () => {
  return `sess_${uuidv4()}`;
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/[&<>"']/g, (match) => {
      const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return escapeMap[match] || match;
    });
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Generate CSRF token
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Secure cookie options
const getSecureCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
  // domain: process.env.COOKIE_DOMAIN || 'yourdomain.com', // Uncomment and set in production
});

// Rate limiter configuration
const getRateLimiterConfig = (windowMs = 15 * 60 * 1000, max = 100) => ({
  windowMs,
  max,
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

// Headers configuration
const securityHeaders = {
  // Security Headers
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  
  // CSP Header (will be set dynamically based on app needs)
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';",
  
  // Feature Policy (for older browsers)
  'Feature-Policy': "geolocation 'none'; microphone 'none'; camera 'none'"
};

module.exports = {
  generateSecureToken,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateSessionId,
  sanitizeInput,
  isValidEmail,
  generateCsrfToken,
  getSecureCookieOptions,
  getRateLimiterConfig,
  securityHeaders,
  SALT_ROUNDS,
  PASSWORD_MIN_LENGTH
};
