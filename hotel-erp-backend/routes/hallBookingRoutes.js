'use strict';

const express = require('express');
const router  = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllHallBookings,
  getHallBookingById,
  createHallBooking,
  updateHallBooking,
  updateHallBookingStatus,
  deleteHallBooking,
} = require('../controllers/hallBookingController');

router.use(protect);

const MANAGEMENT_ROLES = ['ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'];

router.get('/',                getAllHallBookings);
router.get('/:id',             getHallBookingById);
router.post('/',               authorize(...MANAGEMENT_ROLES), createHallBooking);
router.put('/:id',             authorize(...MANAGEMENT_ROLES), updateHallBooking);
router.patch('/:id/status',    authorize(...MANAGEMENT_ROLES), updateHallBookingStatus);
router.delete('/:id',          authorize(...MANAGEMENT_ROLES), deleteHallBooking);

module.exports = router;

