'use strict';

const { Model, DataTypes } = require('sequelize');

/**
 * Tenant model — représente un locataire d'appartement.
 *
 * Relations :
 *   Tenant.hasMany(Lease, { foreignKey: 'tenantId', as: 'leases' })
 */
module.exports = (sequelize) => {
  class Tenant extends Model {}

  Tenant.init(
    {
      id: {
        type:          DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
      },
      firstname: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le prénom est obligatoire' },
          len:      { args: [2, 100], msg: 'Le prénom doit contenir entre 2 et 100 caractères' },
        },
      },
      lastname: {
        type:      DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le nom est obligatoire' },
          len:      { args: [2, 100], msg: 'Le nom doit contenir entre 2 et 100 caractères' },
        },
      },
      // Maintenu pour rétrocompatibilité avec leaseController et autres modules
      name: {
        type:      DataTypes.STRING(100),
        allowNull: true,
      },
      phone: {
        type:      DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Le numéro de téléphone est obligatoire' },
        },
      },
      email: {
        type:      DataTypes.STRING(255),
        allowNull: false,
        unique:    true,
        set(value) {
          this.setDataValue('email', value ? value.toLowerCase().trim() : value);
        },
        validate: {
          isEmail:  { msg: 'Adresse email invalide' },
          notEmpty: { msg: "L'email est obligatoire" },
        },
      },
      identityNumber: {
        type:      DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName:  'Tenant',
      tableName:  'Tenants',
      timestamps: true,
    }
  );

  return Tenant;
};

