'use strict';

const { Tenant, Lease, Apartment } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── GET /api/tenants ─────────────────────────────────────────────────────────
const getAllTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.findAll({ order: [['name', 'ASC']] });

    res.status(200).json(
      ApiResponse.success('Tenants fetched successfully', tenants, 200, {
        total: tenants.length,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/tenants/:id ─────────────────────────────────────────────────────
const getTenantById = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id, {
      include: [
        {
          model: Lease,
          as:    'leases',
          include: [{ model: Apartment, as: 'apartment' }],
          order: [['startDate', 'DESC']],
        },
      ],
    });
    if (!tenant) throw ApiError.notFound('Tenant not found');

    res.status(200).json(ApiResponse.success('Tenant fetched successfully', tenant));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/tenants ────────────────────────────────────────────────────────
const createTenant = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
      throw ApiError.badRequest('name, phone and email are required');
    }

    const existing = await Tenant.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) throw ApiError.conflict(`A tenant with email "${email}" already exists`);

    const tenant = await Tenant.create({ name, phone, email });

    res.status(201).json(ApiResponse.created('Tenant created successfully', tenant));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/tenants/:id ─────────────────────────────────────────────────────
const updateTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) throw ApiError.notFound('Tenant not found');

    const { name, phone, email } = req.body;

    // Check email uniqueness when changing it
    if (email && email.toLowerCase().trim() !== tenant.email) {
      const existing = await Tenant.findOne({ where: { email: email.toLowerCase().trim() } });
      if (existing) throw ApiError.conflict(`A tenant with email "${email}" already exists`);
    }

    await tenant.update({
      ...(name  !== undefined && { name  }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
    });

    res.status(200).json(ApiResponse.success('Tenant updated successfully', tenant));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/tenants/:id ──────────────────────────────────────────────────
const deleteTenant = async (req, res, next) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) throw ApiError.notFound('Tenant not found');

    // Prevent deletion if there are active leases
    const today  = new Date().toISOString().slice(0, 10);
    const { Op } = require('sequelize');
    const activeLeases = await Lease.count({
      where: {
        tenantId:  tenant.id,
        startDate: { [Op.lte]: today },
        endDate:   { [Op.gte]: today },
      },
    });

    if (activeLeases > 0) {
      throw ApiError.badRequest('Cannot delete a tenant with active leases');
    }

    await tenant.destroy();

    res.status(200).json(ApiResponse.success('Tenant deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
};

