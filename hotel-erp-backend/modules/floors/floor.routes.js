'use strict';

const express = require('express');
const router  = express.Router();

const { protect } = require('../../middleware/authMiddleware');
const {
  createFloor,
  getFloorsByBuilding,
  deleteFloor,
} = require('./floor.controller');

// All floor routes require a valid JWT
router.use(protect);

/**
 * @route  POST /api/floors
 * @desc   Create a new floor for a building
 * @access Protected
 * @body   { buildingId, floorNumber, label }
 */
router.post('/', createFloor);

/**
 * @route  GET /api/floors/building/:buildingId
 * @desc   List all floors of a given building (ordered by floorNumber ASC)
 * @access Protected
 */
router.get('/building/:buildingId', getFloorsByBuilding);

/**
 * @route  DELETE /api/floors/:id
 * @desc   Delete a floor by id
 * @access Protected
 */
router.delete('/:id', deleteFloor);

module.exports = router;

