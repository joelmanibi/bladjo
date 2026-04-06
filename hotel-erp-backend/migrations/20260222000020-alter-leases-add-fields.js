'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ajouter rentAmount (remplace monthlyRent dans la nouvelle architecture)
    await queryInterface.addColumn('Leases', 'rentAmount', {
      type:         Sequelize.DECIMAL(12, 2),
      allowNull:    true,   // null pour les anciens enregistrements
      defaultValue: null,
      after:        'endDate',
    });

    // Ajouter deposit (caution)
    await queryInterface.addColumn('Leases', 'deposit', {
      type:         Sequelize.DECIMAL(12, 2),
      allowNull:    true,
      defaultValue: null,
      after:        'rentAmount',
    });

    // Ajouter status (active | ended)
    await queryInterface.addColumn('Leases', 'status', {
      type:         Sequelize.ENUM('active', 'ended'),
      allowNull:    false,
      defaultValue: 'active',
      after:        'deposit',
    });
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.removeColumn('Leases', 'rentAmount');
    await queryInterface.removeColumn('Leases', 'deposit');
    await queryInterface.removeColumn('Leases', 'status');
  },
};

