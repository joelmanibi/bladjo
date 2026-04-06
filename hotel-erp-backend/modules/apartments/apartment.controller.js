'use strict';

const path             = require('path');
const fs               = require('fs');
const apartmentService = require('./apartment.service');
const ApiResponse      = require('../../utils/ApiResponse');

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Parse multipart form-data body fields into the correct JS types.
 * All body fields arrive as strings when sent via FormData.
 */
const parseMultipartBody = (body) => ({
  code:        body.code,
  buildingId:  body.buildingId  && body.buildingId  !== '' ? Number(body.buildingId)  : null,
  floorId:     body.floorId     && body.floorId     !== '' ? Number(body.floorId)     : null,
  rooms:       body.rooms       && body.rooms       !== '' ? Number(body.rooms)       : null,
  bathrooms:   body.bathrooms   && body.bathrooms   !== '' ? Number(body.bathrooms)   : null,
  area:        body.area        && body.area        !== '' ? parseFloat(body.area)    : null,
  rentAmount:  body.rentAmount  && body.rentAmount  !== '' ? Number(body.rentAmount)  : null,
  status:      body.status      || 'AVAILABLE',
  description: body.description || null,
});

// ─── GET /api/apartments ──────────────────────────────────────────────────────
/**
 * List all apartments.
 * Optional query params: ?status=AVAILABLE&buildingId=1&floorId=2
 */
const getAllApartments = async (req, res, next) => {
  try {
    const apartments = await apartmentService.findAll(req.query);
    res.status(200).json(
      ApiResponse.success('Appartements récupérés avec succès', apartments, 200, {
        total: apartments.length,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/apartments/:id ──────────────────────────────────────────────────
/**
 * Return a single apartment by PK (includes building, floor, leases).
 */
const getApartmentById = async (req, res, next) => {
  try {
    const apartment = await apartmentService.findById(req.params.id);
    res.status(200).json(ApiResponse.success('Appartement récupéré avec succès', apartment));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/apartments/building/:buildingId ─────────────────────────────────
/**
 * Return all apartments in a given building.
 */
const getApartmentsByBuilding = async (req, res, next) => {
  try {
    const apartments = await apartmentService.findByBuildingId(req.params.buildingId);
    res.status(200).json(
      ApiResponse.success(
        "Appartements de l'immeuble récupérés avec succès",
        apartments,
        200,
        { total: apartments.length }
      )
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/apartments/floor/:floorId ──────────────────────────────────────
/**
 * Return all apartments on a given floor.
 */
const getApartmentsByFloor = async (req, res, next) => {
  try {
    const apartments = await apartmentService.findByFloorId(req.params.floorId);
    res.status(200).json(
      ApiResponse.success(
        'Appartements du niveau récupérés avec succès',
        apartments,
        200,
        { total: apartments.length }
      )
    );
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/apartments ─────────────────────────────────────────────────────
/**
 * Create a new apartment (multipart/form-data).
 * Accepts up to 5 images via the "images" field.
 */
const createApartment = async (req, res, next) => {
  try {
    const payload = parseMultipartBody(req.body);
    // Attach uploaded filenames
    payload.images = req.files && req.files.length > 0
      ? req.files.map((f) => f.filename)
      : null;

    const apartment = await apartmentService.create(payload);
    res.status(201).json(ApiResponse.created('Appartement créé avec succès', apartment));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/apartments/:id ──────────────────────────────────────────────────
/**
 * Partially update an apartment (multipart/form-data).
 * keepImages: JSON string of existing filenames to retain (sent in body).
 * New images go in req.files.
 */
const updateApartment = async (req, res, next) => {
  try {
    const payload = parseMultipartBody(req.body);

    // Merge existing images the client wants to keep with newly uploaded ones
    let keepImages = [];
    if (req.body.keepImages) {
      try { keepImages = JSON.parse(req.body.keepImages); } catch (_) { keepImages = []; }
    }
    const newFilenames = req.files && req.files.length > 0
      ? req.files.map((f) => f.filename)
      : [];
    const merged = [...keepImages, ...newFilenames].slice(0, 5);
    payload.images = merged.length > 0 ? merged : null;

    // Clean up removed images from disk
    const existing = await apartmentService.findById(req.params.id);
    const prevImages = Array.isArray(existing.images) ? existing.images : [];
    const removed = prevImages.filter((img) => !keepImages.includes(img));
    removed.forEach((filename) => {
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'apartments', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    const apartment = await apartmentService.update(req.params.id, payload);
    res.status(200).json(ApiResponse.success('Appartement mis à jour avec succès', apartment));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/apartments/:id/images/:filename ──────────────────────────────
/**
 * Remove a single image from an apartment.
 */
const deleteApartmentImage = async (req, res, next) => {
  try {
    const { id, filename } = req.params;
    const apartment = await apartmentService.findById(id);

    const current = Array.isArray(apartment.images) ? apartment.images : [];
    if (!current.includes(filename)) {
      return res.status(404).json(ApiResponse.error('Image introuvable', 404));
    }

    const updated = current.filter((img) => img !== filename);
    await apartmentService.update(id, { images: updated });

    // Delete file from disk
    const filePath = path.join(__dirname, '..', '..', 'uploads', 'apartments', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const refreshed = await apartmentService.findById(id);
    res.status(200).json(ApiResponse.success('Image supprimée avec succès', refreshed));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllApartments,
  getApartmentById,
  getApartmentsByBuilding,
  getApartmentsByFloor,
  createApartment,
  updateApartment,
  deleteApartmentImage,
};

