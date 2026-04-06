'use strict';

const { Op }                     = require('sequelize');
const { Tenant, Lease, Apartment } = require('../../models');
const ApiError                   = require('../../utils/ApiError');

// ─── findAll ──────────────────────────────────────────────────────────────────
/**
 * Récupère tous les locataires.
 * Filtres optionnels : ?firstname=&lastname=&phone=
 *
 * @param {{ firstname?: string, lastname?: string, phone?: string }} filters
 * @returns {Promise<Tenant[]>}
 */
const findAll = async (filters = {}) => {
  const where = {};
  if (filters.firstname) where.firstname = { [Op.like]: `%${filters.firstname}%` };
  if (filters.lastname)  where.lastname  = { [Op.like]: `%${filters.lastname}%`  };
  if (filters.phone)     where.phone     = { [Op.like]: `%${filters.phone}%`     };

  return Tenant.findAll({
    where,
    order: [['lastname', 'ASC'], ['firstname', 'ASC']],
  });
};

// ─── findById ─────────────────────────────────────────────────────────────────
/**
 * Trouve un locataire par clé primaire, avec ses baux et appartements associés.
 * Lève ApiError 404 si introuvable.
 *
 * @param {number|string} id
 * @returns {Promise<Tenant>}
 */
const findById = async (id) => {
  const tenant = await Tenant.findByPk(id, {
    include: [
      {
        model:   Lease,
        as:      'leases',
        include: [{ model: Apartment, as: 'apartment' }],
        order:   [['startDate', 'DESC']],
      },
    ],
  });
  if (!tenant) throw ApiError.notFound(`Locataire #${id} introuvable`);
  return tenant;
};

// ─── create ───────────────────────────────────────────────────────────────────
/**
 * Crée un nouveau locataire.
 * Le champ `name` est auto-calculé (firstname + lastname) pour la rétrocompat.
 *
 * @param {{ firstname: string, lastname: string, phone: string, email: string, identityNumber?: string }} payload
 * @returns {Promise<Tenant>}
 */
const create = async (payload) => {
  const { firstname, lastname, phone, email, identityNumber } = payload;

  if (!firstname || !String(firstname).trim()) throw ApiError.badRequest('Le prénom est obligatoire');
  if (!lastname  || !String(lastname).trim())  throw ApiError.badRequest('Le nom est obligatoire');
  if (!phone     || !String(phone).trim())     throw ApiError.badRequest('Le téléphone est obligatoire');
  if (!email     || !String(email).trim())     throw ApiError.badRequest("L'email est obligatoire");

  const existing = await Tenant.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existing) throw ApiError.conflict(`Un locataire avec l'email "${email}" existe déjà`);

  return Tenant.create({
    firstname:      String(firstname).trim(),
    lastname:       String(lastname).trim(),
    name:           `${String(firstname).trim()} ${String(lastname).trim()}`,
    phone:          String(phone).trim(),
    email:          email.toLowerCase().trim(),
    identityNumber: identityNumber ? String(identityNumber).trim() : null,
  });
};

// ─── update ───────────────────────────────────────────────────────────────────
/**
 * Mise à jour partielle d'un locataire.
 *
 * @param {number|string} id
 * @param {object} payload
 * @returns {Promise<Tenant>}
 */
const update = async (id, payload) => {
  const tenant = await findById(id);
  const { firstname, lastname, phone, email, identityNumber } = payload;

  // Vérifier unicité email si changé
  if (email && email.toLowerCase().trim() !== tenant.email) {
    const existing = await Tenant.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) throw ApiError.conflict(`Un locataire avec l'email "${email}" existe déjà`);
  }

  const fn = firstname !== undefined ? String(firstname).trim() : tenant.firstname;
  const ln = lastname  !== undefined ? String(lastname).trim()  : tenant.lastname;

  await tenant.update({
    ...(firstname      !== undefined && { firstname: fn }),
    ...(lastname       !== undefined && { lastname:  ln }),
    name: `${fn} ${ln}`,
    ...(phone          !== undefined && { phone }),
    ...(email          !== undefined && { email }),
    ...(identityNumber !== undefined && { identityNumber }),
  });

  return tenant;
};

// ─── remove ───────────────────────────────────────────────────────────────────
/**
 * Supprime un locataire.
 * Bloque la suppression si des baux actifs existent.
 *
 * @param {number|string} id
 * @returns {Promise<void>}
 */
const remove = async (id) => {
  const tenant = await findById(id);

  const today = new Date().toISOString().slice(0, 10);
  const activeLeases = await Lease.count({
    where: {
      tenantId:  tenant.id,
      startDate: { [Op.lte]: today },
      endDate:   { [Op.gte]: today },
    },
  });

  if (activeLeases > 0) {
    throw ApiError.badRequest('Impossible de supprimer un locataire ayant des baux actifs');
  }

  await tenant.destroy();
};

module.exports = { findAll, findById, create, update, remove };

