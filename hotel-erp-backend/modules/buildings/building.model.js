'use strict';

const { Model, DataTypes } = require('sequelize');

/**
 * Building model — represents a real-estate building managed by the ERP.
 *
 * Future relations (to be added later):
 *   Building.hasMany(Apartment, { foreignKey: 'buildingId', as: 'apartments' })
 */
module.exports = (sequelize) => {
  class Building extends Model {}

  Building.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      name: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Le nom de l'immeuble est obligatoire" },
        },
      },
      address: {
        type:      DataTypes.STRING(255),
        allowNull: true,
      },
      city: {
        type:      DataTypes.STRING(100),
        allowNull: true,
      },
      country: {
        type:         DataTypes.STRING(100),
        allowNull:    true,
        defaultValue: "Côte d'Ivoire",
      },
      numberOfFloors: {
        type:      DataTypes.INTEGER,
        allowNull: true,
        validate: {
          isInt: { msg: "Le nombre d'étages doit être un entier" },
          min:   { args: [0], msg: "Le nombre d'étages doit être >= 0" },
        },
      },
      description: {
        type:      DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName:  'Building',
      tableName:  'Buildings',
      timestamps: true,
    }
  );

  return Building;
};

