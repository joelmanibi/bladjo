'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RentPayments', {
      id: {
        type:          Sequelize.INTEGER,
        allowNull:     false,
        autoIncrement: true,
        primaryKey:    true,
      },
      leaseId: {
        type:       Sequelize.INTEGER,
        allowNull:  true,
        references: { model: 'Leases', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'SET NULL',
      },
      tenantId: {
        type:       Sequelize.INTEGER,
        allowNull:  false,
        references: { model: 'Tenants', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'RESTRICT',
      },
      apartmentId: {
        type:       Sequelize.INTEGER,
        allowNull:  false,
        references: { model: 'Apartments', key: 'id' },
        onUpdate:   'CASCADE',
        onDelete:   'RESTRICT',
      },
      amount: {
        type:      Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      month: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
        comment:   'Premier jour du mois concerné (ex : 2024-03-01)',
      },
      paymentDate: {
        type:      Sequelize.DATEONLY,
        allowNull: false,
      },
      notes: {
        type:      Sequelize.TEXT,
        allowNull: true,
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

    // Index pour accélérer les recherches par locataire, appartement, bail
    await queryInterface.addIndex('RentPayments', ['tenantId'],    { name: 'rent_payments_tenantId_idx'    });
    await queryInterface.addIndex('RentPayments', ['apartmentId'], { name: 'rent_payments_apartmentId_idx' });
    await queryInterface.addIndex('RentPayments', ['leaseId'],     { name: 'rent_payments_leaseId_idx'     });
    await queryInterface.addIndex('RentPayments', ['month'],       { name: 'rent_payments_month_idx'       });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('RentPayments', 'rent_payments_tenantId_idx');
    await queryInterface.removeIndex('RentPayments', 'rent_payments_apartmentId_idx');
    await queryInterface.removeIndex('RentPayments', 'rent_payments_leaseId_idx');
    await queryInterface.removeIndex('RentPayments', 'rent_payments_month_idx');
    await queryInterface.dropTable('RentPayments');
  },
};

