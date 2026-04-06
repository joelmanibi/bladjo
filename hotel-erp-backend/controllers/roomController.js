'use strict';

const path        = require('path');
const fs          = require('fs');
const { Room }    = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Parse multipart form-data fields into correct JS types.
 * All fields arrive as strings when sent via FormData.
 */
const parseMultipartBody = (body) => ({
  roomNumber:  body.roomNumber  || undefined,
  type:        body.type        || undefined,
  price:       body.price       !== undefined && body.price !== '' ? parseFloat(body.price) : undefined,
  status:      body.status      || undefined,
  description: body.description !== undefined ? (body.description || null) : undefined,
});

// ─── GET /api/rooms ──────────────────────────────────────────────────────────
/**
 * Return all rooms.
 * Optional query filters: ?status=AVAILABLE&type=Suite
 */
const getAllRooms = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.type)   where.type   = req.query.type;

    const rooms = await Room.findAll({ where, order: [['roomNumber', 'ASC']] });

    res.status(200).json(
      ApiResponse.success('Rooms fetched successfully', rooms, 200, { total: rooms.length })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/rooms/:id ──────────────────────────────────────────────────────
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) throw ApiError.notFound('Room not found');

    res.status(200).json(ApiResponse.success('Room fetched successfully', room));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/rooms ─────────────────────────────────────────────────────────
/**
 * Create a new room (multipart/form-data).
 * Accepts up to 5 images via the "images" field.
 */
const createRoom = async (req, res, next) => {
  try {
    const { roomNumber, type, price, status, description } = parseMultipartBody(req.body);

    if (!roomNumber || !type || price === undefined) {
      throw ApiError.badRequest('roomNumber, type and price are required');
    }

    const existing = await Room.findOne({ where: { roomNumber } });
    if (existing) throw ApiError.conflict(`Room number "${roomNumber}" already exists`);

    const images = req.files && req.files.length > 0
      ? req.files.map((f) => f.filename)
      : null;

    const room = await Room.create({ roomNumber, type, price, status, description, images });

    res.status(201).json(ApiResponse.created('Room created successfully', room));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/rooms/:id ──────────────────────────────────────────────────────
/**
 * Partially update a room (multipart/form-data).
 * keepImages: JSON string of existing filenames to retain (sent in body).
 * New images go in req.files.
 */
const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) throw ApiError.notFound('Room not found');

    const { roomNumber, type, price, status, description } = parseMultipartBody(req.body);

    // Check uniqueness if roomNumber is being changed
    if (roomNumber && roomNumber !== room.roomNumber) {
      const existing = await Room.findOne({ where: { roomNumber } });
      if (existing) throw ApiError.conflict(`Room number "${roomNumber}" already exists`);
    }

    // Merge existing images to keep with newly uploaded ones
    let keepImages = [];
    if (req.body.keepImages) {
      try { keepImages = JSON.parse(req.body.keepImages); } catch (_) { keepImages = []; }
    }
    const newFilenames = req.files && req.files.length > 0
      ? req.files.map((f) => f.filename)
      : [];
    const merged = [...keepImages, ...newFilenames].slice(0, 5);
    const images = merged.length > 0 ? merged : null;

    // Delete removed images from disk
    const prevImages = Array.isArray(room.images) ? room.images : [];
    const removed = prevImages.filter((img) => !keepImages.includes(img));
    removed.forEach((filename) => {
      const filePath = path.join(__dirname, '..', 'uploads', 'rooms', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await room.update({
      ...(roomNumber  !== undefined && { roomNumber  }),
      ...(type        !== undefined && { type        }),
      ...(price       !== undefined && { price       }),
      ...(status      !== undefined && { status      }),
      ...(description !== undefined && { description }),
      images,
    });

    const refreshed = await Room.findByPk(room.id);
    res.status(200).json(ApiResponse.success('Room updated successfully', refreshed));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/rooms/:id/images/:filename ───────────────────────────────────
/**
 * Remove a single image from a room.
 */
const deleteRoomImage = async (req, res, next) => {
  try {
    const { id, filename } = req.params;
    const room = await Room.findByPk(id);
    if (!room) throw ApiError.notFound('Room not found');

    const current = Array.isArray(room.images) ? room.images : [];
    if (!current.includes(filename)) {
      return res.status(404).json(ApiResponse.error('Image introuvable', 404));
    }

    const updated = current.filter((img) => img !== filename);
    await room.update({ images: updated.length > 0 ? updated : null });

    // Delete file from disk
    const filePath = path.join(__dirname, '..', 'uploads', 'rooms', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const refreshed = await Room.findByPk(id);
    res.status(200).json(ApiResponse.success('Image supprimée avec succès', refreshed));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/rooms/:id ───────────────────────────────────────────────────
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) throw ApiError.notFound('Room not found');

    if (room.status === 'OCCUPIED') {
      throw ApiError.badRequest('Cannot delete an occupied room');
    }

    await room.destroy();

    res.status(200).json(ApiResponse.success('Room deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom, deleteRoomImage };

