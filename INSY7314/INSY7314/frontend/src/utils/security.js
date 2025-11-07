/**
 * Security utility functions for the frontend
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} str - Input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeHTML = (str) => {
  if (!str) return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  const minLength = 12;
  const requirements = {
    minLength: password.length >= minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password),
    noSequentialChars: !/(\w)\1{2,}/.test(password),
    noCommonPatterns: !/(password|123|qwerty|admin|welcome|letmein)/i.test(password)
  };

  const isValid = Object.values(requirements).every(Boolean);
  
  if (!isValid) {
    const failedRequirements = [];
    
    if (!requirements.minLength) {
      failedRequirements.push(`be at least ${minLength} characters long`);
    }
    if (!requirements.hasUppercase) failedRequirements.push('contain at least one uppercase letter');
    if (!requirements.hasLowercase) failedRequirements.push('contain at least one lowercase letter');
    if (!requirements.hasNumber) failedRequirements.push('contain at least one number');
    if (!requirements.hasSpecialChar) failedRequirements.push('contain at least one special character');
    if (!requirements.noSequentialChars) failedRequirements.push('not contain sequential characters');
    if (!requirements.noCommonPatterns) failedRequirements.push('not contain common patterns');
    
    return {
      isValid: false,
      message: `Password must: ${failedRequirements.join(', ')}.`
    };
  }

  return { isValid: true };
};

/**
 * Generate a secure random string
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32) => {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
};

/**
 * Sanitize and validate user input
 * @param {string} input - User input to sanitize
 * @param {Object} options - Validation options
 * @returns {Object} Sanitized input and validation result
 */
export const sanitizeAndValidate = (input, options = {}) => {
  if (typeof input !== 'string') {
    return {
      value: input,
      isValid: false,
      message: 'Input must be a string'
    };
  }

  // Default options
  const {
    maxLength = 255,
    minLength = 1,
    allowHTML = false,
    allowSpecialChars = true,
    allowedPattern = null,
    trim = true,
    required = true
  } = options;

  // Check if input is required and empty
  if (required && (!input || input.trim() === '')) {
    return {
      value: '',
      isValid: false,
      message: 'This field is required'
    };
  }

  // Trim if needed
  let sanitized = trim ? input.trim() : input;

  // Check length
  if (sanitized.length < minLength) {
    return {
      value: sanitized,
      isValid: false,
      message: `Must be at least ${minLength} characters long`
    };
  }

  if (sanitized.length > maxLength) {
    return {
      value: sanitized.slice(0, maxLength),
      isValid: false,
      message: `Must be at most ${maxLength} characters long`
    };
  }

  // Sanitize HTML if not allowed
  if (!allowHTML) {
    sanitized = sanitizeHTML(sanitized);
  }

  // Validate against pattern if provided
  if (allowedPattern && !allowedPattern.test(sanitized)) {
    return {
      value: sanitized,
      isValid: false,
      message: 'Invalid format'
    };
  }

  // Check for special characters if not allowed
  if (!allowSpecialChars && /[^a-zA-Z0-9\s]/.test(sanitized)) {
    return {
      value: sanitized.replace(/[^a-zA-Z0-9\s]/g, ''),
      isValid: false,
      message: 'Special characters are not allowed'
    };
  }

  return {
    value: sanitized,
    isValid: true
  };
};

/**
 * Generate a secure CSRF token
 * @returns {string} CSRF token
 */
export const generateCSRFToken = () => {
  return generateRandomString(32);
};

/**
 * Set security headers for fetch requests
 * @param {Object} headers - Existing headers
 * @returns {Object} Headers with security settings
 */
export const getSecureHeaders = (headers = {}) => {
  return {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    ...headers
  };
};

/**
 * Sanitize URL to prevent XSS and open redirect vulnerabilities
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url) => {
  if (!url) return '';
  
  try {
    const parsedUrl = new URL(url, window.location.origin);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }
    
    // Prevent javascript: URLs
    if (parsedUrl.protocol === 'javascript:') {
      return '';
    }
    
    return parsedUrl.toString();
  } catch (e) {
    console.error('Invalid URL:', e);
    return '';
  }
};

/**
 * Escape special characters in a string for use in a regular expression
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
export const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export default {
  sanitizeHTML,
  isValidEmail,
  validatePassword,
  generateRandomString,
  sanitizeAndValidate,
  generateCSRFToken,
  getSecureHeaders,
  sanitizeUrl,
  escapeRegExp
};
