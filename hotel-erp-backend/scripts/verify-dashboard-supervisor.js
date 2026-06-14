'use strict';

require('dotenv').config();
const { Op, fn, col } = require('sequelize');
const { sequelize, Room, Booking, Hall, HallBooking, Employee, SalaryPayment, Payment, PurchaseRequest, RentPayment, Lease } = require('../models');
const { getDashboard } = require('../controllers/dashboardController');

const month = new Date().toISOString().slice(0, 7);
const startDate = `${month}-01`;
const endDate = new Date(new Date(`${startDate}T00:00:00`).getFullYear(), new Date(`${startDate}T00:00:00`).getMonth() + 1, 0)
  .toISOString().slice(0, 10);
const periodEndExclusive = new Date(new Date(`${endDate}T00:00:00`).getTime() + 24 * 60 * 60 * 1000)
  .toISOString().slice(0, 10);

const num = (value) => Number.parseFloat(value ?? 0) || 0;
const sumField = async (Model, field, where) => {
  const row = await Model.findOne({
    attributes: [[fn('SUM', col(field)), 'total']],
    where,
    raw: true,
  });
  return num(row?.total);
};

const roundMoney = (value) => Number(num(value).toFixed(2));

const getNextMonth = (month) => {
  const [year, monthIndex] = month.split('-').map(Number);
  const nextMonth = monthIndex === 12 ? 1 : monthIndex + 1;
  const nextYear = monthIndex === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
};

const getMonthsInRange = (from, to) => {
  const months = [];
  let cursor = from.slice(0, 7);
  const last = to.slice(0, 7);

  while (cursor <= last) {
    months.push(`${cursor}-01`);
    if (cursor === last) break;
    cursor = getNextMonth(cursor);
  }

  return months;
};

const getMonthEnd = (monthStart) => {
  const monthKey = monthStart.slice(0, 7);
  return new Date(new Date(`${monthKey}-01T00:00:00`).getFullYear(), new Date(`${monthKey}-01T00:00:00`).getMonth() + 1, 0)
    .toISOString().slice(0, 10);
};

const leaseIntersectsMonth = (lease, monthStart) => (
  lease.startDate <= getMonthEnd(monthStart)
  && lease.endDate >= monthStart
);

const accumulateAmount = (map, key, amount) => {
  map.set(key, roundMoney(num(map.get(key)) + num(amount)));
};

const getHallBookingWhere = async () => {
  const columns = await sequelize.getQueryInterface().describeTable('HallBookings');

  if (columns.startDate && columns.endDate) {
    return {
      startDate: { [Op.lte]: endDate },
      endDate: { [Op.gte]: startDate },
    };
  }

  return {
    eventDate: { [Op.between]: [startDate, endDate] },
  };
};

async function fetchDashboard() {
  return await new Promise((resolve, reject) => {
    const req = { query: { month } };
    const res = {
      status() { return this; },
      json(payload) { resolve(payload.data); },
    };
    getDashboard(req, res, reject);
  });
}

async function computeExpected() {
  const activeRoomStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED'];
  const activeHallStatuses = ['PENDING', 'CONFIRMED'];
  const hallBookingWhere = await getHallBookingWhere();
  const months = getMonthsInRange(startDate, endDate);

  const [
    totalRooms,
    occupiedRooms,
    totalHalls,
    bookedHalls,
    totalEmployees,
    roomRevenue,
    hallRevenue,
    apartmentPaymentRevenue,
    expensePayments,
    rentRevenue,
    salaryExpenses,
    stockExpenses,
    arrivals,
    rentStatus,
  ] = await Promise.all([
    Room.count(),
    Booking.count({
      distinct: true,
      col: 'roomId',
      where: {
        checkInDate: { [Op.lt]: periodEndExclusive },
        checkOutDate: { [Op.gt]: startDate },
        status: { [Op.in]: activeRoomStatuses },
      },
    }),
    Hall.count(),
    HallBooking.count({
      distinct: true,
      col: 'hallId',
      where: {
        ...hallBookingWhere,
        status: { [Op.in]: activeHallStatuses },
      },
    }),
    Employee.count(),
    sumField(Payment, 'amount', { paymentDate: { [Op.between]: [startDate, endDate] }, referenceType: 'ROOM' }),
    sumField(Payment, 'amount', { paymentDate: { [Op.between]: [startDate, endDate] }, referenceType: 'HALL' }),
    sumField(Payment, 'amount', { paymentDate: { [Op.between]: [startDate, endDate] }, referenceType: 'APARTMENT' }),
    sumField(Payment, 'amount', { paymentDate: { [Op.between]: [startDate, endDate] }, referenceType: 'EXPENSE' }),
    sumField(RentPayment, 'amount', { paymentDate: { [Op.between]: [startDate, endDate] } }),
    sumField(SalaryPayment, 'amount', { paymentDate: { [Op.between]: [startDate, endDate] } }),
    sumField(PurchaseRequest, 'totalPrice', {
      status: { [Op.in]: ['ORDERED', 'DELIVERED'] },
      updatedAt: { [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`] },
    }),
    Booking.count({
      where: {
        checkInDate: { [Op.between]: [startDate, endDate] },
        status: { [Op.in]: activeRoomStatuses },
      },
    }),
    (async () => {
      const [leases, rentPayments] = await Promise.all([
        Lease.findAll({
          where: {
            startDate: { [Op.lte]: endDate },
            endDate: { [Op.gte]: startDate },
          },
          attributes: ['id', 'apartmentId', 'rentAmount', 'startDate', 'endDate'],
          raw: true,
        }),
        RentPayment.findAll({
          where: {
            month: { [Op.between]: [months[0], months[months.length - 1]] },
          },
          attributes: ['leaseId', 'apartmentId', 'amount', 'month'],
          raw: true,
        }),
      ]);

      const paymentsByLeaseMonth = new Map();
      const paymentsByApartmentMonth = new Map();

      rentPayments.forEach((payment) => {
        if (payment.leaseId) {
          accumulateAmount(paymentsByLeaseMonth, `${payment.leaseId}:${payment.month}`, payment.amount);
        }
        accumulateAmount(paymentsByApartmentMonth, `${payment.apartmentId}:${payment.month}`, payment.amount);
      });

      const status = {
        expected: 0,
        collected: 0,
        outstanding: 0,
        activeLeases: 0,
        paidMonths: 0,
        partialMonths: 0,
        unpaidMonths: 0,
      };

      const activeLeaseIds = new Set();

      leases.forEach((lease) => {
        months.forEach((monthStart) => {
          if (!leaseIntersectsMonth(lease, monthStart)) return;

          activeLeaseIds.add(lease.id);

          const due = roundMoney(lease.rentAmount);
          const directPaid = paymentsByLeaseMonth.get(`${lease.id}:${monthStart}`);
          const fallbackPaid = paymentsByApartmentMonth.get(`${lease.apartmentId}:${monthStart}`);
          const paid = roundMoney(directPaid !== undefined ? directPaid : fallbackPaid);
          const collected = roundMoney(Math.min(paid, due));
          const outstanding = roundMoney(Math.max(due - paid, 0));

          status.expected += due;
          status.collected += collected;
          status.outstanding += outstanding;

          if (paid >= due && due > 0) status.paidMonths += 1;
          else if (paid > 0) status.partialMonths += 1;
          else status.unpaidMonths += 1;
        });
      });

      return {
        expected: roundMoney(status.expected),
        collected: roundMoney(status.collected),
        outstanding: roundMoney(status.outstanding),
        activeLeases: activeLeaseIds.size,
        paidMonths: status.paidMonths,
        partialMonths: status.partialMonths,
        unpaidMonths: status.unpaidMonths,
      };
    })(),
  ]);

  const apartmentRevenue = apartmentPaymentRevenue + rentRevenue;
  return {
    summaryRevenue: roomRevenue + hallRevenue + apartmentRevenue,
    summaryExpenses: expensePayments + salaryExpenses + stockExpenses,
    roomsOccupied: occupiedRooms,
    hallsBooked: bookedHalls,
    totalEmployees,
    roomRevenue,
    hallRevenue,
    apartmentRevenue,
    salaryExpenses,
    stockExpenses,
    expensePayments,
    arrivals,
    totalRooms,
    totalHalls,
    rentStatus,
  };
}

(async () => {
  try {
    await sequelize.authenticate();
    const dashboard = await fetchDashboard();
    const expected = await computeExpected();

    const checks = [
      ['summary.totalRevenue', num(dashboard.summary.totalRevenue), expected.summaryRevenue],
      ['summary.totalExpenses', num(dashboard.summary.totalExpenses), expected.summaryExpenses],
      ['rooms.occupied', num(dashboard.rooms.occupied), expected.roomsOccupied],
      ['halls.booked', num(dashboard.halls.booked), expected.hallsBooked],
      ['employees.total', num(dashboard.employees.total), expected.totalEmployees],
      ['revenue.room', num(dashboard.revenue.room), expected.roomRevenue],
      ['revenue.hall', num(dashboard.revenue.hall), expected.hallRevenue],
      ['revenue.apartment', num(dashboard.revenue.apartment), expected.apartmentRevenue],
      ['expenses.salaries', num(dashboard.expenses.salaries), expected.salaryExpenses],
      ['expenses.stock', num(dashboard.expenses.stock), expected.stockExpenses],
      ['expenses.other', num(dashboard.expenses.other), expected.expensePayments],
      ['bookings.arrivals', num(dashboard.bookings.arrivals), expected.arrivals],
      ['realEstate.rentStatus.expected', num(dashboard.realEstate.rentStatus.expected), expected.rentStatus.expected],
      ['realEstate.rentStatus.collected', num(dashboard.realEstate.rentStatus.collected), expected.rentStatus.collected],
      ['realEstate.rentStatus.outstanding', num(dashboard.realEstate.rentStatus.outstanding), expected.rentStatus.outstanding],
      ['realEstate.rentStatus.activeLeases', num(dashboard.realEstate.rentStatus.activeLeases), expected.rentStatus.activeLeases],
      ['realEstate.rentStatus.paidMonths', num(dashboard.realEstate.rentStatus.paidMonths), expected.rentStatus.paidMonths],
      ['realEstate.rentStatus.partialMonths', num(dashboard.realEstate.rentStatus.partialMonths), expected.rentStatus.partialMonths],
      ['realEstate.rentStatus.unpaidMonths', num(dashboard.realEstate.rentStatus.unpaidMonths), expected.rentStatus.unpaidMonths],
    ];

    checks.forEach(([label, actual, exp]) => {
      const ok = actual === exp;
      console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: actual=${actual} expected=${exp}`);
    });
  } catch (error) {
    console.error('Verification failed:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
