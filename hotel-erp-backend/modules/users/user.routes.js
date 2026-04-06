'use strict';

const express = require('express');
const router  = express.Router();

const { protect } = require('../../middleware/authMiddleware');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('./user.controller');

// All user routes require a valid JWT
router.use(protect);

/**
 * @route  GET /api/users
 * @desc   List all users (optional ?name=&email=&role= filters)
 * @access Protected
 */
router.get('/', getAllUsers);

/**
 * @route  GET /api/users/:id
 * @desc   Get a single user by id
 * @access Protected
 */
router.get('/:id', getUserById);

/**
 * @route  POST /api/users
 * @desc   Create a new user
 * @access Protected
 * @body   { name, email, password, role? }
 */
router.post('/', createUser);

/**
 * @route  PUT /api/users/:id
 * @desc   Update a user (partial)
 * @access Protected
 * @body   { name?, email?, role?, password? }
 */
router.put('/:id', updateUser);

/**
 * @route  DELETE /api/users/:id
 * @desc   Delete a user
 * @access Protected
 */
router.delete('/:id', deleteUser);

module.exports = router;

