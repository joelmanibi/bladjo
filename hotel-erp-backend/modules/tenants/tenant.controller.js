'use strict';

const tenantService = require('./tenant.service');
const ApiResponse   = require('../../utils/ApiResponse');

// ─── GET /api/tenants ─────────────────────────────────────────────────────────
/**
 * Retourne tous les locataires.
 * Filtres optionnels : ?firstname=&lastname=&phone=
 */
const getAllTenants = async (req, res, next) => {
  try {
    const tenants = await tenantService.findAll(req.query);
    res.status(200).json(
      ApiResponse.success('Locataires récupérés avec succès', tenants, 200, {
        total: tenants.length,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/tenants/:id ─────────────────────────────────────────────────────
/**
 * Retourne un locataire par son id (avec ses baux).
 */
const getTenantById = async (req, res, next) => {
  try {
    const tenant = await tenantService.findById(req.params.id);
    res.status(200).json(ApiResponse.success('Locataire récupéré avec succès', tenant));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/tenants ────────────────────────────────────────────────────────
/**
 * Crée un nouveau locataire.
 * Body: { firstname, lastname, phone, email, identityNumber? }
 */
const createTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.create(req.body);
    res.status(201).json(ApiResponse.created('Locataire créé avec succès', tenant));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/tenants/:id ─────────────────────────────────────────────────────
/**
 * Mise à jour partielle d'un locataire.
 */
const updateTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.update(req.params.id, req.body);
    res.status(200).json(ApiResponse.success('Locataire mis à jour avec succès', tenant));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/tenants/:id ──────────────────────────────────────────────────
/**
 * Supprime un locataire (bloqué si baux actifs).
 */
const deleteTenant = async (req, res, next) => {
  try {
    await tenantService.remove(req.params.id);
    res.status(200).json(ApiResponse.success('Locataire supprimé avec succès'));
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

