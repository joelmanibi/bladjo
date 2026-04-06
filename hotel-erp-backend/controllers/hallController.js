'use strict';

const path = require('path');
const fs = require('fs');
const { Op }      = require('sequelize');
const { Hall, HallBooking } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/** Include bookings when fetching a Hall. */
const withBookings = {
  include: [{
    model: HallBooking,
    as: 'bookings',
    separate: true,
    order: [['startDate', 'ASC'], ['endDate', 'ASC']],
  }],
};

const parseMultipartBody = (body) => ({
  name: body.name !== undefined ? String(body.name || '').trim() : undefined,
  capacity: body.capacity !== undefined && body.capacity !== '' ? Number(body.capacity) : undefined,
  pricePerDay: body.pricePerDay !== undefined && body.pricePerDay !== '' ? Number(body.pricePerDay) : undefined,
  description: body.description !== undefined ? (body.description ? String(body.description).trim() : null) : undefined,
});

// ─── GET /api/halls ──────────────────────────────────────────────────────────
const getAllHalls = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.name) {
      where.name = { [Op.like]: `%${req.query.name}%` };
    }

    const halls = await Hall.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.status(200).json(
      ApiResponse.success('Halls fetched successfully', halls, 200, { total: halls.length })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/halls/:id ──────────────────────────────────────────────────────
const getHallById = async (req, res, next) => {
  try {
    const hall = await Hall.findByPk(req.params.id, withBookings);
    if (!hall) throw ApiError.notFound('Hall not found');

    res.status(200).json(ApiResponse.success('Hall fetched successfully', hall));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/halls ─────────────────────────────────────────────────────────
const createHall = async (req, res, next) => {
  try {
    const { name, capacity, pricePerDay, description } = parseMultipartBody(req.body);

    if (!name || !capacity || pricePerDay === undefined) {
      throw ApiError.badRequest('name, capacity, and pricePerDay are required');
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      throw ApiError.badRequest('capacity must be an integer greater than 0');
    }

    if (Number.isNaN(pricePerDay) || pricePerDay < 0) {
      throw ApiError.badRequest('pricePerDay must be a number greater than or equal to 0');
    }

    const images = req.files && req.files.length > 0
      ? req.files.map((file) => file.filename)
      : null;

    const hall = await Hall.create({
      name,
      capacity,
      pricePerDay,
      description,
      images,
    });

    res.status(201).json(ApiResponse.created('Hall created successfully', hall));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/halls/:id ──────────────────────────────────────────────────────
const updateHall = async (req, res, next) => {
  try {
    const hall = await Hall.findByPk(req.params.id);
    if (!hall) throw ApiError.notFound('Hall not found');

    const { name, capacity, pricePerDay, description } = parseMultipartBody(req.body);

    if (name !== undefined && !name) {
      throw ApiError.badRequest('name cannot be empty');
    }

    if (capacity !== undefined) {
      if (!Number.isInteger(capacity) || capacity < 1) {
        throw ApiError.badRequest('capacity must be an integer greater than 0');
      }
    }

    if (pricePerDay !== undefined) {
      if (Number.isNaN(pricePerDay) || pricePerDay < 0) {
        throw ApiError.badRequest('pricePerDay must be a number greater than or equal to 0');
      }
    }

    let keepImages = [];
    if (req.body.keepImages) {
      try { keepImages = JSON.parse(req.body.keepImages); } catch (_) { keepImages = []; }
    }
    const newFilenames = req.files && req.files.length > 0
      ? req.files.map((file) => file.filename)
      : [];
    const merged = [...keepImages, ...newFilenames].slice(0, 5);
    const images = merged.length > 0 ? merged : null;

    const previousImages = Array.isArray(hall.images) ? hall.images : [];
    const removedImages = previousImages.filter((filename) => !keepImages.includes(filename));
    removedImages.forEach((filename) => {
      const filePath = path.join(__dirname, '..', 'uploads', 'halls', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await hall.update({
      ...(name         !== undefined && { name }),
      ...(capacity     !== undefined && { capacity }),
      ...(pricePerDay  !== undefined && { pricePerDay }),
      ...(description  !== undefined && { description }),
      images,
    });

    const refreshed = await Hall.findByPk(hall.id, withBookings);
    res.status(200).json(ApiResponse.success('Hall updated successfully', refreshed));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/halls/:id/images/:filename ───────────────────────────────────
const deleteHallImage = async (req, res, next) => {
  try {
    const { id, filename } = req.params;
    const hall = await Hall.findByPk(id);
    if (!hall) throw ApiError.notFound('Hall not found');

    const current = Array.isArray(hall.images) ? hall.images : [];
    if (!current.includes(filename)) {
      return res.status(404).json(ApiResponse.error('Image introuvable', 404));
    }

    const updated = current.filter((image) => image !== filename);
    await hall.update({ images: updated.length > 0 ? updated : null });

    const filePath = path.join(__dirname, '..', 'uploads', 'halls', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const refreshed = await Hall.findByPk(id, withBookings);
    res.status(200).json(ApiResponse.success('Image supprimée avec succès', refreshed));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/halls/:id ───────────────────────────────────────────────────
const deleteHall = async (req, res, next) => {
  try {
    const hall = await Hall.findByPk(req.params.id, withBookings);
    if (!hall) throw ApiError.notFound('Hall not found');

    const hasActiveBookings = hall.bookings.some(
      (b) => b.status === 'CONFIRMED' || b.status === 'PENDING'
    );
    if (hasActiveBookings) {
      throw ApiError.badRequest('Cannot delete a hall with pending or confirmed bookings');
    }

    const hallImages = Array.isArray(hall.images) ? hall.images : [];
    hallImages.forEach((filename) => {
      const filePath = path.join(__dirname, '..', 'uploads', 'halls', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await hall.destroy();

    res.status(200).json(ApiResponse.success('Hall deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHallImage,
  deleteHall,
};

