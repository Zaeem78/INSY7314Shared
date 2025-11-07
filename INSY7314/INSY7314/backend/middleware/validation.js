const { body, query, param, validationResult } = require('express-validator');
const { 
  validateAmount, 
  validateCurrency, 
  validateSwiftCode, 
  validateIban,
  validateCountryCode,
  validateIdNumber,
  validateInput
} = require('../utils/validators');
const { AppError } = require('../utils/appError');

/**
 * Validate payment input
 */
const validatePaymentInput = [
  // Amount validation
  body('amount')
    .trim()
    .notEmpty().withMessage('Amount is required')
    .custom((value) => {
      if (!validateAmount(value)) {
        throw new Error('Invalid amount');
      }
      return true;
    })
    .toFloat(),
    
  // Currency validation
  body('currency')
    .trim()
    .notEmpty().withMessage('Currency is required')
    .custom((value) => {
      if (!validateCurrency(value)) {
        throw new Error('Unsupported currency');
      }
      return true;
    })
    .toUpperCase(),
    
  // Beneficiary details
  body('beneficiaryName')
    .trim()
    .notEmpty().withMessage('Beneficiary name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
  body('beneficiaryAccount')
    .trim()
    .notEmpty().withMessage('Account number is required')
    .isLength({ min: 8, max: 34 }).withMessage('Invalid account number length'),
    
  body('beneficiaryBank')
    .trim()
    .notEmpty().withMessage('Bank name is required'),
    
  body('beneficiaryBankCountry')
    .trim()
    .notEmpty().withMessage('Bank country is required')
    .custom((value) => {
      if (!validateCountryCode(value)) {
        throw new Error('Invalid country code');
      }
      return true;
    })
    .toUpperCase(),
    
  // SWIFT code validation
  body('swiftCode')
    .trim()
    .notEmpty().withMessage('SWIFT/BIC code is required')
    .custom((value) => {
      if (!validateSwiftCode(value)) {
        throw new Error('Invalid SWIFT/BIC code');
      }
      return true;
    })
    .toUpperCase(),
    
  // Optional IBAN validation
  body('iban')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (value && !validateIban(value)) {
        throw new Error('Invalid IBAN');
      }
      return true;
    })
    .toUpperCase(),
    
  // Optional purpose
  body('purpose')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Purpose cannot exceed 255 characters'),
    
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }));
      
      return next(new AppError('Validation failed', 400, errorMessages));
    }
    next();
  }
];

/**
 * Validate payment status update
 */
const validatePaymentStatusUpdate = [
  param('id').isUUID().withMessage('Invalid payment ID'),
  
  body('status')
    .isIn(['processing', 'completed', 'failed', 'cancelled', 'on_hold'])
    .withMessage('Invalid status'),
    
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }
    next();
  }
];

/**
 * Validate query parameters for payment listing
 */
const validatePaymentQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
    
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'on_hold'])
    .withMessage('Invalid status'),
    
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'amount', 'status', 'updatedAt'])
    .withMessage('Invalid sort field'),
    
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be ASC or DESC')
    .toUpperCase(),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400, errors.array()));
    }
    next();
  }
];

/**
 * Validate user registration input
 */
const validateRegistrationInput = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
    
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 12 }).withMessage('Password must be at least 12 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
    
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    
  body('idNumber')
    .trim()
    .notEmpty().withMessage('ID number is required')
    .custom((value) => {
      if (!validateIdNumber(value)) {
        throw new Error('Invalid ID number');
      }
      return true;
    }),
    
  body('accountNumber')
    .trim()
    .notEmpty().withMessage('Account number is required')
    .matches(/^\d{8,20}$/).withMessage('Invalid account number format'),
    
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+?[0-9\s-]{10,20}$/).withMessage('Invalid phone number format'),
    
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters'),
    
  body('dateOfBirth')
    .trim()
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Invalid date format (YYYY-MM-DD)')
    .custom((value) => {
      const dob = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      if (age < 18) {
        throw new Error('You must be at least 18 years old');
      }
      
      return true;
    }),
    
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }));
      
      return next(new AppError('Validation failed', 400, errorMessages));
    }
    next();
  }
];

module.exports = {
  validatePaymentInput,
  validatePaymentStatusUpdate,
  validatePaymentQuery,
  validateRegistrationInput
};
