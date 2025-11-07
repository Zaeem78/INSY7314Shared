// Email validation pattern
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password requirements:
// - At least 12 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/;

// Name validation (2-50 chars, letters, spaces, hyphens, apostrophes)
const NAME_REGEX = /^[a-zA-Z\s-']{2,50}$/;

// Username validation (3-30 chars, alphanumeric, underscores, hyphens, dots)
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;

// Phone number validation (international format)
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/; // E.164 format

// URL validation
const URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[\w- ./?%&=]*)?$/;

// Date format (YYYY-MM-DD)
const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

// HTML sanitization (basic)
const HTML_TAGS_REGEX = /<[^>]*>?/gm;

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateEmail = (email) => {
  if (typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validates a password against security requirements
 * @param {string} password - The password to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validatePassword = (password) => {
  if (typeof password !== 'string') return false;
  return PASSWORD_REGEX.test(password);
};

/**
 * Validates a name (first name, last name)
 * @param {string} name - The name to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateName = (name) => {
  if (typeof name !== 'string') return false;
  return NAME_REGEX.test(name.trim());
};

/**
 * Sanitize input based on type
 */
const sanitizeInput = (input, type) => {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') return input;
  
  // Basic XSS protection
  let sanitized = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();

  // Additional type-specific sanitization
  switch (type) {
    case 'email':
      return sanitized.toLowerCase();
    case 'name':
      return sanitized.replace(/[^a-zA-Z'\-\s]/g, '');
    case 'username':
      return sanitized.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    case 'phone':
      return sanitized.replace(/[^0-9+\-\s]/g, '');
    case 'url':
      return sanitized;
    case 'date':
      return sanitized;
    case 'amount':
      return sanitized.replace(/[^0-9.]/g, '');
    case 'accountNumber':
      return sanitized.replace(/\D/g, ''); // Keep only digits
    case 'swiftCode':
      return sanitized.toUpperCase().replace(/[^A-Z0-9]/g, '');
    case 'iban':
      return sanitized.toUpperCase().replace(/\s+/g, '');
    case 'currency':
      return sanitized.toUpperCase();
    case 'countryCode':
      return sanitized.toUpperCase();
    default:
      return sanitized;
  }
};

/**
 * Validate input against a pattern
 */
const validateInput = (input, type) => {
  if (input === null || input === undefined) return false;
  if (typeof input !== 'string') return false;
  
  const sanitized = sanitizeInput(input, type);
  const pattern = patterns[type];
  
  if (!pattern) return false;
  return pattern.test(sanitized);
};

/**
 * Validate South African ID number (Luhn algorithm)
 */
const validateIdNumber = (idNumber) => {
  if (!idNumber || typeof idNumber !== 'string') return false;
  
  // Basic format check
  if (!/^\d{13}$/.test(idNumber)) return false;
  
  // Luhn algorithm validation
  const digits = idNumber.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    let digit = digits[i];
    
    // Double every second digit from the right
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit = (digit % 10) + Math.floor(digit / 10);
      }
    }
    
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[12];
};

/**
 * Validate SWIFT/BIC code
 */
const validateSwiftCode = (swiftCode) => {
  if (!swiftCode) return false;
  
  const sanitized = sanitizeInput(swiftCode, 'swiftCode');
  
  // Basic format check (8 or 11 characters)
  if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(sanitized)) {
    return false;
  }
  
  // Additional validation can be added here, such as checking against a list of valid BIC codes
  
  return true;
};

/**
 * Validate IBAN (International Bank Account Number)
 */
const validateIban = (iban) => {
  if (!iban) return false;
  
  const sanitized = sanitizeInput(iban, 'iban');
  
  // Basic format check
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(sanitized)) {
    return false;
  }
  
  // Move first 4 characters to the end
  const rearranged = `${sanitized.substring(4)}${sanitized.substring(0, 4)}`;
  
  // Convert letters to numbers (A=10, B=11, ..., Z=35)
  let numeric = '';
  for (const char of rearranged) {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) { // A-Z
      numeric += (code - 55).toString();
    } else if (code >= 48 && code <= 57) { // 0-9
      numeric += char;
    } else {
      return false; // Invalid character
    }
  }
  
  // Check if the number modulo 97 is 1
  let remainder = '';
  for (const digit of numeric) {
    const current = `${remainder}${digit}`;
    remainder = (parseInt(current, 10) % 97).toString();
  }
  
  return parseInt(remainder, 10) === 1;
};

/**
 * Validate country code (ISO 3166-1 alpha-2)
 */
const validateCountryCode = (code) => {
  if (!code) return false;
  const sanitized = sanitizeInput(code, 'countryCode');
  return validCountryCodes.has(sanitized);
};

/**
 * Validate currency code (ISO 4217)
 */
const validateCurrency = (currency) => {
  if (!currency) return false;
  const sanitized = sanitizeInput(currency, 'currency');
  return supportedCurrencies.has(sanitized);
};

/**
 * Validate payment amount
 */
const validateAmount = (amount) => {
  if (amount === null || amount === undefined) return false;
  
  const amountStr = typeof amount === 'string' ? amount : amount.toString();
  const sanitized = sanitizeInput(amountStr, 'amount');
  
  // Check if it's a valid number
  if (isNaN(parseFloat(sanitized)) || !isFinite(sanitized)) {
    return false;
  }
  
  // Convert to number and check if it's positive
  const num = parseFloat(sanitized);
  return num > 0;
};

/**
 * Sanitizes and validates user input
 * @param {string} input - The input to sanitize
 * @param {string} type - The type of validation to apply
 * @returns {string|boolean} - Sanitized input or false if invalid
 */
const sanitizeAndValidateInput = (input, type) => {
  if (typeof input !== 'string') return false;
  
  const trimmed = input.trim();
  
  switch (type.toLowerCase()) {
    case 'email':
      return validateEmail(trimmed) ? trimmed : false;
    case 'password':
      return validatePassword(trimmed) ? trimmed : false;
    case 'name':
      return validateName(trimmed) ? trimmed : false;
    case 'username':
      return USERNAME_REGEX.test(trimmed) ? trimmed : false;
    case 'phone':
      return PHONE_REGEX.test(trimmed.replace(/[\s-]/g, '')) ? trimmed : false;
    case 'url':
      return URL_REGEX.test(trimmed) ? trimmed : false;
    case 'date':
      return DATE_REGEX.test(trimmed) ? trimmed : false;
    case 'text':
    default:
      // Basic XSS protection by removing HTML tags
      return trimmed.replace(HTML_TAGS_REGEX, '');
  }
};

/**
 * Validates user registration data
 * @param {object} userData - The user data to validate
 * @returns {object} - { isValid: boolean, errors: object }
 */
const validateUserData = (userData) => {
  const errors = {};
  
  if (!userData.email || !validateEmail(userData.email)) {
    errors.email = 'Please provide a valid email address';
  }
  
  if (!userData.password || !validatePassword(userData.password)) {
    errors.password = 'Password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters';
  }
  
  if (!userData.firstName || !validateName(userData.firstName)) {
    errors.firstName = 'Please provide a valid first name (2-50 characters, letters only)';
  }
  
  if (!userData.lastName || !validateName(userData.lastName)) {
    errors.lastName = 'Please provide a valid last name (2-50 characters, letters only)';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  EMAIL_REGEX,
  PASSWORD_REGEX,
  NAME_REGEX,
  USERNAME_REGEX,
  PHONE_REGEX,
  URL_REGEX,
  DATE_REGEX,
  validateEmail,
  validatePassword,
  validateName,
  sanitizeInput,
  validateUserData
};
