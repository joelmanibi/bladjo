'use strict';

const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
} = require('../controllers/tenantController');

router.use(protect);

router.get('/',       getAllTenants);
router.get('/:id',    getTenantById);
router.post('/',      createTenant);
router.put('/:id',    updateTenant);
router.delete('/:id', deleteTenant);

module.exports = router;

