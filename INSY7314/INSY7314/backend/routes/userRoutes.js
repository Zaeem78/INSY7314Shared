const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validateRegistrationInput } = require('../middleware/validation');
const userController = require('../controllers/userController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all users (admin only)
router.get('/', authorize('admin'), userController.getAllUsers);

// Get current user profile
router.get('/me', userController.getCurrentUser);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user (admin or self)
router.put('/:id', userController.updateUser);

// Delete user (admin only)
router.delete('/:id', authorize('admin'), userController.deleteUser);

// Change password
router.post('/:id/change-password', userController.changePassword);

module.exports = router;
