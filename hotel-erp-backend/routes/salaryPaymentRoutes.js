'use strict';

const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getAllPayments,
  getPaymentById,
  createPayment,
  deletePayment,
} = require('../controllers/salaryPaymentController');

router.use(protect);

// GET /api/salary-payments          ← ?employeeId=3&month=2026-01
router.get('/',    getAllPayments);
// GET /api/salary-payments/:id
router.get('/:id', getPaymentById);
// POST /api/salary-payments
router.post('/',   createPayment);
// DELETE /api/salary-payments/:id
router.delete('/:id', deletePayment);

module.exports = router;

