'use strict';

const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getAllPayments,
  getPaymentById,
  createPayment,
  deletePayment,
} = require('../controllers/paymentController');

// All routes require authentication
router.use(protect);

// GET /api/payments    ← ?referenceType=EXPENSE&from=2026-01-01&to=2026-01-31
router.get('/',    getAllPayments);
// GET /api/payments/:id
router.get('/:id', getPaymentById);
// POST /api/payments
router.post('/',   createPayment);
// DELETE /api/payments/:id
router.delete('/:id', deletePayment);

module.exports = router;

