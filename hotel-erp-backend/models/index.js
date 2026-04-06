'use strict';

/**
 * Central model registry.
 *
 * Import models here and attach any associations.
 * All other files should import from this file, NOT from individual model files.
 *
 * @example
 *   const { User, Room, Booking, Apartment, Tenant, Lease, Hall, HallBooking, Item, PurchaseRequest, StockMovement, Employee, SalaryPayment, Payment, Building } = require('../models');
 */

const { sequelize } = require('../config/database');

// ── Model registration ────────────────────────────────────────────────────────
const User        = require('./User')(sequelize);
const Room        = require('./Room')(sequelize);
const Booking     = require('./Booking')(sequelize);
// ── Apartments module (modular architecture — replaces legacy models/Apartment.js)
const Apartment   = require('../modules/apartments/apartment.model')(sequelize);
// ── Tenants module (modular architecture — replaces legacy models/Tenant.js)
const Tenant      = require('../modules/tenants/tenant.model')(sequelize);
// ── Leases module (modular architecture — replaces legacy models/Lease.js)
const Lease       = require('../modules/leases/lease.model')(sequelize);
const Hall        = require('./Hall')(sequelize);
const HallBooking = require('./HallBooking')(sequelize);
const Item            = require('./Item')(sequelize);
const PurchaseRequest = require('./PurchaseRequest')(sequelize);
const StockMovement   = require('./StockMovement')(sequelize);
const Employee        = require('./Employee')(sequelize);
const SalaryPayment   = require('./SalaryPayment')(sequelize);
const Payment         = require('./Payment')(sequelize);

// ── Buildings module (modular architecture) ───────────────────────────────────
const Building        = require('../modules/buildings/building.model')(sequelize);

// ── Floors module (modular architecture) ──────────────────────────────────────
const Floor           = require('../modules/floors/floor.model')(sequelize);

// ── RentPayments module (modular architecture) ────────────────────────────────
const RentPayment     = require('../modules/rent-payments/rentPayment.model')(sequelize);

// ── Associations ──────────────────────────────────────────────────────────────

// Room ↔ Booking  (one room can have many bookings)
Room.hasMany(Booking,    { foreignKey: 'roomId', as: 'bookings' });
Booking.belongsTo(Room,  { foreignKey: 'roomId', as: 'room'     });

// Apartment ↔ Lease  (one apartment can have many leases over time)
Apartment.hasMany(Lease,       { foreignKey: 'apartmentId', as: 'leases'    });
Lease.belongsTo(Apartment,     { foreignKey: 'apartmentId', as: 'apartment' });

// Tenant ↔ Lease  (one tenant can have many leases)
Tenant.hasMany(Lease,              { foreignKey: 'tenantId',    as: 'leases' });
Lease.belongsTo(Tenant,            { foreignKey: 'tenantId',    as: 'tenant' });

// Hall ↔ HallBooking  (one hall can have many bookings)
Hall.hasMany(HallBooking,          { foreignKey: 'hallId', as: 'bookings' });
HallBooking.belongsTo(Hall,        { foreignKey: 'hallId', as: 'hall'     });

// Item ↔ PurchaseRequest  (one item can have many purchase requests)
Item.hasMany(PurchaseRequest,            { foreignKey: 'itemId', as: 'purchaseRequests' });
PurchaseRequest.belongsTo(Item,          { foreignKey: 'itemId', as: 'item'             });

// Item ↔ StockMovement  (one item can have many stock movements)
Item.hasMany(StockMovement,              { foreignKey: 'itemId', as: 'stockMovements'   });
StockMovement.belongsTo(Item,            { foreignKey: 'itemId', as: 'item'             });

// Employee ↔ SalaryPayment  (one employee can have many salary payments)
Employee.hasMany(SalaryPayment,          { foreignKey: 'employeeId', as: 'salaryPayments' });
SalaryPayment.belongsTo(Employee,        { foreignKey: 'employeeId', as: 'employee'       });

// Payment has no FK associations — referenceType is an enum label, not a FK.
// referenceId is a soft link only (no DB constraint).

// Building ↔ Floor  (one building has many floors)
Building.hasMany(Floor,   { foreignKey: 'buildingId', as: 'floors'   });
Floor.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

// RentPayment associations
Lease.hasMany(RentPayment,          { foreignKey: 'leaseId',     as: 'rentPayments' });
RentPayment.belongsTo(Lease,        { foreignKey: 'leaseId',     as: 'lease'        });
Tenant.hasMany(RentPayment,         { foreignKey: 'tenantId',    as: 'rentPayments' });
RentPayment.belongsTo(Tenant,       { foreignKey: 'tenantId',    as: 'tenant'       });
Apartment.hasMany(RentPayment,      { foreignKey: 'apartmentId', as: 'rentPayments' });
RentPayment.belongsTo(Apartment,    { foreignKey: 'apartmentId', as: 'apartment'    });

// Building ↔ Apartment  (one building has many apartments)
Building.hasMany(Apartment,   { foreignKey: 'buildingId', as: 'apartments' });
Apartment.belongsTo(Building, { foreignKey: 'buildingId', as: 'building'   });

// Floor ↔ Apartment  (one floor has many apartments)
Floor.hasMany(Apartment,   { foreignKey: 'floorId', as: 'apartments' });
Apartment.belongsTo(Floor, { foreignKey: 'floorId', as: 'floor'      });

module.exports = {
  sequelize,
  User,
  Room,
  Booking,
  Apartment,
  Tenant,
  Lease,
  Hall,
  HallBooking,
  Item,
  PurchaseRequest,
  StockMovement,
  Employee,
  SalaryPayment,
  Payment,
  Building,
  Floor,
  RentPayment,
};

