const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');
const { validatePaymentInput } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new payment (customers only)
router.post(
  '/',
  authorize(['customer']),
  validatePaymentInput,
  paymentController.createPayment
);

// Get all payments (admin/staff can see all, customers see their own)
router.get(
  '/',
  authorize(['admin', 'staff', 'customer']),
  paymentController.getAllPayments
);

// Get payment by ID
router.get(
  '/:id',
  authorize(['admin', 'staff', 'customer']),
  paymentController.getPaymentById
);

// Update payment status (admin/staff only)
router.patch(
  '/:id/status',
  authorize(['admin', 'staff']),
  paymentController.updatePaymentStatus
);

// Get payment statistics (admin only)
router.get(
  '/stats/overview',
  authorize(['admin']),
  paymentController.getPaymentStats
);

module.exports = router;
