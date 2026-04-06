'use strict';

const { Model, DataTypes } = require('sequelize');

/**
 * Lease model — contrat de location entre un locataire et un appartement.
 *
 * Relations (déclarées dans models/index.js) :
 *   Tenant.hasMany(Lease,    { foreignKey: 'tenantId',    as: 'leases'    })
 *   Apartment.hasMany(Lease, { foreignKey: 'apartmentId', as: 'leases'    })
 *   Lease.belongsTo(Tenant,    { foreignKey: 'tenantId',    as: 'tenant'    })
 *   Lease.belongsTo(Apartment, { foreignKey: 'apartmentId', as: 'apartment' })
 */
module.exports = (sequelize) => {
  class Lease extends Model {
    /** Renvoie true si le bail est en cours aujourd'hui. */
    isActive() {
      const today = new Date();
      return new Date(this.startDate) <= today && today <= new Date(this.endDate);
    }
  }

  Lease.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      tenantId: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Tenants',    key: 'id' },
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
      startDate: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: { msg: 'La date de début doit être valide' },
        },
      },
      endDate: {
        type:      DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: { msg: 'La date de fin doit être valide' },
          isAfterStart(value) {
            if (new Date(value) <= new Date(this.startDate)) {
              throw new Error('La date de fin doit être postérieure à la date de début');
            }
          },
        },
      },
      rentAmount: {
        type:      DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Le loyer doit être un nombre valide' },
          min:       { args: [0], msg: 'Le loyer doit être supérieur ou égal à 0' },
        },
      },
      deposit: {
        type:      DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
        validate: {
          min: { args: [0], msg: 'La caution doit être supérieure ou égale à 0' },
        },
      },
      status: {
        type:         DataTypes.ENUM('active', 'ended'),
        allowNull:    false,
        defaultValue: 'active',
        validate: {
          isIn: { args: [['active', 'ended']], msg: 'Le statut doit être "active" ou "ended"' },
        },
      },
      // Rétrocompatibilité avec l'ancien champ monthlyRent
      monthlyRent: {
        type:      DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName:  'Lease',
      tableName:  'Leases',
      timestamps: true,
    }
  );

  return Lease;
};

