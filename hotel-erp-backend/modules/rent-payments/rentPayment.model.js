'use strict';

const { Model, DataTypes } = require('sequelize');

/**
 * RentPayment — enregistrement d'un paiement de loyer.
 *
 * Relations (déclarées dans models/index.js) :
 *   Lease.hasMany(RentPayment,     { foreignKey: 'leaseId',     as: 'rentPayments' })
 *   Tenant.hasMany(RentPayment,    { foreignKey: 'tenantId',    as: 'rentPayments' })
 *   Apartment.hasMany(RentPayment, { foreignKey: 'apartmentId', as: 'rentPayments' })
 *   RentPayment.belongsTo(Lease,     { foreignKey: 'leaseId',     as: 'lease'     })
 *   RentPayment.belongsTo(Tenant,    { foreignKey: 'tenantId',    as: 'tenant'    })
 *   RentPayment.belongsTo(Apartment, { foreignKey: 'apartmentId', as: 'apartment' })
 */
module.exports = (sequelize) => {
  class RentPayment extends Model {}

  RentPayment.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      leaseId: {
        type:      DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Leases', key: 'id' },
        onUpdate:  'CASCADE',
        onDelete:  'SET NULL',
      },
      tenantId: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Tenants', key: 'id' },
        onUpdate:  'CASCADE',
        onDelete:  'RESTRICT',
      },
      apartmentId: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Apartments', key: 'id' },
        onUpdate:  'CASCADE',
        onDelete:  'RESTRICT',
      },
      amount: {
        type:      DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Le montant doit être un nombre valide' },
          min:       { args: [0], msg: 'Le montant doit être supérieur ou égal à 0' },
        },
      },
      month: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        comment:   'Premier jour du mois concerné (ex : 2024-03-01)',
      },
      paymentDate: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: { msg: 'La date de paiement doit être valide' },
        },
      },
      notes: {
        type:      DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName:  'RentPayment',
      tableName:  'RentPayments',
      timestamps: true,
    }
  );

  return RentPayment;
};

