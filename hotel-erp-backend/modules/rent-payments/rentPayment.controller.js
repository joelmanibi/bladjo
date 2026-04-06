'use strict';

const rentPaymentService = require('./rentPayment.service');
const ApiResponse        = require('../../utils/ApiResponse');

// ── GET /api/rent-payments ────────────────────────────────────────────────────
/**
 * Lister tous les paiements de loyers.
 * Filtres : ?tenantId=&apartmentId=&leaseId=
 */
const getAllPayments = async (req, res, next) => {
  try {
    const payments = await rentPaymentService.findAll(req.query);
    res.status(200).json(
      ApiResponse.success('Paiements récupérés avec succès', payments, 200, {
        total: payments.length,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ── POST /api/rent-payments ───────────────────────────────────────────────────
/**
 * Enregistrer un paiement de loyer.
 * Body : { tenantId, apartmentId, amount, month, paymentDate, leaseId?, notes? }
 */
const createPayment = async (req, res, next) => {
  try {
    const payment = await rentPaymentService.create(req.body);
    res.status(201).json(ApiResponse.created('Paiement enregistré avec succès', payment));
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllPayments, createPayment };

