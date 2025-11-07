const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sanitizeInput, validatePassword } = require('../utils/validators');

/**
 * Middleware to verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by ID from token
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid token. User not found.' 
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({ 
          success: false, 
          error: 'Account is deactivated. Please contact support.' 
        });
      }

      // Check if account is locked
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        return res.status(403).json({ 
          success: false, 
          error: 'Account is temporarily locked. Please try again later.' 
        });
      }

      // Attach user to request object
      req.user = user;
      req.token = token;
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          error: 'Session expired. Please log in again.' 
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token. Please log in again.' 
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during authentication.' 
    });
  }
};

/**
 * Middleware to check if user has required roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'You do not have permission to perform this action.' 
      });
    }

    next();
  };
};

/**
 * Middleware to validate and sanitize login input
 */
const validateLoginInput = (req, res, next) => {
  try {
    const { email, password } = req.body;
    const errors = {};

    // Sanitize and validate email
    const sanitizedEmail = sanitizeInput(email, 'email');
    if (!sanitizedEmail) {
      errors.email = 'Please provide a valid email address';
    }

    // Validate password (don't sanitize passwords)
    if (!password || typeof password !== 'string' || password.trim() === '') {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        errors 
      });
    }

    // Attach sanitized data to request
    req.sanitizedData = { email: sanitizedEmail, password };
    next();
  } catch (error) {
    console.error('Login validation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during input validation.' 
    });
  }
};

/**
 * Middleware to validate and sanitize user registration input
 */
const validateRegistrationInput = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const errors = {};

    // Sanitize and validate inputs
    const sanitizedEmail = sanitizeInput(email, 'email');
    const sanitizedFirstName = sanitizeInput(firstName, 'name');
    const sanitizedLastName = sanitizeInput(lastName, 'name');

    if (!sanitizedEmail) {
      errors.email = 'Please provide a valid email address';
    } else {
      // Check if email already exists
      const existingUser = await User.findOne({ where: { email: sanitizedEmail } });
      if (existingUser) {
        errors.email = 'Email is already registered';
      }
    }

    if (!sanitizedFirstName) {
      errors.firstName = 'Please provide a valid first name (2-50 characters, letters only)';
    }

    if (!sanitizedLastName) {
      errors.lastName = 'Please provide a valid last name (2-50 characters, letters only)';
    }

    if (!password || !validatePassword(password)) {
      errors.password = 'Password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        errors 
      });
    }

    // Attach sanitized data to request
    req.sanitizedData = {
      email: sanitizedEmail,
      password,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName
    };
    
    next();
  } catch (error) {
    console.error('Registration validation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during input validation.' 
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  validateLoginInput,
  validateRegistrationInput
};
