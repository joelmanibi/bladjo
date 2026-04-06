'use strict';

const express = require('express');
const router  = express.Router();

const { protect }          = require('../middleware/authMiddleware');
const { uploadRoomImages } = require('../middleware/uploadMiddleware');
const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  deleteRoomImage,
} = require('../controllers/roomController');

// All room routes require a valid JWT
router.use(protect);

router.get('/',    getAllRooms);
router.get('/:id', getRoomById);

// NOTE: declared before /:id routes to avoid Express param collision
router.delete('/:id/images/:filename', deleteRoomImage);

router.post('/',      uploadRoomImages, createRoom);
router.put('/:id',    uploadRoomImages, updateRoom);
router.delete('/:id', deleteRoom);

module.exports = router;

