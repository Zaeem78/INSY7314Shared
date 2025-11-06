const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const { createPayment, getUserPayments, encrypt } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Input validation schemas
const paymentSchema = Joi.object({
  amount: Joi.string().pattern(/^[0-9]+(\.[0-9]{1,2})?$/).required(),
  currency: Joi.string().pattern(/^[A-Z]{3}$/).required(),
  paymentProvider: Joi.string().valid('SWIFT').required(),
  beneficiaryAccountNumber: Joi.string().pattern(/^[a-zA-Z0-9]{1,34}$/).required(),
  beneficiarySwiftCode: Joi.string().pattern(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/).required(),
  beneficiaryName: Joi.string().pattern(/^[a-zA-Z\s\-']{2,100}$/).required()
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

// Authentication middleware
router.use(authenticateToken);

// Get user's payments
router.get('/', async (req, res) => {
  try {
    const payments = await getUserPayments(req.user.id);

    res.json(payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentProvider: payment.paymentProvider,
      beneficiaryAccountNumber: payment.beneficiaryAccountNumber,
      beneficiarySwiftCode: payment.beneficiarySwiftCode,
      beneficiaryName: payment.beneficiaryName,
      status: payment.status,
      createdAt: payment.createdAt,
      userName: payment.userName
    })));

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Create new payment
router.post('/', validateInput(paymentSchema), async (req, res) => {
  try {
    const { amount, currency, paymentProvider, beneficiaryAccountNumber, beneficiarySwiftCode, beneficiaryName } = req.body;

    // Encrypt sensitive beneficiary information
    const encryptedBeneficiaryAccountNumber = encrypt(beneficiaryAccountNumber);
    const encryptedBeneficiarySwiftCode = encrypt(beneficiarySwiftCode);
    const encryptedBeneficiaryName = encrypt(beneficiaryName);

    // Create payment record
    const paymentId = uuidv4();
    const paymentData = {
      id: paymentId,
      userId: req.user.id,
      amount: parseFloat(amount),
      currency,
      paymentProvider,
      beneficiaryAccountNumber: encryptedBeneficiaryAccountNumber,
      beneficiarySwiftCode: encryptedBeneficiarySwiftCode,
      beneficiaryName: encryptedBeneficiaryName
    };

    const newPayment = await createPayment(paymentData);

    // Return unencrypted data for the response (except we keep it encrypted in DB)
    res.status(201).json({
      id: newPayment.id,
      amount: newPayment.amount,
      currency: newPayment.currency,
      paymentProvider: newPayment.paymentProvider,
      beneficiaryAccountNumber,
      beneficiarySwiftCode,
      beneficiaryName,
      status: newPayment.status,
      createdAt: newPayment.createdAt
    });

  } catch (error) {
    console.error('Create payment error:', error);

    if (error.message.includes('FOREIGN KEY')) {
      return res.status(400).json({ error: 'Invalid user' });
    }

    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Get specific payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payments = await getUserPayments(req.user.id);
    const payment = payments.find(p => p.id === req.params.id);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentProvider: payment.paymentProvider,
      beneficiaryAccountNumber: payment.beneficiaryAccountNumber,
      beneficiarySwiftCode: payment.beneficiarySwiftCode,
      beneficiaryName: payment.beneficiaryName,
      status: payment.status,
      createdAt: payment.createdAt
    });

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

module.exports = router;
