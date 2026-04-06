'use strict';

const { Model, DataTypes } = require('sequelize');

/**
 * Floor model — represents one level (étage) of a Building.
 *
 * Relations:
 *   Floor.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' })
 *   Building.hasMany(Floor,   { foreignKey: 'buildingId', as: 'floors'   })
 */
module.exports = (sequelize) => {
  class Floor extends Model {}

  Floor.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      buildingId: {
        type:       DataTypes.INTEGER,
        allowNull:  false,
        references: { model: 'Buildings', key: 'id' },
        onDelete:   'CASCADE',
        validate: {
          notNull: { msg: "L'identifiant de l'immeuble est obligatoire" },
        },
      },
      floorNumber: {
        type:      DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt:   { msg: 'Le numéro du niveau doit être un entier' },
          notNull: { msg: 'Le numéro du niveau est obligatoire' },
        },
      },
      label: {
        type:      DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le libellé du niveau est obligatoire (ex : RDC, R+1)' },
        },
      },
    },
    {
      sequelize,
      modelName:  'Floor',
      tableName:  'Floors',
      timestamps: true,
    }
  );

  return Floor;
};

