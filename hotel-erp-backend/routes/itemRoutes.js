'use strict';

const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getItems,
  getItemById,
  createItem,
  updateItem,
} = require('../controllers/itemController');

router.use(protect);

router.get('/',    getItems);
router.get('/:id', getItemById);
router.post('/',   createItem);
router.put('/:id', updateItem);

module.exports = router;

