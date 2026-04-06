'use strict';

const { sequelize, StockMovement, Item } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── GET /api/stock-movements ─────────────────────────────────────────────────
/**
 * List all stock movements.
 * Optional filters: ?itemId=3&type=OUT
 */
const getAllMovements = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.itemId) where.itemId = req.query.itemId;
    if (req.query.type)   where.type   = req.query.type;

    const movements = await StockMovement.findAll({
      where,
      include: [{ model: Item, as: 'item', attributes: ['id', 'name', 'category', 'quantity'] }],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(
      ApiResponse.success('Stock movements fetched successfully', movements, 200, { total: movements.length })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/stock-movements/:id ────────────────────────────────────────────
const getMovementById = async (req, res, next) => {
  try {
    const movement = await StockMovement.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }],
    });
    if (!movement) throw ApiError.notFound('Stock movement not found');

    res.status(200).json(ApiResponse.success('Stock movement fetched successfully', movement));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/stock-movements ───────────────────────────────────────────────
/**
 * Record a new stock movement and adjust item quantity atomically.
 *
 *  IN  → item.quantity += movement.quantity
 *  OUT → validate sufficient stock, then item.quantity -= movement.quantity
 */
const createMovement = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { itemId, quantity, type, reference } = req.body;

    if (!itemId || !quantity || !type || !reference) {
      await t.rollback();
      throw ApiError.badRequest('itemId, quantity, type, and reference are required');
    }

    if (!['IN', 'OUT'].includes(type)) {
      await t.rollback();
      throw ApiError.badRequest('type must be IN or OUT');
    }

    // Lock the item row for this transaction
    const item = await Item.findByPk(itemId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!item) {
      await t.rollback();
      throw ApiError.notFound('Item not found');
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      await t.rollback();
      throw ApiError.badRequest('quantity must be a positive integer');
    }

    // ── OUT: validate sufficient stock ────────────────────────────────────────
    if (type === 'OUT') {
      if (item.quantity < qty) {
        await t.rollback();
        throw ApiError.conflict(
          `Insufficient stock for "${item.name}". Available: ${item.quantity}, requested: ${qty}.`
        );
      }
      await Item.decrement('quantity', { by: qty, where: { id: itemId }, transaction: t });
    }

    // ── IN: add to stock ──────────────────────────────────────────────────────
    if (type === 'IN') {
      await Item.increment('quantity', { by: qty, where: { id: itemId }, transaction: t });
    }

    // Record the movement
    const movement = await StockMovement.create(
      { itemId, quantity: qty, type, reference },
      { transaction: t }
    );

    await t.commit();

    // Reload with fresh item quantity
    await movement.reload({ include: [{ model: Item, as: 'item' }] });

    const verb    = type === 'IN' ? 'added to' : 'removed from';
    const message = `${qty} unit(s) ${verb} stock for "${item.name}".`;

    res.status(201).json(ApiResponse.created(message, movement));
  } catch (err) {
    await t.rollback().catch(() => {});
    next(err);
  }
};

module.exports = { getAllMovements, getMovementById, createMovement };

