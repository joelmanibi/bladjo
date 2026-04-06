'use strict';

const express = require('express');
const router  = express.Router();

const { protect }          = require('../../middleware/authMiddleware');
const {
  getAllLeases,
  getLeasesByApartment,
  createLease,
  updateLease,
} = require('./lease.controller');

// Toutes les routes nécessitent un JWT valide
router.use(protect);

/**
 * @route  GET /api/leases
 * @desc   Lister tous les baux (filtres: ?tenantId=&apartmentId=&status=)
 * @access Protected
 */
router.get('/', getAllLeases);

/**
 * @route  GET /api/leases/apartment/:apartmentId
 * @desc   Lister les baux d'un appartement
 * @access Protected
 */
router.get('/apartment/:apartmentId', getLeasesByApartment);

/**
 * @route  POST /api/leases
 * @desc   Créer un bail
 * @access Protected
 * @body   { tenantId, apartmentId, startDate, endDate, rentAmount, deposit? }
 */
router.post('/', createLease);

/**
 * @route  PUT /api/leases/:id
 * @desc   Mettre à jour un bail (partiel — status "ended" libère l'appartement)
 * @access Protected
 */
router.put('/:id', updateLease);

module.exports = router;

