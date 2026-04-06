'use strict';

const { Op }                              = require('sequelize');
const { RentPayment, Tenant, Apartment, Lease } = require('../../models');
const ApiError                            = require('../../utils/ApiError');

// ── Relations eager-load ──────────────────────────────────────────────────────
const withRelations = {
  include: [
    { model: Tenant,    as: 'tenant'    },
    { model: Apartment, as: 'apartment' },
    { model: Lease,     as: 'lease'     },
  ],
};

// ── findAll ───────────────────────────────────────────────────────────────────
/**
 * Lister tous les paiements de loyers.
 * Filtres : ?tenantId=&apartmentId=&leaseId=
 *
 * @param {{ tenantId?, apartmentId?, leaseId? }} filters
 * @returns {Promise<RentPayment[]>}
 */
const findAll = async (filters = {}) => {
  const where = {};
  if (filters.tenantId)    where.tenantId    = filters.tenantId;
  if (filters.apartmentId) where.apartmentId = filters.apartmentId;
  if (filters.leaseId)     where.leaseId     = filters.leaseId;

  return RentPayment.findAll({
    where,
    ...withRelations,
    order: [['paymentDate', 'DESC']],
  });
};

// ── create ────────────────────────────────────────────────────────────────────
/**
 * Enregistrer un paiement de loyer.
 *
 * @param {{ tenantId, apartmentId, amount, month, paymentDate, leaseId?, notes? }} payload
 * @returns {Promise<RentPayment>}
 */
const create = async (payload) => {
  const { tenantId, apartmentId, amount, month, paymentDate, leaseId, notes } = payload;

  // Validations obligatoires
  if (!tenantId)    throw ApiError.badRequest('Le locataire est obligatoire');
  if (!apartmentId) throw ApiError.badRequest("L'appartement est obligatoire");
  if (!amount && amount !== 0) throw ApiError.badRequest('Le montant est obligatoire');
  if (!month)       throw ApiError.badRequest('Le mois est obligatoire');
  if (!paymentDate) throw ApiError.badRequest('La date de paiement est obligatoire');

  // Vérifier l'existence du locataire et de l'appartement
  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) throw ApiError.notFound('Locataire introuvable');

  const apartment = await Apartment.findByPk(apartmentId);
  if (!apartment) throw ApiError.notFound('Appartement introuvable');

  // Résoudre leaseId automatiquement si non fourni
  let resolvedLeaseId = leaseId || null;
  if (!resolvedLeaseId) {
    const activeLease = await Lease.findOne({
      where: { tenantId, apartmentId, status: 'active' },
    });
    if (activeLease) resolvedLeaseId = activeLease.id;
  }

  // Normaliser le mois : toujours premier jour du mois (YYYY-MM-01)
  const monthDate = new Date(month);
  if (isNaN(monthDate)) throw ApiError.badRequest('Format de mois invalide');
  const normalizedMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`;

  const payment = await RentPayment.create({
    leaseId:     resolvedLeaseId,
    tenantId:    Number(tenantId),
    apartmentId: Number(apartmentId),
    amount:      Number(amount),
    month:       normalizedMonth,
    paymentDate,
    notes:       notes || null,
  });

  return RentPayment.findByPk(payment.id, withRelations);
};

module.exports = { findAll, create };

