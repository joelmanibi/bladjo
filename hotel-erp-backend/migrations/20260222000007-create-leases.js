'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Leases', {
      id: {
        type:          Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey:    true,
        allowNull:     false,
      },
      apartmentId: {
        type:      Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Apartments', key: 'id' },
        onUpdate:  'CASCADE',
        onDelete:  'RESTRICT',
      },
      tenantId: {
        type:      Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Tenants', key: 'id' },
        onUpdate:  'CASCADE',
        onDelete:  'RESTRICT',
      },
      startDate: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      monthlyRent: {
        type:      Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      createdAt: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type:      Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('Leases', ['apartmentId'], {
      name: 'leases_apartment_id_index',
    });

    await queryInterface.addIndex('Leases', ['tenantId'], {
      name: 'leases_tenant_id_index',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Leases');
  },
};

