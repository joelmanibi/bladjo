'use strict';

const { Op }                    = require('sequelize');
const { Lease, Apartment, Tenant } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Standard eager-load: lease → apartment + tenant */
const withRelations = {
  include: [
    { model: Apartment, as: 'apartment' },
    { model: Tenant,    as: 'tenant'    },
  ],
};

/**
 * Check if there is already an overlapping active lease for an apartment
 * (excluding a specific leaseId when updating).
 */
const hasOverlap = async (apartmentId, startDate, endDate, excludeId = null) => {
  const where = {
    apartmentId,
    startDate: { [Op.lt]: endDate   },
    endDate:   { [Op.gt]: startDate },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const count = await Lease.count({ where });
  return count > 0;
};

// ─── GET /api/leases ──────────────────────────────────────────────────────────
const getAllLeases = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.apartmentId) where.apartmentId = req.query.apartmentId;
    if (req.query.tenantId)    where.tenantId    = req.query.tenantId;

    const leases = await Lease.findAll({
      where,
      ...withRelations,
      order: [['startDate', 'DESC']],
    });

    res.status(200).json(
      ApiResponse.success('Leases fetched successfully', leases, 200, { total: leases.length })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/leases/:id ──────────────────────────────────────────────────────
const getLeaseById = async (req, res, next) => {
  try {
    const lease = await Lease.findByPk(req.params.id, withRelations);
    if (!lease) throw ApiError.notFound('Lease not found');

    res.status(200).json(ApiResponse.success('Lease fetched successfully', lease));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/leases ─────────────────────────────────────────────────────────
const createLease = async (req, res, next) => {
  try {
    const { apartmentId, tenantId, startDate, endDate, monthlyRent } = req.body;

    if (!apartmentId || !tenantId || !startDate || !endDate || monthlyRent === undefined) {
      throw ApiError.badRequest('apartmentId, tenantId, startDate, endDate and monthlyRent are required');
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (isNaN(start) || isNaN(end)) throw ApiError.badRequest('Invalid date format');
    if (end <= start) throw ApiError.badRequest('endDate must be after startDate');

    const apartment = await Apartment.findByPk(apartmentId);
    if (!apartment) throw ApiError.notFound('Apartment not found');
    if (apartment.status === 'OCCUPIED') {
      throw ApiError.badRequest('Apartment is already occupied');
    }

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) throw ApiError.notFound('Tenant not found');

    if (await hasOverlap(apartmentId, startDate, endDate)) {
      throw ApiError.conflict('A lease for this apartment already overlaps with the requested dates');
    }

    const lease = await Lease.create({ apartmentId, tenantId, startDate, endDate, monthlyRent });

    // Mark apartment as OCCUPIED
    await apartment.update({ status: 'OCCUPIED' });

    const result = await Lease.findByPk(lease.id, withRelations);
    res.status(201).json(ApiResponse.created('Lease created successfully', result));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/leases/:id ──────────────────────────────────────────────────────
const updateLease = async (req, res, next) => {
  try {
    const lease = await Lease.findByPk(req.params.id, withRelations);
    if (!lease) throw ApiError.notFound('Lease not found');

    const { startDate, endDate, monthlyRent } = req.body;

    const newStart = startDate || lease.startDate;
    const newEnd   = endDate   || lease.endDate;

    if (new Date(newEnd) <= new Date(newStart)) {
      throw ApiError.badRequest('endDate must be after startDate');
    }

    if ((startDate || endDate) && await hasOverlap(lease.apartmentId, newStart, newEnd, lease.id)) {
      throw ApiError.conflict('Updated dates overlap with another existing lease for this apartment');
    }

    await lease.update({
      ...(startDate   !== undefined && { startDate   }),
      ...(endDate     !== undefined && { endDate     }),
      ...(monthlyRent !== undefined && { monthlyRent }),
    });

    const result = await Lease.findByPk(lease.id, withRelations);
    res.status(200).json(ApiResponse.success('Lease updated successfully', result));
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/leases/:id/terminate ─────────────────────────────────────────
const terminateLease = async (req, res, next) => {
  try {
    const lease = await Lease.findByPk(req.params.id, withRelations);
    if (!lease) throw ApiError.notFound('Lease not found');

    const today = new Date().toISOString().slice(0, 10);

    if (lease.endDate <= today && lease.startDate > today) {
      throw ApiError.badRequest('Lease has not started yet and cannot be terminated');
    }

    // Set endDate to today to terminate
    await lease.update({ endDate: today });

    // Free the apartment
    await lease.apartment.update({ status: 'AVAILABLE' });

    const result = await Lease.findByPk(lease.id, withRelations);
    res.status(200).json(ApiResponse.success('Lease terminated successfully', result));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/leases/:id ───────────────────────────────────────────────────
const deleteLease = async (req, res, next) => {
  try {
    const lease = await Lease.findByPk(req.params.id, withRelations);
    if (!lease) throw ApiError.notFound('Lease not found');

    const today = new Date().toISOString().slice(0, 10);
    const isActive = lease.startDate <= today && today <= lease.endDate;

    // Free the apartment only if this was the active lease
    if (isActive) {
      await lease.apartment.update({ status: 'AVAILABLE' });
    }

    await lease.destroy();

    res.status(200).json(ApiResponse.success('Lease deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllLeases,
  getLeaseById,
  createLease,
  updateLease,
  terminateLease,
  deleteLease,
};

