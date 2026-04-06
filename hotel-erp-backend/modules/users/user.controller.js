'use strict';

const userService = require('./user.service');
const ApiResponse = require('../../utils/ApiResponse');

// ─── GET /api/users ───────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.findAll(req.query);
    res.status(200).json(
      ApiResponse.success('Users fetched successfully', users, 200, { total: users.length })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    res.status(200).json(ApiResponse.success('User fetched successfully', user));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/users ──────────────────────────────────────────────────────────
const createUser = async (req, res, next) => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json(ApiResponse.created('User created successfully', user));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/users/:id ───────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const user = await userService.update(req.params.id, req.body);
    res.status(200).json(ApiResponse.success('User updated successfully', user));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    await userService.remove(req.params.id);
    res.status(200).json(ApiResponse.success('User deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };

