'use strict';

const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { uploadHallImages } = require('../middleware/uploadMiddleware');
const {
  getAllHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHallImage,
  deleteHall,
} = require('../controllers/hallController');

router.use(protect);

router.get('/',       getAllHalls);
router.get('/:id',    getHallById);

router.delete('/:id/images/:filename', deleteHallImage);

router.post('/',      uploadHallImages, createHall);
router.put('/:id',    uploadHallImages, updateHall);
router.delete('/:id', deleteHall);

module.exports = router;

