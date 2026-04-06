'use strict';

const { Op }                        = require('sequelize');
const { Lease, Apartment, Tenant }  = require('../../models');
const ApiError                      = require('../../utils/ApiError');

// ── Relations eager-load ──────────────────────────────────────────────────────
const withRelations = {
  include: [
    { model: Apartment, as: 'apartment' },
    { model: Tenant,    as: 'tenant'    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Vérifie si un autre bail couvre déjà cet appartement sur la période donnée.
 * @param {number} apartmentId
 * @param {string} startDate
 * @param {string} endDate
 * @param {number|null} excludeId  — exclure l'id courant lors d'un update
 */
const hasOverlap = async (apartmentId, startDate, endDate, excludeId = null) => {
  const where = {
    apartmentId,
    status:    'active',
    startDate: { [Op.lt]: endDate   },
    endDate:   { [Op.gt]: startDate },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return (await Lease.count({ where })) > 0;
};

// ── findAll ───────────────────────────────────────────────────────────────────
/**
 * Lister tous les baux.
 * Filtres : ?tenantId=&apartmentId=&status=
 */
const findAll = async (filters = {}) => {
  const where = {};
  if (filters.tenantId)    where.tenantId    = filters.tenantId;
  if (filters.apartmentId) where.apartmentId = filters.apartmentId;
  if (filters.status)      where.status      = filters.status;

  return Lease.findAll({ where, ...withRelations, order: [['startDate', 'DESC']] });
};

// ── findByApartment ───────────────────────────────────────────────────────────
/** Baux d'un appartement donné. */
const findByApartment = async (apartmentId) => {
  return Lease.findAll({
    where: { apartmentId },
    ...withRelations,
    order: [['startDate', 'DESC']],
  });
};

// ── findById ──────────────────────────────────────────────────────────────────
const findById = async (id) => {
  const lease = await Lease.findByPk(id, withRelations);
  if (!lease) throw ApiError.notFound(`Bail #${id} introuvable`);
  return lease;
};

// ── create ────────────────────────────────────────────────────────────────────
/**
 * Créer un bail.
 * Met l'appartement en statut "occupied" après création.
 */
const create = async (payload) => {
  const { tenantId, apartmentId, startDate, endDate, rentAmount, deposit } = payload;

  if (!tenantId || !apartmentId || !startDate || !endDate || rentAmount === undefined) {
    throw ApiError.badRequest('tenantId, apartmentId, startDate, endDate et rentAmount sont obligatoires');
  }

  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (isNaN(start) || isNaN(end)) throw ApiError.badRequest('Format de date invalide');
  if (end <= start) throw ApiError.badRequest('La date de fin doit être postérieure à la date de début');

  const apartment = await Apartment.findByPk(apartmentId);
  if (!apartment) throw ApiError.notFound('Appartement introuvable');

  // Bloquer si l'appartement est déjà occupé
  if (apartment.status === 'OCCUPIED') {
    throw ApiError.badRequest("L'appartement est déjà occupé");
  }

  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) throw ApiError.notFound('Locataire introuvable');

  if (await hasOverlap(apartmentId, startDate, endDate)) {
    throw ApiError.conflict('Un bail actif couvre déjà cet appartement sur cette période');
  }

  const lease = await Lease.create({
    tenantId,
    apartmentId,
    startDate,
    endDate,
    rentAmount,
    deposit:     deposit ?? null,
    monthlyRent: rentAmount, // rétrocompat
    status:      'active',
  });

  // Marquer l'appartement comme OCCUPÉ (majuscules — valeur ENUM du modèle)
  await apartment.update({ status: 'OCCUPIED' });

  return Lease.findByPk(lease.id, withRelations);
};

// ── update ────────────────────────────────────────────────────────────────────
/**
 * Mise à jour partielle d'un bail (dates, loyer, caution, statut).
 * Si le statut passe à "ended", l'appartement redevient disponible.
 */
const update = async (id, payload) => {
  const lease = await findById(id);

  const { startDate, endDate, rentAmount, deposit, status } = payload;

  const newStart = startDate || lease.startDate;
  const newEnd   = endDate   || lease.endDate;

  if (new Date(newEnd) <= new Date(newStart)) {
    throw ApiError.badRequest('La date de fin doit être postérieure à la date de début');
  }

  if ((startDate || endDate) && await hasOverlap(lease.apartmentId, newStart, newEnd, lease.id)) {
    throw ApiError.conflict('Les nouvelles dates chevauchent un autre bail actif pour cet appartement');
  }

  await lease.update({
    ...(startDate   !== undefined && { startDate  }),
    ...(endDate     !== undefined && { endDate    }),
    ...(rentAmount  !== undefined && { rentAmount, monthlyRent: rentAmount }),
    ...(deposit     !== undefined && { deposit    }),
    ...(status      !== undefined && { status     }),
  });

  // Si le bail est terminé → libérer l'appartement (majuscules — valeur ENUM du modèle)
  if (status === 'ended') {
    const apartment = await Apartment.findByPk(lease.apartmentId);
    if (apartment) await apartment.update({ status: 'AVAILABLE' });
  }

  return Lease.findByPk(lease.id, withRelations);
};

module.exports = { findAll, findByApartment, findById, create, update };

