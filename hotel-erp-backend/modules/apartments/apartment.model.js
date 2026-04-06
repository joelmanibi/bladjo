'use strict';

const { Model, DataTypes } = require('sequelize');

const APARTMENT_STATUSES = ['AVAILABLE', 'OCCUPIED'];

/**
 * Apartment model — represents a rental unit inside a Building on a specific Floor.
 *
 * Relations:
 *   Apartment.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' })
 *   Apartment.belongsTo(Floor,    { foreignKey: 'floorId',    as: 'floor'    })
 *   Apartment.hasMany  (Lease,    { foreignKey: 'apartmentId',as: 'leases'   })
 */
module.exports = (sequelize) => {
  class Apartment extends Model {}

  Apartment.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      buildingId: {
        type:       DataTypes.INTEGER,
        allowNull:  true,
        references: { model: 'Buildings', key: 'id' },
        onDelete:   'SET NULL',
        validate: {
          isInt: { msg: "buildingId doit être un entier" },
        },
      },
      floorId: {
        type:       DataTypes.INTEGER,
        allowNull:  true,
        references: { model: 'Floors', key: 'id' },
        onDelete:   'SET NULL',
        validate: {
          isInt: { msg: "floorId doit être un entier" },
        },
      },
      code: {
        type:      DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Le code de l'appartement est obligatoire (ex : AP1)" },
        },
      },
      rooms: {
        type:      DataTypes.INTEGER,
        allowNull: true,
        validate: {
          isInt: { msg: "Le nombre de pièces doit être un entier" },
          min:   { args: [1], msg: "Le nombre de pièces doit être >= 1" },
        },
      },
      bathrooms: {
        type:      DataTypes.INTEGER,
        allowNull: true,
        validate: {
          isInt: { msg: "Le nombre de salles de bain doit être un entier" },
          min:   { args: [0], msg: "Le nombre de salles de bain doit être >= 0" },
        },
      },
      area: {
        type:      DataTypes.FLOAT,
        allowNull: true,
        validate: {
          isFloat: { msg: "La superficie doit être un nombre valide" },
          min:     { args: [0], msg: "La superficie doit être >= 0" },
        },
      },
      rentAmount: {
        type:      DataTypes.DECIMAL(12, 2),
        allowNull: true,
        validate: {
          isDecimal: { msg: "Le loyer doit être un nombre valide" },
          min:       { args: [0], msg: "Le loyer doit être >= 0" },
        },
      },
      status: {
        type:         DataTypes.ENUM(...APARTMENT_STATUSES),
        allowNull:    false,
        defaultValue: 'AVAILABLE',
        validate: {
          isIn: { args: [APARTMENT_STATUSES], msg: "Statut invalide : AVAILABLE ou OCCUPIED attendu" },
        },
      },
      description: {
        type:      DataTypes.TEXT,
        allowNull: true,
      },
      images: {
        type:      DataTypes.JSON,
        allowNull: true,
        comment:   'Array of image filenames stored in uploads/apartments/',
        get() {
          const raw = this.getDataValue('images');
          if (!raw) return null;
          if (Array.isArray(raw)) return raw;
          try { return JSON.parse(raw); } catch (_) { return []; }
        },
      },
    },
    {
      sequelize,
      modelName:  'Apartment',
      tableName:  'Apartments',
      timestamps: true,
    }
  );

  return Apartment;
};

module.exports.APARTMENT_STATUSES = APARTMENT_STATUSES;

