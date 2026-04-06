'use strict';

const buildingService = require('./building.service');
const ApiResponse     = require('../../utils/ApiResponse');

// ─── GET /api/buildings ───────────────────────────────────────────────────────
/**
 * Return all buildings.
 * Optional query params: ?name=IM1&city=Abidjan
 */
const getAllBuildings = async (req, res, next) => {
  try {
    const buildings = await buildingService.findAll(req.query);
    res.status(200).json(
      ApiResponse.success('Buildings fetched successfully', buildings, 200, {
        total: buildings.length,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/buildings/:id ───────────────────────────────────────────────────
/**
 * Return a single building by its primary key.
 */
const getBuildingById = async (req, res, next) => {
  try {
    const building = await buildingService.findById(req.params.id);
    res.status(200).json(ApiResponse.success('Building fetched successfully', building));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/buildings ──────────────────────────────────────────────────────
/**
 * Create a new building.
 * Body: { name, address?, city?, country?, numberOfFloors?, description? }
 */
const createBuilding = async (req, res, next) => {
  try {
    const building = await buildingService.create(req.body);
    res.status(201).json(ApiResponse.created('Building created successfully', building));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/buildings/:id ───────────────────────────────────────────────────
/**
 * Update a building (partial update — only provided fields are changed).
 */
const updateBuilding = async (req, res, next) => {
  try {
    const building = await buildingService.update(req.params.id, req.body);
    res.status(200).json(ApiResponse.success('Building updated successfully', building));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/buildings/:id ────────────────────────────────────────────────
/**
 * Delete a building by id.
 */
const deleteBuilding = async (req, res, next) => {
  try {
    await buildingService.remove(req.params.id);
    res.status(200).json(ApiResponse.success('Building deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
};

