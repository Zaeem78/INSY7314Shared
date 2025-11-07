const express = require('express');
const router = express.Router();
const { validateLoginInput, validateRegistrationInput } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Login route
router.post('/login', validateLoginInput, authController.login);

// Register route (admin only)
router.post('/register', validateRegistrationInput, authController.register);

// Get current user
router.get('/me', authController.authenticate, authController.getCurrentUser);

// Logout route
router.post('/logout', authController.logout);

module.exports = router;
