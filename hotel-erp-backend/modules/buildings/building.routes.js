'use strict';

const express = require('express');
const router  = express.Router();

const { protect } = require('../../middleware/authMiddleware');
const {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} = require('./building.controller');

// All building routes require a valid JWT
router.use(protect);

/**
 * @route  GET /api/buildings
 * @desc   List all buildings (optional ?name=&city= filters)
 * @access Protected
 */
router.get('/', getAllBuildings);

/**
 * @route  GET /api/buildings/:id
 * @desc   Get a single building by id
 * @access Protected
 */
router.get('/:id', getBuildingById);

/**
 * @route  POST /api/buildings
 * @desc   Create a new building
 * @access Protected
 * @body   { name, address?, city?, country?, numberOfFloors?, description? }
 */
router.post('/', createBuilding);

/**
 * @route  PUT /api/buildings/:id
 * @desc   Update a building (partial)
 * @access Protected
 */
router.put('/:id', updateBuilding);

/**
 * @route  DELETE /api/buildings/:id
 * @desc   Delete a building
 * @access Protected
 */
router.delete('/:id', deleteBuilding);

module.exports = router;

