'use strict';

const path        = require('path');
const { Op }      = require('sequelize');
const { sequelize, PurchaseRequest, Item } = require('../models');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── GET /api/purchase-requests ──────────────────────────────────────────────
/**
 * List all purchase requests.
 * Optional filters: ?status=PENDING&itemId=3
 */
const getAllPurchaseRequests = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.itemId) where.itemId = req.query.itemId;

    const requests = await PurchaseRequest.findAll({
      where,
      include: [{ model: Item, as: 'item', attributes: ['id', 'name', 'category', 'quantity'] }],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(
      ApiResponse.success('Purchase requests fetched successfully', requests, 200, { total: requests.length })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/purchase-requests/:id ──────────────────────────────────────────
const getPurchaseRequestById = async (req, res, next) => {
  try {
    const pr = await PurchaseRequest.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }],
    });
    if (!pr) throw ApiError.notFound('Purchase request not found');

    res.status(200).json(ApiResponse.success('Purchase request fetched successfully', pr));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/purchase-requests  (MANAGER) ──────────────────────────────────
/**
 * Create a new purchase request.
 * totalPrice is auto-calculated: quantity * unitPrice
 */
const createPurchaseRequest = async (req, res, next) => {
  try {
    const { itemId, quantity, unitPrice } = req.body;

    if (!itemId || !quantity || unitPrice === undefined) {
      throw ApiError.badRequest('itemId, quantity, and unitPrice are required');
    }

    const item = await Item.findByPk(itemId);
    if (!item) throw ApiError.notFound('Item not found');

    const totalPrice = parseFloat(quantity) * parseFloat(unitPrice);

    const pr = await PurchaseRequest.create({
      itemId,
      quantity,
      unitPrice,
      totalPrice,
      status: 'PENDING',
    });

    const result = await PurchaseRequest.findByPk(pr.id, {
      include: [{ model: Item, as: 'item' }],
    });

    res.status(201).json(ApiResponse.created('Purchase request created successfully', result));
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/purchase-requests/:id/approve  (OWNER) ───────────────────────
/**
 * Approve a PENDING purchase request → APPROVED
 */
const approvePurchaseRequest = async (req, res, next) => {
  try {
    const pr = await PurchaseRequest.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }],
    });
    if (!pr) throw ApiError.notFound('Purchase request not found');

    if (pr.status !== 'PENDING') {
      throw ApiError.conflict(
        `Cannot approve a purchase request with status '${pr.status}'. Only PENDING requests can be approved.`
      );
    }

    await pr.update({ status: 'APPROVED' });

    res.status(200).json(ApiResponse.success('Purchase request approved successfully', pr));
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/purchase-requests/:id/receipt  (MANAGER) ─────────────────────
/**
 * Upload a receipt image. Transitions APPROVED → ORDERED.
 * Uses multer middleware (uploadReceipt) defined in routes.
 */
const uploadReceipt = async (req, res, next) => {
  try {
    const pr = await PurchaseRequest.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }],
    });
    if (!pr) throw ApiError.notFound('Purchase request not found');

    if (pr.status !== 'APPROVED') {
      throw ApiError.conflict(
        `Cannot upload receipt for a purchase request with status '${pr.status}'. Only APPROVED requests accept a receipt.`
      );
    }

    if (!req.file) {
      throw ApiError.badRequest('No receipt file uploaded. Send the file in the "receiptImage" field.');
    }

    // Store a relative URL path so the frontend can fetch it via /uploads/receipts/<filename>
    const receiptPath = `/uploads/receipts/${req.file.filename}`;

    await pr.update({ receiptImage: receiptPath, status: 'ORDERED' });

    res.status(200).json(ApiResponse.success('Receipt uploaded successfully. Status updated to ORDERED.', pr));
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/purchase-requests/:id/deliver ────────────────────────────────
/**
 * Mark a purchase request as DELIVERED.
 * ORDERED → DELIVERED + automatically increases item.quantity by the requested quantity.
 * Wrapped in a transaction to guarantee atomicity.
 */
const deliverPurchaseRequest = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const pr = await PurchaseRequest.findByPk(req.params.id, {
      include: [{ model: Item, as: 'item' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!pr) {
      await t.rollback();
      throw ApiError.notFound('Purchase request not found');
    }

    if (pr.status !== 'ORDERED') {
      await t.rollback();
      throw ApiError.conflict(
        `Cannot deliver a purchase request with status '${pr.status}'. Only ORDERED requests can be delivered.`
      );
    }

    // Atomically increase item stock
    await Item.increment('quantity', {
      by:          pr.quantity,
      where:       { id: pr.itemId },
      transaction: t,
    });

    await pr.update({ status: 'DELIVERED' }, { transaction: t });

    await t.commit();

    // Reload to get fresh item quantity
    await pr.reload({ include: [{ model: Item, as: 'item' }] });

    res.status(200).json(
      ApiResponse.success(
        `Purchase request delivered. ${pr.quantity} unit(s) added to stock for "${pr.item.name}".`,
        pr
      )
    );
  } catch (err) {
    await t.rollback().catch(() => {});
    next(err);
  }
};

module.exports = {
  getAllPurchaseRequests,
  getPurchaseRequestById,
  createPurchaseRequest,
  approvePurchaseRequest,
  uploadReceipt,
  deliverPurchaseRequest,
};

