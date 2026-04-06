'use strict';

const floorService = require('./floor.service');
const ApiResponse  = require('../../utils/ApiResponse');

// ─── POST /api/floors ─────────────────────────────────────────────────────────
/**
 * Create a new floor.
 * Body: { buildingId, floorNumber, label }
 */
const createFloor = async (req, res, next) => {
  try {
    const floor = await floorService.create(req.body);
    res.status(201).json(ApiResponse.created('Niveau créé avec succès', floor));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/floors/building/:buildingId ─────────────────────────────────────
/**
 * Return all floors for a given building, ordered by floorNumber ASC.
 */
const getFloorsByBuilding = async (req, res, next) => {
  try {
    const floors = await floorService.findByBuildingId(req.params.buildingId);
    res.status(200).json(
      ApiResponse.success('Niveaux récupérés avec succès', floors, 200, {
        buildingId: Number(req.params.buildingId),
        total:      floors.length,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/floors/:id ───────────────────────────────────────────────────
/**
 * Delete a floor by id.
 */
const deleteFloor = async (req, res, next) => {
  try {
    await floorService.remove(req.params.id);
    res.status(200).json(ApiResponse.success('Niveau supprimé avec succès'));
  } catch (err) {
    next(err);
  }
};

module.exports = { createFloor, getFloorsByBuilding, deleteFloor };

