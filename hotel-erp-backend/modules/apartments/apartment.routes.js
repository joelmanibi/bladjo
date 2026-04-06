'use strict';

const express = require('express');
const router  = express.Router();

const { protect }                = require('../../middleware/authMiddleware');
const { uploadApartmentImages }  = require('../../middleware/uploadMiddleware');
const {
  getAllApartments,
  getApartmentById,
  getApartmentsByBuilding,
  getApartmentsByFloor,
  createApartment,
  updateApartment,
  deleteApartmentImage,
} = require('./apartment.controller');

// All apartment routes require a valid JWT
router.use(protect);

/**
 * @route  GET /api/apartments/building/:buildingId
 * @desc   List all apartments in a building
 * @access Protected
 * IMPORTANT: Specific routes must be declared before /:id to avoid param collision.
 */
router.get('/building/:buildingId', getApartmentsByBuilding);

/**
 * @route  GET /api/apartments/floor/:floorId
 * @desc   List all apartments on a floor
 * @access Protected
 */
router.get('/floor/:floorId', getApartmentsByFloor);

/**
 * @route  GET /api/apartments
 * @desc   List all apartments (optional ?status=&buildingId=&floorId= filters)
 * @access Protected
 */
router.get('/', getAllApartments);

/**
 * @route  GET /api/apartments/:id
 * @desc   Get a single apartment by id (includes building, floor, leases)
 * @access Protected
 */
router.get('/:id', getApartmentById);

/**
 * @route  DELETE /api/apartments/:id/images/:filename
 * @desc   Remove a single image from an apartment
 * @access Protected
 * NOTE: declared before /:id routes to avoid Express param collision.
 */
router.delete('/:id/images/:filename', deleteApartmentImage);

/**
 * @route  POST /api/apartments
 * @desc   Create a new apartment (multipart/form-data, up to 5 images)
 * @access Protected
 */
router.post('/', uploadApartmentImages, createApartment);

/**
 * @route  PUT /api/apartments/:id
 * @desc   Partially update an apartment (multipart/form-data, up to 5 images)
 * @access Protected
 */
router.put('/:id', uploadApartmentImages, updateApartment);

module.exports = router;

