'use strict';

const { Op }       = require('sequelize');
const { Building } = require('../../models');
const ApiError     = require('../../utils/ApiError');

// ─── findAll ──────────────────────────────────────────────────────────────────
/**
 * Fetch all buildings.
 * Optional query filters: ?name=IM1&city=Abidjan
 *
 * @param {{ name?: string, city?: string }} filters
 * @returns {Promise<Building[]>}
 */
const findAll = async (filters = {}) => {
  const where = {};
  if (filters.name) where.name = { [Op.like]: `%${filters.name}%` };
  if (filters.city) where.city = { [Op.like]: `%${filters.city}%` };

  return Building.findAll({
    where,
    order: [['name', 'ASC']],
  });
};

// ─── findById ─────────────────────────────────────────────────────────────────
/**
 * Find a single building by primary key.
 * Throws ApiError 404 if not found.
 *
 * @param {number|string} id
 * @returns {Promise<Building>}
 */
const findById = async (id) => {
  const building = await Building.findByPk(id);
  if (!building) throw ApiError.notFound(`Immeuble #${id} introuvable`);
  return building;
};

// ─── create ───────────────────────────────────────────────────────────────────
/**
 * Create a new building.
 *
 * @param {{ name: string, address?: string, city?: string, country?: string, numberOfFloors?: number, description?: string }} payload
 * @returns {Promise<Building>}
 */
const create = async (payload) => {
  const { name, address, city, country, numberOfFloors, description } = payload;

  if (!name || !String(name).trim()) {
    throw ApiError.badRequest("Le nom de l'immeuble est obligatoire");
  }

  return Building.create({
    name:           String(name).trim(),
    address:        address        ?? null,
    city:           city           ?? null,
    country:        country        ?? null,
    numberOfFloors: numberOfFloors !== undefined ? Number(numberOfFloors) : null,
    description:    description    ?? null,
  });
};

// ─── update ───────────────────────────────────────────────────────────────────
/**
 * Partially update a building.
 * Only fields present in `payload` are updated.
 *
 * @param {number|string} id
 * @param {object} payload
 * @returns {Promise<Building>}
 */
const update = async (id, payload) => {
  const building = await findById(id);
  const { name, address, city, country, numberOfFloors, description } = payload;

  await building.update({
    ...(name           !== undefined && { name: String(name).trim() }),
    ...(address        !== undefined && { address        }),
    ...(city           !== undefined && { city           }),
    ...(country        !== undefined && { country        }),
    ...(numberOfFloors !== undefined && { numberOfFloors: Number(numberOfFloors) }),
    ...(description    !== undefined && { description    }),
  });

  return building;
};

// ─── remove ───────────────────────────────────────────────────────────────────
/**
 * Delete a building by id.
 * Throws ApiError 404 if not found.
 *
 * Note: once Building → Apartment relations are added, add a guard here
 * to block deletion if apartments exist.
 *
 * @param {number|string} id
 * @returns {Promise<void>}
 */
const remove = async (id) => {
  const building = await findById(id);
  await building.destroy();
};

module.exports = { findAll, findById, create, update, remove };

