'use strict';

const leaseService = require('./lease.service');
const ApiResponse  = require('../../utils/ApiResponse');

// ── GET /api/leases ───────────────────────────────────────────────────────────
/**
 * Lister tous les baux.
 * Filtres : ?tenantId=&apartmentId=&status=
 */
const getAllLeases = async (req, res, next) => {
  try {
    const leases = await leaseService.findAll(req.query);
    res.status(200).json(
      ApiResponse.success('Baux récupérés avec succès', leases, 200, { total: leases.length })
    );
  } catch (err) {
    next(err);
  }
};

// ── GET /api/leases/apartment/:apartmentId ────────────────────────────────────
/** Baux d'un appartement donné. */
const getLeasesByApartment = async (req, res, next) => {
  try {
    const leases = await leaseService.findByApartment(req.params.apartmentId);
    res.status(200).json(
      ApiResponse.success('Baux de l\'appartement récupérés avec succès', leases, 200, {
        total: leases.length,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ── POST /api/leases ──────────────────────────────────────────────────────────
/**
 * Créer un nouveau bail.
 * Body : { tenantId, apartmentId, startDate, endDate, rentAmount, deposit? }
 */
const createLease = async (req, res, next) => {
  try {
    const lease = await leaseService.create(req.body);
    res.status(201).json(ApiResponse.created('Bail créé avec succès', lease));
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/leases/:id ───────────────────────────────────────────────────────
/**
 * Mise à jour partielle d'un bail.
 * Passage de status à "ended" → libère automatiquement l'appartement.
 */
const updateLease = async (req, res, next) => {
  try {
    const lease = await leaseService.update(req.params.id, req.body);
    res.status(200).json(ApiResponse.success('Bail mis à jour avec succès', lease));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllLeases,
  getLeasesByApartment,
  createLease,
  updateLease,
};

