'use strict';

const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getAllMovements,
  getMovementById,
  createMovement,
} = require('../controllers/stockMovementController');

// All routes require authentication
router.use(protect);

// GET /api/stock-movements          ← ?itemId=3&type=OUT
router.get('/',    getAllMovements);
// GET /api/stock-movements/:id
router.get('/:id', getMovementById);
// POST /api/stock-movements
router.post('/',   createMovement);

module.exports = router;

