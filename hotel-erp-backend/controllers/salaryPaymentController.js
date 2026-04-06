'use strict';

const { SalaryPayment, Employee } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── GET /api/salary-payments ─────────────────────────────────────────────────
/**
 * Return all salary payments.
 * Optional filters: ?employeeId=3&month=2026-01
 */
const getAllPayments = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.employeeId) where.employeeId = req.query.employeeId;
    if (req.query.month)      where.month      = req.query.month;

    const payments = await SalaryPayment.findAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name', 'position', 'salary'] }],
      order: [['month', 'DESC'], ['paymentDate', 'DESC']],
    });

    res.status(200).json(
      ApiResponse.success('Salary payments fetched successfully', payments, 200, { total: payments.length })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/salary-payments/:id ────────────────────────────────────────────
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await SalaryPayment.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee' }],
    });
    if (!payment) throw ApiError.notFound('Salary payment not found');

    res.status(200).json(ApiResponse.success('Salary payment fetched successfully', payment));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/salary-payments ────────────────────────────────────────────────
/**
 * Record a salary payment.
 * - amount defaults to employee.salary if not supplied (covers the standard case).
 * - Rejects duplicate payment for the same employee + month.
 */
const createPayment = async (req, res, next) => {
  try {
    const { employeeId, month, paymentDate, amount } = req.body;

    if (!employeeId || !month || !paymentDate) {
      throw ApiError.badRequest('employeeId, month, and paymentDate are required');
    }

    // Validate month format YYYY-MM
    if (!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw ApiError.badRequest('month must be in YYYY-MM format (e.g. 2026-01)');
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee) throw ApiError.notFound('Employee not found');

    // Prevent double payment for the same month
    const existing = await SalaryPayment.findOne({ where: { employeeId, month } });
    if (existing) {
      throw ApiError.conflict(
        `A salary payment for employee "${employee.name}" in ${month} already exists.`
      );
    }

    // Use employee's configured salary if amount is not explicitly provided
    const finalAmount = amount !== undefined ? amount : employee.salary;

    const payment = await SalaryPayment.create({
      employeeId,
      amount: finalAmount,
      month,
      paymentDate,
    });

    await payment.reload({ include: [{ model: Employee, as: 'employee' }] });

    res.status(201).json(ApiResponse.created('Salary payment recorded successfully', payment));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/salary-payments/:id ─────────────────────────────────────────
const deletePayment = async (req, res, next) => {
  try {
    const payment = await SalaryPayment.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee' }],
    });
    if (!payment) throw ApiError.notFound('Salary payment not found');

    await payment.destroy();

    res.status(200).json(ApiResponse.success('Salary payment deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllPayments, getPaymentById, createPayment, deletePayment };

