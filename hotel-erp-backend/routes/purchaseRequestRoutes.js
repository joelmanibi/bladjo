'use strict';

const express = require('express');
const router  = express.Router();

const { protect, authorize }      = require('../middleware/authMiddleware');
const { uploadReceipt: multerUpload } = require('../middleware/uploadMiddleware');
const {
  getAllPurchaseRequests,
  getPurchaseRequestById,
  createPurchaseRequest,
  approvePurchaseRequest,
  uploadReceipt,
  deliverPurchaseRequest,
} = require('../controllers/purchaseRequestController');

// All routes require authentication
router.use(protect);

// ── Read ──────────────────────────────────────────────────────────────────────
// GET /api/purchase-requests          ?status=PENDING&itemId=3
router.get('/',    getAllPurchaseRequests);
// GET /api/purchase-requests/:id
router.get('/:id', getPurchaseRequestById);

// ── Create  (MANAGER only) ────────────────────────────────────────────────────
// POST /api/purchase-requests
router.post('/', authorize('MANAGER', 'ADMIN'), createPurchaseRequest);

// ── Approve  (OWNER only) ─────────────────────────────────────────────────────
// PATCH /api/purchase-requests/:id/approve
router.patch('/:id/approve', authorize('OWNER', 'ADMIN'), approvePurchaseRequest);

// ── Upload receipt  (MANAGER only) ────────────────────────────────────────────
// PATCH /api/purchase-requests/:id/receipt  (multipart/form-data, field: receiptImage)
router.patch('/:id/receipt', authorize('MANAGER', 'ADMIN'), multerUpload, uploadReceipt);

// ── Mark delivered  (OWNER or MANAGER) ───────────────────────────────────────
// PATCH /api/purchase-requests/:id/deliver
router.patch('/:id/deliver', authorize('OWNER', 'MANAGER', 'ADMIN'), deliverPurchaseRequest);

module.exports = router;

