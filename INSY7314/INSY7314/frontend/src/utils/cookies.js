/**
 * Utility functions for secure cookie handling
 */

/**
 * Set a cookie with security attributes
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {Object} options - Cookie options
 */
export const setCookie = (name, value, options = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = isProduction ? '; Secure' : '';
  const sameSite = isProduction ? '; SameSite=Strict' : '; SameSite=Lax';
  
  // Default options
  const defaultOptions = {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: false, // Only accessible via HTTP(S)
    secure: isProduction, // Only sent over HTTPS in production
    sameSite: isProduction ? 'strict' : 'lax'
  };

  // Merge with provided options
  const cookieOptions = { ...defaultOptions, ...options };

  // Build cookie string
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  // Add options
  if (cookieOptions.maxAge) {
    cookieString += `; Max-Age=${cookieOptions.maxAge}`;
  }
  
  if (cookieOptions.path) {
    cookieString += `; Path=${cookieOptions.path}`;
  }
  
  if (cookieOptions.domain) {
    cookieString += `; Domain=${cookieOptions.domain}`;
  }
  
  if (cookieOptions.secure) {
    cookieString += '; Secure';
  }
  
  if (cookieOptions.httpOnly) {
    cookieString += '; HttpOnly';
  }
  
  if (cookieOptions.sameSite) {
    cookieString += `; SameSite=${cookieOptions.sameSite.charAt(0).toUpperCase() + cookieOptions.sameSite.slice(1)}`;
  }

  // Set the cookie
  document.cookie = cookieString;
};

/**
 * Get a cookie by name
 * @param {string} name - Cookie name
 * @returns {string|null} - Cookie value or null if not found
 */
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  
  return null;
};

/**
 * Remove a cookie by name
 * @param {string} name - Cookie name
 * @param {Object} options - Additional cookie options
 */
export const removeCookie = (name, options = {}) => {
  setCookie(name, '', {
    ...options,
    maxAge: -1 // Expire immediately
  });};

/**
 * Get all cookies as an object
 * @returns {Object} - Object with all cookies
 */
export const getAllCookies = () => {
  return document.cookie.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.split('=').map(c => c.trim());
    return { ...cookies, [name]: value };
  }, {});
};

/**
 * Check if cookies are enabled
 * @returns {boolean} - True if cookies are enabled
 */
export const areCookiesEnabled = () => {
  try {
    // Try to set a test cookie
    const testKey = 'test-cookie-' + Math.random().toString(36).substring(7);
    setCookie(testKey, 'test');
    
    // Check if the cookie was set
    const cookieWasSet = document.cookie.indexOf(testKey) !== -1;
    
    // Clean up
    removeCookie(testKey);
    
    return cookieWasSet;
  } catch (e) {
    return false;
  }
};

/**
 * Parse a cookie string into an object
 * @param {string} cookieString - Cookie string from document.cookie
 * @returns {Object} - Parsed cookies
 */
export const parseCookies = (cookieString) => {
  return cookieString.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.split('=').map(c => c.trim());
    return { ...cookies, [name]: value };
  }, {});
};

export default {
  set: setCookie,
  get: getCookie,
  remove: removeCookie,
  getAll: getAllCookies,
  enabled: areCookiesEnabled,
  parse: parseCookies
};
