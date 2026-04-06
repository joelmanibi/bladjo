'use strict';

const { Op, fn, col, literal } = require('sequelize');
const { sequelize, Room, Apartment, Employee, Payment, Item } = require('../models');
const ApiResponse = require('../utils/ApiResponse');

/** Items with quantity at or below this value are flagged as low stock. */
const LOW_STOCK_THRESHOLD = 10;

// ─── GET /api/dashboard ───────────────────────────────────────────────────────
/**
 * Aggregated KPI snapshot for the dashboard.
 * All database queries run in parallel for minimum response time.
 *
 * Returns:
 *   totalRooms        – total number of rooms
 *   occupiedRooms     – rooms with status OCCUPIED
 *   availableRooms    – rooms with status AVAILABLE
 *   totalApartments   – total number of apartments
 *   occupiedApartments– apartments with status OCCUPIED
 *   totalEmployees    – total number of employees
 *   monthlyRevenue    – sum of payments for the current calendar month
 *   todayRevenue      – sum of payments for today
 *   lowStockItems     – items with quantity <= LOW_STOCK_THRESHOLD
 */
const getDashboard = async (req, res, next) => {
  try {
    // ── Date helpers ──────────────────────────────────────────────────────────
    const today      = new Date().toISOString().slice(0, 10);          // YYYY-MM-DD
    const monthStart = today.slice(0, 7) + '-01';                      // YYYY-MM-01

    // ── Run all queries in parallel ───────────────────────────────────────────
    const [
      totalRooms,
      occupiedRooms,
      availableRooms,
      totalApartments,
      occupiedApartments,
      totalEmployees,
      monthlyRevenueRow,
      todayRevenueRow,
      lowStockItems,
    ] = await Promise.all([

      // Rooms
      Room.count(),
      Room.count({ where: { status: 'OCCUPIED'  } }),
      Room.count({ where: { status: 'AVAILABLE' } }),

      // Apartments
      Apartment.count(),
      Apartment.count({ where: { status: 'OCCUPIED' } }),

      // Employees
      Employee.count(),

      // Monthly revenue — sum of all payments from the 1st of this month to today
      Payment.findOne({
        attributes: [[fn('SUM', col('amount')), 'total']],
        where: {
          paymentDate: { [Op.between]: [monthStart, today] },
        },
        raw: true,
      }),

      // Today's revenue — sum of all payments dated today
      Payment.findOne({
        attributes: [[fn('SUM', col('amount')), 'total']],
        where: { paymentDate: today },
        raw: true,
      }),

      // Low stock items — ordered by quantity ascending so worst first
      Item.findAll({
        where:      { quantity: { [Op.lte]: LOW_STOCK_THRESHOLD } },
        attributes: ['id', 'name', 'category', 'quantity'],
        order:      [['quantity', 'ASC']],
      }),
    ]);

    // ── Build response ────────────────────────────────────────────────────────
    const data = {
      rooms: {
        total:     totalRooms,
        occupied:  occupiedRooms,
        available: availableRooms,
      },
      apartments: {
        total:    totalApartments,
        occupied: occupiedApartments,
      },
      totalEmployees,
      revenue: {
        monthly: parseFloat(monthlyRevenueRow?.total ?? 0),
        today:   parseFloat(todayRevenueRow?.total   ?? 0),
      },
      lowStockItems: {
        threshold: LOW_STOCK_THRESHOLD,
        count:     lowStockItems.length,
        items:     lowStockItems,
      },
      generatedAt: new Date().toISOString(),
    };

    res.status(200).json(ApiResponse.success('Dashboard data fetched successfully', data));
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };

