'use strict';

const express = require('express');
const router  = express.Router();

const { protect } = require('../../middleware/authMiddleware');
const {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
} = require('./tenant.controller');

// Toutes les routes nécessitent un JWT valide
router.use(protect);

/**
 * @route  GET /api/tenants
 * @desc   Lister tous les locataires (filtres: ?firstname=&lastname=&phone=)
 * @access Protected
 */
router.get('/', getAllTenants);

/**
 * @route  GET /api/tenants/:id
 * @desc   Récupérer un locataire par son id (avec ses baux)
 * @access Protected
 */
router.get('/:id', getTenantById);

/**
 * @route  POST /api/tenants
 * @desc   Créer un nouveau locataire
 * @access Protected
 * @body   { firstname, lastname, phone, email, identityNumber? }
 */
router.post('/', createTenant);

/**
 * @route  PUT /api/tenants/:id
 * @desc   Mettre à jour un locataire (partiel)
 * @access Protected
 */
router.put('/:id', updateTenant);

/**
 * @route  DELETE /api/tenants/:id
 * @desc   Supprimer un locataire (bloqué si baux actifs)
 * @access Protected
 */
router.delete('/:id', deleteTenant);

module.exports = router;

