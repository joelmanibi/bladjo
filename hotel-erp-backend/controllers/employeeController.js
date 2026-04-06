'use strict';

const { Op }                     = require('sequelize');
const { Employee, SalaryPayment } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── GET /api/employees ───────────────────────────────────────────────────────
/**
 * Return all employees.
 * Optional filter: ?position=Receptionist&name=Ali
 */
const getAllEmployees = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.position) where.position = req.query.position;
    if (req.query.name) {
      where.name = { [Op.like]: `%${req.query.name}%` };
    }

    const employees = await Employee.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.status(200).json(
      ApiResponse.success('Employees fetched successfully', employees, 200, { total: employees.length })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/employees/:id ───────────────────────────────────────────────────
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [{ model: SalaryPayment, as: 'salaryPayments', order: [['month', 'DESC']] }],
    });
    if (!employee) throw ApiError.notFound('Employee not found');

    res.status(200).json(ApiResponse.success('Employee fetched successfully', employee));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/employees ──────────────────────────────────────────────────────
const createEmployee = async (req, res, next) => {
  try {
    const { name, phone, position, salary } = req.body;

    if (!name || !phone || !position || salary === undefined) {
      throw ApiError.badRequest('name, phone, position, and salary are required');
    }

    const employee = await Employee.create({ name, phone, position, salary });

    res.status(201).json(ApiResponse.created('Employee created successfully', employee));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/employees/:id ───────────────────────────────────────────────────
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) throw ApiError.notFound('Employee not found');

    const { name, phone, position, salary } = req.body;

    await employee.update({
      ...(name     !== undefined && { name     }),
      ...(phone    !== undefined && { phone    }),
      ...(position !== undefined && { position }),
      ...(salary   !== undefined && { salary   }),
    });

    res.status(200).json(ApiResponse.success('Employee updated successfully', employee));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/employees/:id ────────────────────────────────────────────────
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) throw ApiError.notFound('Employee not found');

    const paymentCount = await SalaryPayment.count({ where: { employeeId: employee.id } });
    if (paymentCount > 0) {
      throw ApiError.conflict(
        `Cannot delete employee "${employee.name}" — ${paymentCount} salary payment record(s) exist. Archive the employee instead.`
      );
    }

    await employee.destroy();

    res.status(200).json(ApiResponse.success('Employee deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee };

