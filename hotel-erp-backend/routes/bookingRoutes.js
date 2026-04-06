'use strict';

const express = require('express');
const router  = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
} = require('../controllers/bookingController');

// All booking routes require a valid JWT
router.use(protect);

const MANAGEMENT_ROLES = ['ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'];

router.get('/',             getAllBookings);
router.get('/:id',          getBookingById);
router.post('/',            authorize(...MANAGEMENT_ROLES), createBooking);
router.put('/:id',          authorize(...MANAGEMENT_ROLES), updateBooking);
router.patch('/:id/status', authorize(...MANAGEMENT_ROLES), updateBookingStatus);
router.delete('/:id',       authorize(...MANAGEMENT_ROLES), deleteBooking);

module.exports = router;

