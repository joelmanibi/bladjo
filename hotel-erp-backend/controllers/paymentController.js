'use strict';

const { Op }    = require('sequelize');
const { Payment } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE'];
const REFERENCE_TYPES = ['ROOM', 'HALL', 'APARTMENT', 'EXPENSE'];

// ─── GET /api/payments ────────────────────────────────────────────────────────
/**
 * List all payments.
 * Optional filters:
 *   ?referenceType=EXPENSE
 *   ?paymentMethod=CASH
 *   ?from=2026-01-01&to=2026-01-31   (paymentDate range)
 */
const getAllPayments = async (req, res, next) => {
  try {
    const where = {};

    if (req.query.referenceType) {
      if (!REFERENCE_TYPES.includes(req.query.referenceType)) {
        throw ApiError.badRequest(`referenceType must be one of: ${REFERENCE_TYPES.join(', ')}`);
      }
      where.referenceType = req.query.referenceType;
    }

    if (req.query.paymentMethod) {
      if (!PAYMENT_METHODS.includes(req.query.paymentMethod)) {
        throw ApiError.badRequest(`paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`);
      }
      where.paymentMethod = req.query.paymentMethod;
    }

    if (req.query.from || req.query.to) {
      where.paymentDate = {};
      if (req.query.from) where.paymentDate[Op.gte] = req.query.from;
      if (req.query.to)   where.paymentDate[Op.lte] = req.query.to;
    }

    const payments = await Payment.findAll({
      where,
      order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']],
    });

    // Calculate total for the current filter set
    const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    res.status(200).json(
      ApiResponse.success('Payments fetched successfully', payments, 200, {
        count: payments.length,
        total: parseFloat(total.toFixed(2)),
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/payments/:id ────────────────────────────────────────────────────
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) throw ApiError.notFound('Payment not found');

    res.status(200).json(ApiResponse.success('Payment fetched successfully', payment));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/payments ───────────────────────────────────────────────────────
/**
 * Record a new payment.
 * - referenceId is optional (nullable) — not required for EXPENSE payments.
 * - notes is optional but recommended for EXPENSE type.
 */
const createPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, paymentDate, referenceType, referenceId, notes } = req.body;

    if (!amount || !paymentMethod || !paymentDate || !referenceType) {
      throw ApiError.badRequest('amount, paymentMethod, paymentDate, and referenceType are required');
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      throw ApiError.badRequest(`paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`);
    }

    if (!REFERENCE_TYPES.includes(referenceType)) {
      throw ApiError.badRequest(`referenceType must be one of: ${REFERENCE_TYPES.join(', ')}`);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw ApiError.badRequest('amount must be a positive number');
    }

    const payment = await Payment.create({
      amount:        parsedAmount,
      paymentMethod,
      paymentDate,
      referenceType,
      referenceId:   referenceId || null,
      notes:         notes       || null,
    });

    res.status(201).json(ApiResponse.created('Payment recorded successfully', payment));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/payments/:id ─────────────────────────────────────────────────
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) throw ApiError.notFound('Payment not found');

    await payment.destroy();

    res.status(200).json(ApiResponse.success('Payment deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllPayments, getPaymentById, createPayment, deletePayment };

