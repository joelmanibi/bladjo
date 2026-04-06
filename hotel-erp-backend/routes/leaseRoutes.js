'use strict';

const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getAllLeases,
  getLeaseById,
  createLease,
  updateLease,
  terminateLease,
  deleteLease,
} = require('../controllers/leaseController');

router.use(protect);

router.get('/',                  getAllLeases);
router.get('/:id',               getLeaseById);
router.post('/',                 createLease);
router.put('/:id',               updateLease);
router.patch('/:id/terminate',   terminateLease);
router.delete('/:id',            deleteLease);

module.exports = router;

