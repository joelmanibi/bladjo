'use strict';

const express = require('express');
const router  = express.Router();

const { protect }                       = require('../../middleware/authMiddleware');
const { getAllPayments, createPayment } = require('./rentPayment.controller');

// Toutes les routes nécessitent un JWT valide
router.use(protect);

/**
 * @route  GET /api/rent-payments
 * @desc   Lister tous les paiements (filtres: ?tenantId=&apartmentId=&leaseId=)
 * @access Protected
 */
router.get('/', getAllPayments);

/**
 * @route  POST /api/rent-payments
 * @desc   Enregistrer un paiement de loyer
 * @access Protected
 * @body   { tenantId, apartmentId, amount, month, paymentDate, leaseId?, notes? }
 */
router.post('/', createPayment);

module.exports = router;

