'use strict';

const express = require('express');

const {
  createPublicHallBooking,
  createPublicRoomBooking,
  getPublicHallById,
  getPublicHalls,
  getPublicRoomById,
  getPublicRooms,
} = require('../controllers/publicController');

const router = express.Router();

router.get('/rooms', getPublicRooms);
router.get('/rooms/:id', getPublicRoomById);
router.post('/room-bookings', createPublicRoomBooking);

router.get('/halls', getPublicHalls);
router.get('/halls/:id', getPublicHallById);
router.post('/hall-bookings', createPublicHallBooking);

module.exports = router;