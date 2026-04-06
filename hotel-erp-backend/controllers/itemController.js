'use strict';

const { Op }      = require('sequelize');
const { Item }    = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── GET /api/items ──────────────────────────────────────────────────────────
/**
 * Return all items.
 * Optional query filters: ?category=Linen&name=Towel
 */
const getItems = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.category) where.category = req.query.category;
    if (req.query.name) {
      where.name = { [Op.like]: `%${req.query.name}%` };
    }

    const items = await Item.findAll({
      where,
      order: [['category', 'ASC'], ['name', 'ASC']],
    });

    res.status(200).json(
      ApiResponse.success('Items fetched successfully', items, 200, { total: items.length })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/items/:id ──────────────────────────────────────────────────────
const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) throw ApiError.notFound('Item not found');

    res.status(200).json(ApiResponse.success('Item fetched successfully', item));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/items ─────────────────────────────────────────────────────────
const createItem = async (req, res, next) => {
  try {
    const { name, category, quantity, unitPrice } = req.body;

    if (!name || !category || unitPrice === undefined) {
      throw ApiError.badRequest('name, category, and unitPrice are required');
    }

    const item = await Item.create({
      name,
      category,
      quantity: quantity !== undefined ? quantity : 0,
      unitPrice,
    });

    res.status(201).json(ApiResponse.created('Item created successfully', item));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/items/:id ──────────────────────────────────────────────────────
const updateItem = async (req, res, next) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) throw ApiError.notFound('Item not found');

    const { name, category, quantity, unitPrice } = req.body;

    await item.update({
      ...(name      !== undefined && { name      }),
      ...(category  !== undefined && { category  }),
      ...(quantity  !== undefined && { quantity  }),
      ...(unitPrice !== undefined && { unitPrice }),
    });

    res.status(200).json(ApiResponse.success('Item updated successfully', item));
  } catch (err) {
    next(err);
  }
};

module.exports = { getItems, getItemById, createItem, updateItem };

