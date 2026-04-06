'use strict';

const { Apartment, Building, Floor, Lease, Tenant } = require('../../models');
const ApiError = require('../../utils/ApiError');

// ── Eager-load helper ─────────────────────────────────────────────────────────
const withRelations = {
  include: [
    { model: Building, as: 'building', attributes: ['id', 'name', 'city'] },
    { model: Floor,    as: 'floor',    attributes: ['id', 'label', 'floorNumber'] },
  ],
};

// ─── findAll ──────────────────────────────────────────────────────────────────
/**
 * List all apartments. Optional filters: ?status=&buildingId=&floorId=
 *
 * @param {{ status?: string, buildingId?: number, floorId?: number }} filters
 * @returns {Promise<Apartment[]>}
 */
const findAll = async (filters = {}) => {
  const where = {};
  if (filters.status)     where.status     = filters.status;
  if (filters.buildingId) where.buildingId = Number(filters.buildingId);
  if (filters.floorId)    where.floorId    = Number(filters.floorId);

  return Apartment.findAll({
    where,
    ...withRelations,
    order: [['code', 'ASC']],
  });
};

// ─── findById ─────────────────────────────────────────────────────────────────
/**
 * Find a single apartment by PK (includes building, floor and leases).
 * Throws ApiError 404 if not found.
 *
 * @param {number|string} id
 * @returns {Promise<Apartment>}
 */
const findById = async (id) => {
  const apartment = await Apartment.findByPk(id, {
    include: [
      { model: Building, as: 'building', attributes: ['id', 'name', 'city'] },
      { model: Floor,    as: 'floor',    attributes: ['id', 'label', 'floorNumber'] },
      {
        model: Lease, as: 'leases',
        include: [{ model: Tenant, as: 'tenant' }],
        order: [['startDate', 'DESC']],
      },
    ],
  });
  if (!apartment) throw ApiError.notFound(`Appartement #${id} introuvable`);
  return apartment;
};

// ─── findByBuildingId ─────────────────────────────────────────────────────────
/**
 * Return all apartments in a given building.
 * Throws ApiError 404 if the building does not exist.
 *
 * @param {number|string} buildingId
 * @returns {Promise<Apartment[]>}
 */
const findByBuildingId = async (buildingId) => {
  const building = await Building.findByPk(buildingId);
  if (!building) throw ApiError.notFound(`Immeuble #${buildingId} introuvable`);

  return Apartment.findAll({
    where: { buildingId: Number(buildingId) },
    ...withRelations,
    order: [['code', 'ASC']],
  });
};

// ─── findByFloorId ────────────────────────────────────────────────────────────
/**
 * Return all apartments on a given floor.
 * Throws ApiError 404 if the floor does not exist.
 *
 * @param {number|string} floorId
 * @returns {Promise<Apartment[]>}
 */
const findByFloorId = async (floorId) => {
  const floor = await Floor.findByPk(floorId);
  if (!floor) throw ApiError.notFound(`Niveau #${floorId} introuvable`);

  return Apartment.findAll({
    where: { floorId: Number(floorId) },
    ...withRelations,
    order: [['code', 'ASC']],
  });
};

// ─── create ───────────────────────────────────────────────────────────────────
/**
 * Create a new apartment.
 *
 * @param {{ code: string, buildingId?: number, floorId?: number, rooms?: number, bathrooms?: number, area?: number, rentAmount?: number, status?: string, description?: string }} payload
 * @returns {Promise<Apartment>}
 */
const create = async (payload) => {
  const { code, buildingId, floorId, rooms, bathrooms, area, rentAmount, status, description, images } = payload;

  if (!code || !String(code).trim()) {
    throw ApiError.badRequest("Le code de l'appartement est obligatoire");
  }
  if (rentAmount === undefined || rentAmount === null) {
    throw ApiError.badRequest('Le montant du loyer est obligatoire');
  }

  // Validate FK existence if provided
  if (buildingId) {
    const building = await Building.findByPk(buildingId);
    if (!building) throw ApiError.notFound(`Immeuble #${buildingId} introuvable`);
  }
  if (floorId) {
    const floor = await Floor.findByPk(floorId);
    if (!floor) throw ApiError.notFound(`Niveau #${floorId} introuvable`);
  }

  const apartment = await Apartment.create({
    code:        String(code).trim().toUpperCase(),
    buildingId:  buildingId  ? Number(buildingId)  : null,
    floorId:     floorId     ? Number(floorId)     : null,
    rooms:       rooms       !== undefined ? Number(rooms)      : null,
    bathrooms:   bathrooms   !== undefined ? Number(bathrooms)  : null,
    area:        area        !== undefined ? parseFloat(area)   : null,
    rentAmount:  Number(rentAmount),
    status:      status      || 'AVAILABLE',
    description: description || null,
    images:      Array.isArray(images) && images.length > 0 ? images : null,
  });

  return findById(apartment.id);
};

// ─── update ───────────────────────────────────────────────────────────────────
/**
 * Partially update an apartment.
 *
 * @param {number|string} id
 * @param {object} payload
 * @returns {Promise<Apartment>}
 */
const update = async (id, payload) => {
  const apartment = await findById(id);
  const { code, buildingId, floorId, rooms, bathrooms, area, rentAmount, status, description, images } = payload;

  if (buildingId !== undefined && buildingId !== null) {
    const building = await Building.findByPk(buildingId);
    if (!building) throw ApiError.notFound(`Immeuble #${buildingId} introuvable`);
  }
  if (floorId !== undefined && floorId !== null) {
    const floor = await Floor.findByPk(floorId);
    if (!floor) throw ApiError.notFound(`Niveau #${floorId} introuvable`);
  }

  await apartment.update({
    ...(code        !== undefined && { code: String(code).trim().toUpperCase() }),
    ...(buildingId  !== undefined && { buildingId  }),
    ...(floorId     !== undefined && { floorId     }),
    ...(rooms       !== undefined && { rooms       }),
    ...(bathrooms   !== undefined && { bathrooms   }),
    ...(area        !== undefined && { area        }),
    ...(rentAmount  !== undefined && { rentAmount  }),
    ...(status      !== undefined && { status      }),
    ...(description !== undefined && { description }),
    ...(images      !== undefined && { images: Array.isArray(images) && images.length > 0 ? images : null }),
  });

  return findById(apartment.id);
};

module.exports = { findAll, findById, findByBuildingId, findByFloorId, create, update };

