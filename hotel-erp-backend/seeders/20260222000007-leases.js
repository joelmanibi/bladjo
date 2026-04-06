'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.bulkInsert(
      'Leases',
      [
        {
          tenantId:    1,
          apartmentId: 1,
          startDate:   '2026-01-01',
          endDate:     '2026-12-31',
          rentAmount:  300000.00,
          deposit:     600000.00,
          monthlyRent: 300000.00, // rétrocompatibilité
          status:      'active',
          createdAt:   new Date(),
          updatedAt:   new Date(),
        },
      ],
      { ignoreDuplicates: true }
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete(
      'Leases',
      { tenantId: 1, apartmentId: 1, startDate: '2026-01-01' },
      {}
    );
  },
};

