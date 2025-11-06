const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

const { createUser, findUserByUsername, encrypt } = require('../models/database');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: 'Too many authentication attempts, please try again later.'
});

// Input validation schemas
const registrationSchema = Joi.object({
  fullName: Joi.string().pattern(/^[a-zA-Z\s\-']{2,100}$/).required(),
  idNumber: Joi.string().pattern(/^[a-zA-Z0-9]{5,20}$/).required(),
  accountNumber: Joi.string().pattern(/^[0-9]{1,20}$/).required(),
  username: Joi.string().pattern(/^[a-zA-Z0-9_]{3,20}$/).required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  accountNumber: Joi.string().pattern(/^[0-9]{1,20}$/).required(),
  password: Joi.string().required()
});

// Middleware to validate input
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      accountNumber: user.accountNumber
    },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '24h' }
  );
};

// Registration endpoint
router.post('/register', authLimiter, validateInput(registrationSchema), async (req, res) => {
  try {
    const { fullName, idNumber, accountNumber, username, password } = req.body;

    // Check if username already exists
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Generate salt and hash password
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    // Encrypt sensitive fields
    const encryptedFullName = encrypt(fullName);
    const encryptedIdNumber = encrypt(idNumber);
    const encryptedAccountNumber = encrypt(accountNumber);

    // Create user
    const userId = uuidv4();
    const newUser = {
      id: userId,
      fullName: encryptedFullName,
      idNumber: encryptedIdNumber,
      accountNumber: encryptedAccountNumber,
      username,
      passwordHash,
      salt
    };

    await createUser(newUser);

    // Generate JWT token
    const token = generateToken({
      id: userId,
      username,
      accountNumber
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        fullName,
        username,
        accountNumber
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', authLimiter, validateInput(loginSchema), async (req, res) => {
  try {
    const { username, accountNumber, password } = req.body;

    // Find user by username
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify account number matches (for additional security)
    if (user.accountNumber !== accountNumber) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        accountNumber: user.accountNumber
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint (for frontend to check if token is valid)
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

    // Get fresh user data
    const user = await findUserByUsername(decoded.username);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        accountNumber: user.accountNumber
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
