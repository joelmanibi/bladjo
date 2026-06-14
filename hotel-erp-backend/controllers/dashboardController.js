'use strict';

const { Op, fn, col } = require('sequelize');
const {
  sequelize,
  Room,
  Apartment,
  Building,
  Booking,
  Hall,
  HallBooking,
  Employee,
  SalaryPayment,
  Payment,
  PurchaseRequest,
  Lease,
  RentPayment,
  Item,
  Tenant,
} = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/** Items with quantity at or below this value are flagged as low stock. */
const LOW_STOCK_THRESHOLD = 10;
const ROOM_BOOKING_ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED'];
const ROOM_BOOKING_ALL_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
const HALL_BOOKING_ACTIVE_STATUSES = ['PENDING', 'CONFIRMED'];
const HALL_BOOKING_ALL_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'];

let hallBookingDateModePromise;

const todayStr = () => new Date().toISOString().slice(0, 10);

const isValidDateOnly = (value) => (
  typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(new Date(`${value}T00:00:00`).getTime())
);

const isValidMonth = (value) => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

const getLastDayOfMonth = (month) => {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(year, monthIndex, 0).toISOString().slice(0, 10);
};

const formatPeriodLabel = (startDate, endDate, type) => {
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: type === 'month' ? 'long' : 'short',
    year: 'numeric',
  });

  if (type === 'month') {
    return formatter.format(new Date(`${startDate}T00:00:00`));
  }

  return `${formatter.format(new Date(`${startDate}T00:00:00`))} → ${formatter.format(new Date(`${endDate}T00:00:00`))}`;
};

const countDaysInclusive = (startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
};

const addDays = (dateStr, days) => {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const toNumber = (value) => {
  const parsed = Number.parseFloat(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundCurrency = (value) => Number(toNumber(value).toFixed(2));

const getMonthStart = (value) => `${String(value).slice(0, 7)}-01`;

const getNextMonth = (month) => {
  const [year, monthIndex] = month.split('-').map(Number);
  const nextMonth = monthIndex === 12 ? 1 : monthIndex + 1;
  const nextYear = monthIndex === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
};

const getMonthsInRange = (startDate, endDate) => {
  const months = [];
  let cursor = startDate.slice(0, 7);
  const last = endDate.slice(0, 7);

  while (cursor <= last) {
    months.push(`${cursor}-01`);
    if (cursor === last) break;
    cursor = getNextMonth(cursor);
  }

  return months;
};

const monthIntersectsLease = (lease, monthStart) => (
  lease.startDate <= getLastDayOfMonth(monthStart.slice(0, 7))
  && lease.endDate >= monthStart
);

const formatTenantName = (tenant) => {
  const fullName = [tenant?.firstname, tenant?.lastname].filter(Boolean).join(' ').trim();
  return fullName || tenant?.name || '—';
};

const accumulateAmount = (map, key, amount) => {
  map.set(key, roundCurrency(toNumber(map.get(key)) + toNumber(amount)));
};

const getHallBookingDateMode = async () => {
  if (!hallBookingDateModePromise) {
    hallBookingDateModePromise = sequelize.getQueryInterface()
      .describeTable('HallBookings')
      .then((columns) => (
        columns.startDate && columns.endDate ? 'DATE_RANGE' : 'EVENT_DATE'
      ))
      .catch((error) => {
        hallBookingDateModePromise = null;
        throw error;
      });
  }

  return hallBookingDateModePromise;
};

const getRealEstateInsights = async (period) => {
  const months = getMonthsInRange(period.startDate, period.endDate);

  if (months.length === 0) {
    return {
      expenseTrackingAvailable: false,
      expenseTrackingNote: 'Aucune période locative analysable.',
      rentStatus: {
        expected: 0,
        collected: 0,
        outstanding: 0,
        collectionRate: 0,
        activeLeases: 0,
        apartmentsInDebt: 0,
        totalDueMonths: 0,
        paidMonths: 0,
        partialMonths: 0,
        unpaidMonths: 0,
      },
      topApartments: [],
      topBuildings: [],
    };
  }

  const [leases, rentPayments] = await Promise.all([
    Lease.findAll({
      where: {
        startDate: { [Op.lte]: period.endDate },
        endDate: { [Op.gte]: period.startDate },
      },
      include: [
        {
          model: Apartment,
          as: 'apartment',
          attributes: ['id', 'code', 'status', 'buildingId'],
          include: [
            { model: Building, as: 'building', attributes: ['id', 'name'] },
          ],
        },
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'firstname', 'lastname', 'name'],
        },
      ],
    }),
    RentPayment.findAll({
      where: {
        month: {
          [Op.between]: [getMonthStart(months[0]), getMonthStart(months[months.length - 1])],
        },
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

  const rentStatus = {
    expected: 0,
    collected: 0,
    outstanding: 0,
    collectionRate: 0,
    activeLeases: 0,
    apartmentsInDebt: 0,
    totalDueMonths: 0,
    paidMonths: 0,
    partialMonths: 0,
    unpaidMonths: 0,
  };

  const activeLeaseIds = new Set();
  const apartmentMetrics = new Map();
  const buildingMetrics = new Map();

  leases.forEach((lease) => {
    if (!lease.apartment) return;

    const apartment = lease.apartment;
    const building = apartment.building;
    const tenantName = formatTenantName(lease.tenant);

    months.forEach((monthStart) => {
      if (!monthIntersectsLease(lease, monthStart)) return;

      activeLeaseIds.add(lease.id);

      const due = roundCurrency(lease.rentAmount ?? apartment.rentAmount);
      const directPaid = paymentsByLeaseMonth.get(`${lease.id}:${monthStart}`);
      const fallbackPaid = paymentsByApartmentMonth.get(`${apartment.id}:${monthStart}`);
      const paid = roundCurrency(directPaid !== undefined ? directPaid : fallbackPaid);
      const collected = roundCurrency(Math.min(paid, due));
      const outstanding = roundCurrency(Math.max(due - paid, 0));

      rentStatus.expected += due;
      rentStatus.collected += collected;
      rentStatus.outstanding += outstanding;
      rentStatus.totalDueMonths += 1;

      if (paid >= due && due > 0) rentStatus.paidMonths += 1;
      else if (paid > 0) rentStatus.partialMonths += 1;
      else rentStatus.unpaidMonths += 1;

      const apartmentEntry = apartmentMetrics.get(apartment.id) || {
        apartmentId: apartment.id,
        apartmentCode: apartment.code || `APT-${apartment.id}`,
        buildingId: building?.id || null,
        buildingName: building?.name || 'Sans immeuble',
        tenantName,
        occupancyStatus: apartment.status,
        dueMonths: 0,
        expectedRent: 0,
        collectedRent: 0,
        outstandingRent: 0,
        paidMonths: 0,
        partialMonths: 0,
        unpaidMonths: 0,
        expenses: null,
        netProfit: null,
        expenseTrackingAvailable: false,
      };

      apartmentEntry.tenantName = apartmentEntry.tenantName === '—' ? tenantName : apartmentEntry.tenantName;
      apartmentEntry.dueMonths += 1;
      apartmentEntry.expectedRent = roundCurrency(apartmentEntry.expectedRent + due);
      apartmentEntry.collectedRent = roundCurrency(apartmentEntry.collectedRent + collected);
      apartmentEntry.outstandingRent = roundCurrency(apartmentEntry.outstandingRent + outstanding);

      if (paid >= due && due > 0) apartmentEntry.paidMonths += 1;
      else if (paid > 0) apartmentEntry.partialMonths += 1;
      else apartmentEntry.unpaidMonths += 1;

      apartmentMetrics.set(apartment.id, apartmentEntry);

      const buildingKey = building?.id || 'NO_BUILDING';
      const buildingEntry = buildingMetrics.get(buildingKey) || {
        buildingId: building?.id || null,
        buildingName: building?.name || 'Sans immeuble',
        apartmentIds: new Set(),
        dueMonths: 0,
        expectedRent: 0,
        collectedRent: 0,
        outstandingRent: 0,
        paidMonths: 0,
        partialMonths: 0,
        unpaidMonths: 0,
        expenses: null,
        netProfit: null,
        expenseTrackingAvailable: false,
      };

      buildingEntry.apartmentIds.add(apartment.id);
      buildingEntry.dueMonths += 1;
      buildingEntry.expectedRent = roundCurrency(buildingEntry.expectedRent + due);
      buildingEntry.collectedRent = roundCurrency(buildingEntry.collectedRent + collected);
      buildingEntry.outstandingRent = roundCurrency(buildingEntry.outstandingRent + outstanding);

      if (paid >= due && due > 0) buildingEntry.paidMonths += 1;
      else if (paid > 0) buildingEntry.partialMonths += 1;
      else buildingEntry.unpaidMonths += 1;

      buildingMetrics.set(buildingKey, buildingEntry);
    });
  });

  const apartments = Array.from(apartmentMetrics.values())
    .map((entry) => ({
      ...entry,
      collectionRate: entry.expectedRent > 0
        ? Math.round((entry.collectedRent / entry.expectedRent) * 100)
        : 0,
    }))
    .sort((a, b) => (
      b.collectedRent - a.collectedRent
      || a.outstandingRent - b.outstandingRent
      || a.apartmentCode.localeCompare(b.apartmentCode)
    ));

  const buildings = Array.from(buildingMetrics.values())
    .map((entry) => {
      const { apartmentIds, ...rest } = entry;
      return {
        ...rest,
        apartmentsCount: apartmentIds.size,
        collectionRate: entry.expectedRent > 0
        ? Math.round((entry.collectedRent / entry.expectedRent) * 100)
        : 0,
      };
    })
    .sort((a, b) => (
      b.collectedRent - a.collectedRent
      || a.outstandingRent - b.outstandingRent
      || a.buildingName.localeCompare(b.buildingName)
    ));

  rentStatus.expected = roundCurrency(rentStatus.expected);
  rentStatus.collected = roundCurrency(rentStatus.collected);
  rentStatus.outstanding = roundCurrency(rentStatus.outstanding);
  rentStatus.collectionRate = rentStatus.expected > 0
    ? Math.round((rentStatus.collected / rentStatus.expected) * 100)
    : 0;
  rentStatus.activeLeases = activeLeaseIds.size;
  rentStatus.apartmentsInDebt = apartments.filter((entry) => entry.outstandingRent > 0).length;

  return {
    expenseTrackingAvailable: false,
    expenseTrackingNote: 'La rentabilité nette par appartement / immeuble nécessite encore des charges rattachées à ces biens. La vue actuelle présente la performance locative brute (loyers dus, encaissés et impayés).',
    rentStatus,
    topApartments: apartments.slice(0, 5),
    topBuildings: buildings.slice(0, 5),
  };
};

const sumField = async (Model, fieldName, where) => {
  const row = await Model.findOne({
    attributes: [[fn('SUM', col(fieldName)), 'total']],
    where,
    raw: true,
  });

  return toNumber(row?.total);
};

const getGroupedCounts = async (Model, statuses, where) => {
  const rows = await Model.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    where: { ...where, status: { [Op.in]: statuses } },
    group: ['status'],
    raw: true,
  });

  const counts = statuses.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
  rows.forEach((row) => {
    counts[row.status] = Number(row.count) || 0;
  });

  return counts;
};

const buildPeriod = (query) => {
  const { month, startDate, endDate } = query;

  if (month && (startDate || endDate)) {
    throw ApiError.badRequest('Use either month or startDate/endDate, not both.');
  }

  if (month) {
    if (!isValidMonth(month)) {
      throw ApiError.badRequest('month must be in YYYY-MM format.');
    }

    const rangeStart = `${month}-01`;
    const rangeEnd = getLastDayOfMonth(month);

    return {
      type: 'month',
      month,
      startDate: rangeStart,
      endDate: rangeEnd,
      days: countDaysInclusive(rangeStart, rangeEnd),
      label: formatPeriodLabel(rangeStart, rangeEnd, 'month'),
    };
  }

  if (startDate || endDate) {
    if (!startDate || !endDate) {
      throw ApiError.badRequest('startDate and endDate are required together.');
    }
    if (!isValidDateOnly(startDate) || !isValidDateOnly(endDate)) {
      throw ApiError.badRequest('startDate and endDate must be valid dates in YYYY-MM-DD format.');
    }
    if (new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) {
      throw ApiError.badRequest('endDate must be greater than or equal to startDate.');
    }

    return {
      type: 'custom',
      month: null,
      startDate,
      endDate,
      days: countDaysInclusive(startDate, endDate),
      label: formatPeriodLabel(startDate, endDate, 'custom'),
    };
  }

  const currentMonth = todayStr().slice(0, 7);
  const rangeStart = `${currentMonth}-01`;
  const rangeEnd = getLastDayOfMonth(currentMonth);

  return {
    type: 'month',
    month: currentMonth,
    startDate: rangeStart,
    endDate: rangeEnd,
    days: countDaysInclusive(rangeStart, rangeEnd),
    label: formatPeriodLabel(rangeStart, rangeEnd, 'month'),
  };
};

// ─── GET /api/dashboard ───────────────────────────────────────────────────────
/**
 * Aggregated KPI snapshot for the dashboard with optional filtering:
 *   ?month=2026-04
 *   or ?startDate=2026-04-01&endDate=2026-04-30
 */
const getDashboard = async (req, res, next) => {
  try {
    const period = buildPeriod(req.query);
    const today = todayStr();
    const periodEndExclusive = addDays(period.endDate, 1);
    const hallBookingDateMode = await getHallBookingDateMode();

    const periodPaymentWhere = {
      paymentDate: { [Op.between]: [period.startDate, period.endDate] },
    };

    const roomBookingOverlapWhere = {
      checkInDate: { [Op.lt]: periodEndExclusive },
      checkOutDate: { [Op.gt]: period.startDate },
    };

    const hallBookingOverlapWhere = hallBookingDateMode === 'DATE_RANGE'
      ? {
          startDate: { [Op.lte]: period.endDate },
          endDate: { [Op.gte]: period.startDate },
        }
      : {
          eventDate: { [Op.between]: [period.startDate, period.endDate] },
        };

    const periodDateTimeRange = {
      [Op.between]: [`${period.startDate} 00:00:00`, `${period.endDate} 23:59:59`],
    };

    const [
      totalRooms,
      occupiedRoomsNow,
      availableRoomsNow,
      occupiedRoomIdsInPeriod,
      totalHalls,
      bookedHallIdsInPeriod,
      totalApartments,
      occupiedApartments,
      totalEmployees,
      roomRevenue,
      hallRevenue,
      apartmentRevenueFromPayments,
      todayPaymentRevenue,
      hotelExpensePayments,
      rentRevenue,
      todayRentRevenue,
      salaryExpenses,
      stockExpenses,
      roomBookingCounts,
      roomCheckIns,
      hallBookingCounts,
      lowStockItems,
      realEstate,
    ] = await Promise.all([
      Room.count(),
      Room.count({ where: { status: 'OCCUPIED' } }),
      Room.count({ where: { status: 'AVAILABLE' } }),
      Booking.count({
        distinct: true,
        col: 'roomId',
        where: {
          ...roomBookingOverlapWhere,
          status: { [Op.in]: ROOM_BOOKING_ACTIVE_STATUSES },
        },
      }),
      Hall.count(),
      HallBooking.count({
        distinct: true,
        col: 'hallId',
        where: {
          ...hallBookingOverlapWhere,
          status: { [Op.in]: HALL_BOOKING_ACTIVE_STATUSES },
        },
      }),
      Apartment.count(),
      Apartment.count({ where: { status: 'OCCUPIED' } }),
      Employee.count(),
      sumField(Payment, 'amount', {
        ...periodPaymentWhere,
        referenceType: 'ROOM',
      }),
      sumField(Payment, 'amount', {
        ...periodPaymentWhere,
        referenceType: 'HALL',
      }),
      sumField(Payment, 'amount', {
        ...periodPaymentWhere,
        referenceType: 'APARTMENT',
      }),
      sumField(Payment, 'amount', {
        paymentDate: today,
        referenceType: { [Op.in]: ['ROOM', 'HALL', 'APARTMENT'] },
      }),
      sumField(Payment, 'amount', {
        ...periodPaymentWhere,
        referenceType: 'EXPENSE',
      }),
      sumField(RentPayment, 'amount', {
        paymentDate: { [Op.between]: [period.startDate, period.endDate] },
      }),
      sumField(RentPayment, 'amount', {
        paymentDate: today,
      }),
      sumField(SalaryPayment, 'amount', {
        paymentDate: { [Op.between]: [period.startDate, period.endDate] },
      }),
      sumField(PurchaseRequest, 'totalPrice', {
        status: { [Op.in]: ['ORDERED', 'DELIVERED'] },
        updatedAt: periodDateTimeRange,
      }),
      getGroupedCounts(Booking, ROOM_BOOKING_ALL_STATUSES, roomBookingOverlapWhere),
      Booking.count({
        where: {
          checkInDate: { [Op.between]: [period.startDate, period.endDate] },
          status: { [Op.in]: ROOM_BOOKING_ACTIVE_STATUSES },
        },
      }),
      getGroupedCounts(HallBooking, HALL_BOOKING_ALL_STATUSES, hallBookingOverlapWhere),
      Item.findAll({
        where: { quantity: { [Op.lte]: LOW_STOCK_THRESHOLD } },
        attributes: ['id', 'name', 'category', 'quantity'],
        order: [['quantity', 'ASC']],
      }),
      getRealEstateInsights(period),
    ]);

    const apartmentRevenue = apartmentRevenueFromPayments + rentRevenue;
    const totalRevenue = roomRevenue + hallRevenue + apartmentRevenue;
    const totalExpenses = hotelExpensePayments + salaryExpenses + stockExpenses;
    const netProfit = totalRevenue - totalExpenses;
    const roomsOccupiedInPeriod = Number(occupiedRoomIdsInPeriod) || 0;
    const hallsBookedInPeriod = Number(bookedHallIdsInPeriod) || 0;
    const todayRevenue = todayPaymentRevenue + todayRentRevenue;

    const data = {
      period,
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
      },
      rooms: {
        total: totalRooms,
        occupied: roomsOccupiedInPeriod,
        available: Math.max(totalRooms - roomsOccupiedInPeriod, 0),
        occupiedNow: occupiedRoomsNow,
        availableNow: availableRoomsNow,
        occupancyRate: totalRooms > 0
          ? Math.round((roomsOccupiedInPeriod / totalRooms) * 100)
          : 0,
      },
      halls: {
        total: totalHalls,
        booked: hallsBookedInPeriod,
        available: Math.max(totalHalls - hallsBookedInPeriod, 0),
        occupancyRate: totalHalls > 0
          ? Math.round((hallsBookedInPeriod / totalHalls) * 100)
          : 0,
      },
      apartments: {
        total: totalApartments,
        occupied: occupiedApartments,
        available: Math.max(totalApartments - occupiedApartments, 0),
      },
      employees: {
        total: totalEmployees,
      },
      totalEmployees,
      bookings: {
        total: Object.values(roomBookingCounts).reduce((sum, value) => sum + value, 0),
        pending: roomBookingCounts.PENDING,
        confirmed: roomBookingCounts.CONFIRMED,
        cancelled: roomBookingCounts.CANCELLED,
        completed: roomBookingCounts.COMPLETED,
        arrivals: roomCheckIns,
      },
      hallBookings: {
        total: Object.values(hallBookingCounts).reduce((sum, value) => sum + value, 0),
        pending: hallBookingCounts.PENDING,
        confirmed: hallBookingCounts.CONFIRMED,
        cancelled: hallBookingCounts.CANCELLED,
      },
      revenue: {
        total: totalRevenue,
        monthly: totalRevenue,
        today: todayRevenue,
        room: roomRevenue,
        hall: hallRevenue,
        apartment: apartmentRevenue,
        rent: rentRevenue,
      },
      expenses: {
        total: totalExpenses,
        salaries: salaryExpenses,
        stock: stockExpenses,
        other: hotelExpensePayments,
      },
      realEstate,
      lowStockItems: {
        threshold: LOW_STOCK_THRESHOLD,
        count: lowStockItems.length,
        items: lowStockItems,
      },
      generatedAt: new Date().toISOString(),
    };

    res.status(200).json(ApiResponse.success('Dashboard data fetched successfully', data));
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };

