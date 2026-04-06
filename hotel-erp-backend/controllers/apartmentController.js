'use strict';

const { Apartment, Lease, Tenant } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── GET /api/apartments ─────────────────────────────────────────────────────
const getAllApartments = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;

    const apartments = await Apartment.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.status(200).json(
      ApiResponse.success('Apartments fetched successfully', apartments, 200, {
        total: apartments.length,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/apartments/:id ──────────────────────────────────────────────────
const getApartmentById = async (req, res, next) => {
  try {
    const apartment = await Apartment.findByPk(req.params.id, {
      include: [
        {
          model: Lease,
          as:    'leases',
          include: [{ model: Tenant, as: 'tenant' }],
          order: [['startDate', 'DESC']],
        },
      ],
    });
    if (!apartment) throw ApiError.notFound('Apartment not found');

    res.status(200).json(ApiResponse.success('Apartment fetched successfully', apartment));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/apartments ─────────────────────────────────────────────────────
const createApartment = async (req, res, next) => {
  try {
    const { name, address, rentPrice, status } = req.body;

    if (!name || !address || rentPrice === undefined) {
      throw ApiError.badRequest('name, address and rentPrice are required');
    }

    const apartment = await Apartment.create({ name, address, rentPrice, status });

    res.status(201).json(ApiResponse.created('Apartment created successfully', apartment));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/apartments/:id ──────────────────────────────────────────────────
const updateApartment = async (req, res, next) => {
  try {
    const apartment = await Apartment.findByPk(req.params.id);
    if (!apartment) throw ApiError.notFound('Apartment not found');

    const { name, address, rentPrice, status } = req.body;

    await apartment.update({
      ...(name      !== undefined && { name      }),
      ...(address   !== undefined && { address   }),
      ...(rentPrice !== undefined && { rentPrice }),
      ...(status    !== undefined && { status    }),
    });

    res.status(200).json(ApiResponse.success('Apartment updated successfully', apartment));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/apartments/:id ───────────────────────────────────────────────
const deleteApartment = async (req, res, next) => {
  try {
    const apartment = await Apartment.findByPk(req.params.id);
    if (!apartment) throw ApiError.notFound('Apartment not found');

    if (apartment.status === 'OCCUPIED') {
      throw ApiError.badRequest('Cannot delete an occupied apartment. Terminate the active lease first.');
    }

    await apartment.destroy();

    res.status(200).json(ApiResponse.success('Apartment deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllApartments,
  getApartmentById,
  createApartment,
  updateApartment,
  deleteApartment,
};

