'use strict';

const path   = require('path');
const fs     = require('fs');
const multer = require('multer');

// ─── Ensure destination directory exists ─────────────────────────────────────
const RECEIPTS_DIR = path.join(__dirname, '..', 'uploads', 'receipts');
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

// ─── Disk storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, RECEIPTS_DIR);
  },
  filename: (_req, file, cb) => {
    // receipt-<timestamp>-<random>.<ext>
    const ext      = path.extname(file.originalname).toLowerCase();
    const filename = `receipt-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, filename);
  },
});

// ─── File filter ─────────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = (
  process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/webp,application/pdf'
)
  .split(',')
  .map((t) => t.trim());

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type "${file.mimetype}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
      ),
      false
    );
  }
};

// ─── Size limit ───────────────────────────────────────────────────────────────
const MAX_SIZE_MB = parseInt(process.env.UPLOAD_MAX_SIZE_MB || '10', 10);

// ─── Multer instance ─────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

/**
 * Single-file upload middleware for purchase request receipts.
 * Expects form-data field name: "receiptImage"
 */
const uploadReceipt = upload.single('receiptImage');

// ─── Apartment images ─────────────────────────────────────────────────────────
const APARTMENTS_DIR = path.join(__dirname, '..', 'uploads', 'apartments');
if (!fs.existsSync(APARTMENTS_DIR)) {
  fs.mkdirSync(APARTMENTS_DIR, { recursive: true });
}

const apartmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, APARTMENTS_DIR),
  filename:    (_req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const filename = `apt-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, filename);
  },
});

const imageOnlyFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier invalide. Types acceptés : jpeg, png, webp'), false);
  }
};

const uploadApartmentImages = multer({
  storage:    apartmentStorage,
  fileFilter: imageOnlyFilter,
  limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
}).array('images', 5);

// ─── Room images ──────────────────────────────────────────────────────────────
const ROOMS_DIR = path.join(__dirname, '..', 'uploads', 'rooms');
if (!fs.existsSync(ROOMS_DIR)) {
  fs.mkdirSync(ROOMS_DIR, { recursive: true });
}

const roomStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ROOMS_DIR),
  filename:    (_req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const filename = `room-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, filename);
  },
});

const uploadRoomImages = multer({
  storage:    roomStorage,
  fileFilter: imageOnlyFilter,
  limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
}).array('images', 5);

// ─── Hall images ──────────────────────────────────────────────────────────────
const HALLS_DIR = path.join(__dirname, '..', 'uploads', 'halls');
if (!fs.existsSync(HALLS_DIR)) {
  fs.mkdirSync(HALLS_DIR, { recursive: true });
}

const hallStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, HALLS_DIR),
  filename:    (_req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const filename = `hall-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, filename);
  },
});

const uploadHallImages = multer({
  storage:    hallStorage,
  fileFilter: imageOnlyFilter,
  limits:     { fileSize: 5 * 1024 * 1024 },
}).array('images', 5);

module.exports = { uploadReceipt, uploadApartmentImages, uploadRoomImages, uploadHallImages };

