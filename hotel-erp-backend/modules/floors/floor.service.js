'use strict';

const { Floor, Building } = require('../../models');
const ApiError            = require('../../utils/ApiError');

// ─── create ───────────────────────────────────────────────────────────────────
/**
 * Create a new floor and attach it to an existing building.
 * Validates that buildingId, floorNumber and label are provided,
 * and that the referenced building exists.
 *
 * @param {{ buildingId: number, floorNumber: number, label: string }} payload
 * @returns {Promise<Floor>}
 */
const create = async (payload) => {
  const { buildingId, floorNumber, label } = payload;

  if (!buildingId)                throw ApiError.badRequest("L'identifiant de l'immeuble est obligatoire");
  if (floorNumber === undefined || floorNumber === null)
                                  throw ApiError.badRequest('Le numéro du niveau est obligatoire');
  if (!label || !String(label).trim())
                                  throw ApiError.badRequest('Le libellé du niveau est obligatoire (ex : RDC, R+1)');

  // Verify the building exists
  const building = await Building.findByPk(buildingId);
  if (!building) throw ApiError.notFound(`Immeuble #${buildingId} introuvable`);

  return Floor.create({
    buildingId:  Number(buildingId),
    floorNumber: Number(floorNumber),
    label:       String(label).trim(),
  });
};

// ─── findByBuildingId ─────────────────────────────────────────────────────────
/**
 * Return all floors that belong to a given building,
 * ordered by floorNumber ascending (RDC first).
 * Throws ApiError 404 if the building does not exist.
 *
 * @param {number|string} buildingId
 * @returns {Promise<Floor[]>}
 */
const findByBuildingId = async (buildingId) => {
  // Verify the building exists
  const building = await Building.findByPk(buildingId);
  if (!building) throw ApiError.notFound(`Immeuble #${buildingId} introuvable`);

  return Floor.findAll({
    where: { buildingId: Number(buildingId) },
    order: [['floorNumber', 'ASC']],
  });
};

// ─── remove ───────────────────────────────────────────────────────────────────
/**
 * Delete a floor by its primary key.
 * Throws ApiError 404 if not found.
 *
 * @param {number|string} id
 * @returns {Promise<void>}
 */
const remove = async (id) => {
  const floor = await Floor.findByPk(id);
  if (!floor) throw ApiError.notFound(`Niveau #${id} introuvable`);
  await floor.destroy();
};

module.exports = { create, findByBuildingId, remove };

